"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageReceiveDelta = exports.sendMessage = void 0;
const observable_1 = require("../observable");
const openai_1 = require("../openai");
const run_1 = require("./run");
const functions_1 = require("./functions");
const MessageQueue = {};
const queueRunning = {};
const sendMessage = (threadId, message) => new Promise((resolve) => {
    let textValue = '';
    const textDelta$ = sendMessageReceiveDelta(threadId, message);
    textDelta$.subscribe((delta) => {
        textValue += delta;
    });
    textDelta$.subscribeDone(() => resolve(textValue));
});
exports.sendMessage = sendMessage;
const sendMessageReceiveDelta = (threadId, message) => {
    const onTextDelta$ = (0, observable_1.Observable)();
    const queueEntry = [{ message }, onTextDelta$];
    if (!queueRunning[threadId]) {
        MessageQueue[threadId] = [queueEntry];
        runMessageQueue(threadId);
    }
    else {
        MessageQueue[threadId].push(queueEntry);
    }
    return onTextDelta$;
};
exports.sendMessageReceiveDelta = sendMessageReceiveDelta;
const runMessageQueue = (threadId) => __awaiter(void 0, void 0, void 0, function* () {
    queueRunning[threadId] = true;
    let activeRunStream;
    const [{ message }, onTextDelta$] = MessageQueue[threadId].shift();
    const createMessageAndStream = () => __awaiter(void 0, void 0, void 0, function* () {
        const handleAPIError = (restartRequest = false) => {
            if (restartRequest) {
                MessageQueue[threadId].unshift([{ message }, onTextDelta$]);
                setTimeout(() => runMessageQueue(threadId), 5000);
            }
            else {
                onTextDelta$.done();
            }
        };
        onTextDelta$.subscribeDone(() => {
            disableRunStreamListeners();
            if (MessageQueue[threadId].length) {
                runMessageQueue(threadId);
            }
            else {
                queueRunning[threadId] = false;
            }
        });
        try {
            yield openai_1.openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: message,
            });
        }
        catch (e) {
            if (e &&
                e.type === 'invalid_request_error' &&
                (e.status === 404 || e.status === 400)) {
                handleAPIError(e.status === 400);
                return;
            }
            throw e;
        }
        try {
            activeRunStream = (0, run_1.startRunOnThread)(threadId);
        }
        catch (_) {
            handleAPIError(true);
            return;
        }
        listenToRunStream();
    });
    createMessageAndStream();
    const listenToRunStream = () => {
        activeRunStream.on('event', handleStreamEvent);
        activeRunStream.on('textDelta', handleTextDelta);
        activeRunStream.on('error', onTextDelta$.done);
        activeRunStream.on('abort', onTextDelta$.done);
    };
    const disableRunStreamListeners = () => {
        if (activeRunStream) {
            activeRunStream.off('event', handleStreamEvent);
            activeRunStream.off('textDelta', handleTextDelta);
            activeRunStream.off('error', onTextDelta$.done);
            activeRunStream.off('abort', onTextDelta$.done);
        }
    };
    const handleStreamEvent = (ev) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (ev.event === 'thread.run.requires_action' && ev.data.required_action) {
            disableRunStreamListeners();
            activeRunStream = yield openai_1.openai.beta.threads.runs.submitToolOutputsStream(threadId, ev.data.id, { tool_outputs: yield (0, functions_1.handleFunctions)(ev.data.required_action) });
            listenToRunStream();
        }
        else if (ev.event === 'thread.run.failed' &&
            ((_a = ev.data.last_error) === null || _a === void 0 ? void 0 : _a.code) === 'rate_limit_exceeded') {
            disableRunStreamListeners();
            setTimeout(createMessageAndStream, getTimeoutAmountFromErrorMessage(ev.data.last_error.message, ev.data.failed_at));
        }
        else if (ev.event === 'thread.run.completed' ||
            ev.event === 'thread.run.cancelled' ||
            ev.event === 'thread.run.failed' ||
            ev.event === 'thread.run.expired') {
            onTextDelta$.done();
        }
    });
    const handleTextDelta = (textDelta) => {
        if (textDelta.value) {
            onTextDelta$.notify(textDelta.value);
        }
    };
});
const getTimeoutAmountFromErrorMessage = (errMessage, failedAt) => {
    var _a;
    const matchedTime = (_a = errMessage.match(/(\d+\.\d+)s/)) === null || _a === void 0 ? void 0 : _a[1];
    return matchedTime
        ? failedAt - Date.now() / 1000 + +matchedTime * 1000
        : 5000;
};
