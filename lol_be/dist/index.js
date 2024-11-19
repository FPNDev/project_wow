"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./express");
require("./routing");
const HTMLStyleElement_impl_js_1 = require("jsdom/lib/jsdom/living/nodes/HTMLStyleElement-impl.js");
HTMLStyleElement_impl_js_1.implementation.prototype._updateAStyleBlock = () => { };
express_1.app.listen(151, '0.0.0.0', () => {
    console.log('api started');
});
