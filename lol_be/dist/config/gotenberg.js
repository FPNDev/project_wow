"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gotenberg_js_client_1 = require("gotenberg-js-client");
const toPDF = (0, gotenberg_js_client_1.pipe)((0, gotenberg_js_client_1.gotenberg)('http://localhost:3000'), gotenberg_js_client_1.convert, gotenberg_js_client_1.html, gotenberg_js_client_1.please);
