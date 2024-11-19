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
exports.uploadFilesAsAttachments = exports.GPT_FILE_FORMATS = void 0;
const fs_1 = __importDefault(require("fs"));
const openai_1 = require("../openai");
exports.GPT_FILE_FORMATS = [
    'c',
    'cpp',
    'cs',
    'css',
    'doc',
    'docx',
    'go',
    'html',
    'java',
    'js',
    'json',
    'md',
    'pdf',
    'php',
    'pptx',
    'ppt',
    'py',
    'py',
    'sh',
    'ts',
    'xlsx',
    'xls',
    'txt',
];
const uploadFilesAsAttachments = (files) => __awaiter(void 0, void 0, void 0, function* () {
    const attachments = [];
    if (files === null || files === void 0 ? void 0 : files.length) {
        const filesPromises = [];
        for (let idx = 0; idx < files.length; idx++) {
            const readStream = fs_1.default.createReadStream(files[idx].path);
            filesPromises.push(openai_1.openai.files.create({
                purpose: 'assistants',
                file: readStream,
            }));
        }
        const settledResults = yield Promise.allSettled(filesPromises);
        for (let idx = 0; idx < settledResults.length; idx++) {
            const res = settledResults[idx];
            if (res.status === 'fulfilled') {
                attachments.push({
                    file_id: res.value.id,
                    tools: [{ type: 'file_search' }],
                });
            }
        }
    }
    return attachments;
});
exports.uploadFilesAsAttachments = uploadFilesAsAttachments;
