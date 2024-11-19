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
exports.loadWebsite = void 0;
const axios_1 = __importDefault(require("axios"));
const jsdom_1 = require("jsdom");
const trimResponse = (text) => text.replace(/\s{2,}/g, ' ').slice(0, 35000);
const findParent = (node, nodeName) => {
    let parent = node.parentNode;
    while (parent) {
        if (parent.nodeName === nodeName) {
            return true;
        }
        parent = parent.parentNode;
    }
    return false;
};
const loadWebsite = (websiteLink) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const text = yield (0, axios_1.default)(websiteLink, { responseType: 'text' })
        .then((r) => r.data)
        .catch(() => '');
    console.log(text);
    const { window } = new jsdom_1.JSDOM(text);
    const articles = [...window.document.querySelectorAll('article')];
    if (articles.length) {
        return trimResponse(articles
            .filter((a) => !findParent(a, 'ARTICLE'))
            .map((v) => v.innerText)
            .join('\n'));
    }
    const main = window.document.querySelector('main,#main,#content,#main-content');
    return trimResponse((_b = (_a = main === null || main === void 0 ? void 0 : main.textContent) !== null && _a !== void 0 ? _a : window.document.body.innerText) !== null && _b !== void 0 ? _b : 'nothing');
});
exports.loadWebsite = loadWebsite;
