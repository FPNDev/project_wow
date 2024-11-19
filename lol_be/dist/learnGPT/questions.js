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
exports.getQuestion = exports.LoadedQuestionsByThread = exports.loadingQuestions = void 0;
const gpt_1 = require("../gpt");
const observable_1 = require("../observable");
const response_1 = require("./response");
const threads_1 = require("./threads");
const PRELOAD_BEFORE = 10;
const SUCCESS_TOKEN = '[success]';
const ERROR_TOKEN = '[error]';
const ANSWER_TOKEN = '[answer]';
const QUOTE_TOKEN = '[quote]';
const QUESTION_START_TOKEN = '[question]';
const QUESTION_END_TOKEN = '[question_end]';
const questions = Object.create(null);
exports.LoadedQuestionsByThread = questions;
const maxQueuedIndex = Object.create(null);
const onQuestion$ = (0, observable_1.Observable)();
const onError$ = (0, observable_1.Observable)();
const loadingQuestions = Object.create(null);
exports.loadingQuestions = loadingQuestions;
const getQuestion = (threadId, index) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (index === void 0) { index = ((_a = maxQueuedIndex[threadId]) !== null && _a !== void 0 ? _a : 0) + 1; }
    maxQueuedIndex[threadId] = Math.max(index, (_b = maxQueuedIndex[threadId]) !== null && _b !== void 0 ? _b : 0);
    questions[threadId] || (questions[threadId] = []);
    if (!loadingQuestions[threadId] &&
        !questions[threadId][index + PRELOAD_BEFORE]) {
        startQuestionRequest(threadId);
    }
    if (questions[threadId][index]) {
        return questions[threadId][index];
    }
    else {
        return new Promise((resolve, reject) => {
            const unsubscribeError = onError$.subscribe((errMessage) => {
                console.log('onerror', errMessage);
                unsubscribeError();
                unsubscribeQuestion();
                reject(new Error(errMessage));
            });
            const anyQuestionTimeout = setTimeout(() => {
                unsubscribeError();
                unsubscribeQuestion();
                reject(new Error('Likely thread does not exist, cleanup memory'));
            }, 60000);
            const unsubscribeQuestion = onQuestion$.subscribe(() => __awaiter(void 0, void 0, void 0, function* () {
                clearTimeout(anyQuestionTimeout);
                if (questions[threadId][index]) {
                    unsubscribeError();
                    unsubscribeQuestion();
                    resolve(questions[threadId][index]);
                }
            }));
        });
    }
});
exports.getQuestion = getQuestion;
const startQuestionRequest = (threadId) => {
    loadingQuestions[threadId] = true;
    let textValue = '';
    let successFound = false;
    let errorFound = false;
    let currentQuestion;
    const questionsRequest = (0, gpt_1.sendMessageReceiveDelta)(threadId, '[get_question]');
    questionsRequest.subscribe((delta) => __awaiter(void 0, void 0, void 0, function* () {
        (0, threads_1.markThreadActive)(threadId);
        textValue += delta;
        if (!errorFound && textValue.startsWith(ERROR_TOKEN)) {
            console.log('ERROR FOUND!!!');
            textValue = textValue.slice(ERROR_TOKEN.length).trim();
            errorFound = true;
        }
        if (errorFound) {
            return;
        }
        if (!successFound) {
            successFound = textValue.startsWith(SUCCESS_TOKEN);
            if (successFound) {
                textValue = textValue.slice(SUCCESS_TOKEN.length).trim();
            }
        }
        else {
            if (!currentQuestion) {
                if (textValue.startsWith(QUESTION_START_TOKEN)) {
                    textValue = textValue.slice(QUESTION_START_TOKEN.length).trim();
                    currentQuestion = {
                        question: '',
                        answers: [],
                        quote: '',
                    };
                }
            }
            else {
                let token = ANSWER_TOKEN;
                let stringLen = textValue.indexOf(token);
                if (stringLen === -1) {
                    token = QUOTE_TOKEN;
                    stringLen = textValue.indexOf(token);
                }
                if (stringLen === -1) {
                    token = QUESTION_END_TOKEN;
                    stringLen = textValue.indexOf(token);
                }
                if (stringLen !== -1) {
                    const textSection = textValue.slice(0, stringLen).trim();
                    textValue = textValue.slice(stringLen + token.length).trim();
                    if (token !== QUESTION_END_TOKEN) {
                        if (!currentQuestion.question) {
                            currentQuestion.question = textSection;
                        }
                        else {
                            currentQuestion.answers.push(textSection);
                        }
                    }
                    else {
                        currentQuestion.quote = textSection;
                        questions[threadId].push(currentQuestion);
                        onQuestion$.notify();
                        currentQuestion = undefined;
                    }
                }
            }
        }
    }));
    questionsRequest.subscribeDone(() => {
        if (!errorFound &&
            maxQueuedIndex[threadId] + PRELOAD_BEFORE > questions[threadId].length) {
            startQuestionRequest(threadId);
        }
        else {
            loadingQuestions[threadId] = false;
        }
        if (errorFound) {
            onError$.notify((0, response_1.removeResponseEnd)(textValue.trim()));
        }
    });
};
