"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: 'uploads/',
    filename: function (_, file, cb) {
        cb(null, Math.random().toString(32).slice(2) + path_1.default.extname(file.originalname));
    },
});
exports.upload = (0, multer_1.default)({ storage });
