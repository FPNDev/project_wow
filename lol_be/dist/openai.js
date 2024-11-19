"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantId = exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
exports.openai = new openai_1.default({
    apiKey: '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',
});
exports.assistantId = 'asst_3iK0pnaRDmdpPD87I5ZxWrJ1';
