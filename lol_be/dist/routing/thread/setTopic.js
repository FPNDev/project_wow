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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = require("../../config/express");
const learnGPT_1 = require("../../learnGPT");
express_1.app.post('/:threadId/topic', body_parser_1.default.json(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const threadId = req.params.threadId;
    const topic = req.body.topic;
    if (!threadId || typeof topic !== 'string') {
        res.writeHead(404);
        res.end();
        return;
    }
    try {
        yield (0, learnGPT_1.setThreadTopic)(threadId, topic);
        res.send({
            ok: true,
            startsAt: (_b = (_a = learnGPT_1.LoadedQuestionsByThread[threadId]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
        });
    }
    catch (e) {
        res.send({ ok: false, errorMessage: e.message });
    }
}));
