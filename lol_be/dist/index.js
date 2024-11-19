"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./express");
require("./routing");
express_1.app.listen(151, '0.0.0.0', () => {
    console.log('api started');
});
