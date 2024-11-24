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
const express_1 = require("../../config/express");
const learnGPT_1 = require("../../learnGPT");
const getQuestionAction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const threadId = req.params.threadId;
    const questionId = +req.params.questionId;
    if (!threadId || !(yield (0, learnGPT_1.doesThreadExist)(threadId))) {
        res.status(404).send('thread does not exist');
        return;
    }
    let question;
    try {
        question = yield (0, learnGPT_1.getQuestion)(threadId, isNaN(questionId) || !isFinite(questionId) ? undefined : questionId);
    }
    catch (e) {
        res.status(404).send(e.message);
        return;
    }
    res.send(question);
});
express_1.app.get('/:threadId/question', getQuestionAction);
express_1.app.get('/:threadId/question/:questionId', getQuestionAction);
