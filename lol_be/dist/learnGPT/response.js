"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeResponseEnd = exports.extractSuccessMessage = void 0;
const SUCCESS_TOKEN = '[success]';
const ERROR_TOKEN = '[error]';
const RESPONSE_END_TOKEN = '[response_end]';
const extractSuccessMessage = (responseText) => {
    if (responseText.startsWith(ERROR_TOKEN)) {
        responseText = responseText.slice(ERROR_TOKEN.length).trim();
        throw new Error(removeResponseEnd(responseText));
    }
    if (responseText.startsWith(SUCCESS_TOKEN)) {
        responseText = responseText.slice(SUCCESS_TOKEN.length).trim();
    }
    return removeResponseEnd(responseText);
};
exports.extractSuccessMessage = extractSuccessMessage;
const removeResponseEnd = (text) => {
    if (text.endsWith(RESPONSE_END_TOKEN)) {
        text = text.slice(0, -RESPONSE_END_TOKEN.length).trim();
    }
    return text;
};
exports.removeResponseEnd = removeResponseEnd;
