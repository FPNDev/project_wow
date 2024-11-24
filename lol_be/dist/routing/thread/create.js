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
const express_1 = require("../../config/express");
const learnGPT_1 = require("../../learnGPT");
const middleware_1 = __importDefault(require("../../middleware"));
express_1.app.post('/create', middleware_1.default.uploadThreadFiles, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const text = req.body.text;
    const files = ((_a = req.files) !== null && _a !== void 0 ? _a : []);
    if (!text && !files.length) {
        res.writeHead(404);
        res.end();
        return;
    }
    try {
        res.send({ ok: true, threadId: yield (0, learnGPT_1.createThread)(text, files) });
    }
    catch (e) {
        res.send({ ok: false, errorMessage: e.message });
    }
}));
