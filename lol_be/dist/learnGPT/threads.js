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
exports.markThreadInactive = exports.markThreadActive = exports.doesThreadExist = exports.setThreadTopic = exports.createThread = void 0;
const gpt_1 = require("../gpt");
const openai_1 = require("../openai");
const response_1 = require("./response");
const ActiveThreads = new Set();
const doesThreadExist = (threadId) => __awaiter(void 0, void 0, void 0, function* () {
    if (ActiveThreads.has(threadId)) {
        return true;
    }
    try {
        yield openai_1.openai.beta.threads.retrieve(threadId);
        markThreadActive(threadId);
        return true;
    }
    catch (_) {
        return false;
    }
});
exports.doesThreadExist = doesThreadExist;
const createThread = (text, files) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const thread = yield openai_1.openai.beta.threads.create();
    markThreadActive(thread.id);
    let finalText = text;
    if (files.length) {
        const fileSummary = '';
        console.log(fileSummary.length, fileSummary.slice(0, 250));
        finalText += '\n' + fileSummary;
    }
    const answer = (_a = (yield (0, gpt_1.sendMessage)(thread.id, `[setup_text]\n${finalText}`))) === null || _a === void 0 ? void 0 : _a.trim();
    try {
        (0, response_1.extractSuccessMessage)(answer);
        return thread.id;
    }
    catch (err) {
        markThreadInactive(thread.id);
        yield openai_1.openai.beta.threads.del(thread.id);
        throw err;
    }
});
exports.createThread = createThread;
const setThreadTopic = (threadId_1, ...args_1) => __awaiter(void 0, [threadId_1, ...args_1], void 0, function* (threadId, topic = 'No topic') {
    var _a;
    (0, gpt_1.abortRunOnThread)(threadId);
    const answer = (_a = (yield (0, gpt_1.sendMessage)(threadId, `[set_topic]\n${topic}`))) === null || _a === void 0 ? void 0 : _a.trim();
    return (0, response_1.extractSuccessMessage)(answer);
});
exports.setThreadTopic = setThreadTopic;
const markThreadActive = (threadId) => {
    ActiveThreads.add(threadId);
};
exports.markThreadActive = markThreadActive;
const markThreadInactive = (threadId) => {
    ActiveThreads.delete(threadId);
};
exports.markThreadInactive = markThreadInactive;
