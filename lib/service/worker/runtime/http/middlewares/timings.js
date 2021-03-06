"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("../../../../../constants");
const status_1 = require("../../../../../utils/status");
const time_1 = require("../../../../../utils/time");
const APP_ELAPSED_TIME_LOCATOR = time_1.shrinkTimings(time_1.formatTimingName({
    hopNumber: 0,
    source: process.env.VTEX_APP_NAME,
    target: '',
}));
const pid = chalk_1.default.magenta('[' + constants_1.PID + ']');
const formatDate = (date) => chalk_1.default.dim('[' + date.toISOString().split('T')[1] + ']');
const formatStatus = (status) => status >= 500 ? chalk_1.default.red(status.toString()) : (status >= 200 && status < 300 ? chalk_1.default.green(status.toString()) : status);
const formatMillis = (millis) => millis >= 500 ? chalk_1.default.red(millis.toString()) : millis >= 200 ? chalk_1.default.yellow(millis.toString()) : chalk_1.default.green(millis.toString());
const log = ({ vtex: { account, workspace, route: { id } }, path, method, status }, millis) => `${formatDate(new Date())}\t${pid}\t${account}/${workspace}:${id}\t${formatStatus(status)}\t${method}\t${path}\t${formatMillis(millis)} ms`;
const logBillingInfo = ({ account, workspace, production, route: { id, type } }, millis) => JSON.stringify({
    '__VTEX_IO_BILLING': 'true',
    'account': account,
    'app': constants_1.APP.ID,
    'handler': id,
    'isLink': constants_1.LINKED,
    'production': production,
    'routeType': type === 'public' ? 'public_route' : 'private_route',
    'type': 'process-time',
    'value': millis,
    'vendor': constants_1.APP.VENDOR,
    'workspace': workspace,
});
async function timings(ctx, next) {
    // Errors will be caught by the next middleware so we don't have to catch.
    await next();
    const { status: statusCode, vtex: { route: { id } }, timings: { total }, vtex } = ctx;
    const totalMillis = time_1.hrToMillis(total);
    console.log(log(ctx, totalMillis));
    console.log(logBillingInfo(vtex, totalMillis));
    const status = status_1.statusLabel(statusCode);
    // Only batch successful responses so metrics don't consider errors
    metrics.batch(`http-handler-${id}`, status === 'success' ? total : undefined, { [status]: 1 });
}
exports.timings = timings;
