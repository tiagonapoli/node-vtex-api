"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toLowerObjectKeys(obj) {
    const res = {};
    for (const key in obj) {
        res[key.toLowerCase()] = obj[key];
    }
    return res;
}
exports.toLowerObjectKeys = toLowerObjectKeys;
