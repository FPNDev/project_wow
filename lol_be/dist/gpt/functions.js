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
exports.handleFunctions = void 0;
const loadWebsite_1 = require("./loadWebsite");
const ToolFunctions = {
    load_webpage: ({ url }) => (0, loadWebsite_1.loadWebsite)(url),
};
const handleFunctions = (requiredAction) => {
    var _a;
    return Promise.all((_a = requiredAction.submit_tool_outputs.tool_calls.map((toolCall) => __awaiter(void 0, void 0, void 0, function* () {
        if (toolCall.function.name in ToolFunctions) {
            const handler = ToolFunctions[toolCall.function.name];
            if (handler) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let args = [];
                try {
                    args = JSON.parse(toolCall.function.arguments);
                }
                catch (_) {
                    /* empty */
                }
                return {
                    tool_call_id: toolCall.id,
                    output: yield handler(args),
                };
            }
        }
        return {
            tool_call_id: toolCall.id,
            output: '',
        };
    }))) !== null && _a !== void 0 ? _a : []);
};
exports.handleFunctions = handleFunctions;
