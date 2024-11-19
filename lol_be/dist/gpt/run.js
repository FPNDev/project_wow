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
exports.startRunOnThread = exports.abortRunOnThread = exports.handleRunStreamEnd = void 0;
const openai_1 = require("../openai");
const ThreadRun = {};
const abortRunOnThread = (threadId) => __awaiter(void 0, void 0, void 0, function* () {
    const runStream = ThreadRun[threadId];
    if (runStream) {
        let currentRun = runStream.currentRun();
        if (!currentRun) {
            currentRun = yield new Promise((resolve) => {
                runStream.on('event', (ev) => {
                    resolve(ev.data);
                });
            });
        }
        if (currentRun.status === 'queued' ||
            currentRun.status === 'expired' ||
            currentRun.status === 'cancelled' ||
            currentRun.status === 'completed' ||
            currentRun.status === 'failed') {
            if (!runStream.aborted) {
                runStream.abort();
            }
            else {
                return;
            }
        }
        yield openai_1.openai.beta.threads.runs
            .cancel(threadId, currentRun.id)
            .catch((e) => {
            if (e.status !== 400
            /* likely actually cancelled! */
            ) {
                throw e;
            }
        });
        return handleRunStreamEnd(runStream);
    }
});
exports.abortRunOnThread = abortRunOnThread;
const startRunOnThread = (threadId) => {
    const stream = openai_1.openai.beta.threads.runs.stream(threadId, {
        assistant_id: openai_1.assistantId,
        max_completion_tokens: 3500,
    });
    ThreadRun[threadId] = stream;
    handleRunStreamEnd(stream).then(() => {
        delete ThreadRun[threadId];
    });
    return stream;
};
exports.startRunOnThread = startRunOnThread;
const handleRunStreamEnd = (stream) => {
    if (isRunStreamOver(stream)) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        stream.on('event', (e) => {
            if (e.event === 'thread.run.completed' ||
                e.event === 'thread.run.cancelled' ||
                e.event === 'thread.run.failed' ||
                e.event === 'thread.run.expired') {
                resolve(e);
            }
        });
        stream.on('error', (_) => {
            resolve();
        });
        stream.on('abort', (_) => {
            resolve();
        });
    });
};
exports.handleRunStreamEnd = handleRunStreamEnd;
const isRunStreamOver = (stream) => {
    const currentRun = stream.currentRun();
    if (currentRun) {
        if (currentRun.status === 'cancelled' ||
            currentRun.status === 'expired' ||
            currentRun.status === 'completed' ||
            currentRun.status === 'failed') {
            return true;
        }
    }
    return stream.aborted;
};
