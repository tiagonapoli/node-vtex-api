"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jaeger_client_1 = require("jaeger-client");
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
class TracerSingleton {
    static getTracer() {
        if (!TracerSingleton.singleton) {
            TracerSingleton.singleton = TracerSingleton.initServiceTracer();
        }
        return TracerSingleton.singleton;
    }
    static initServiceTracer() {
        return TracerSingleton.createJaegerTracer(utils_1.appIdToAppAtMajor(constants_1.APP.ID), {
            ["app.linked" /* VTEX_APP_LINKED */]: constants_1.LINKED,
            ["app.node_vtex_api_version" /* VTEX_APP_NODE_VTEX_API_VERSION */]: constants_1.NODE_VTEX_API_VERSION,
            ["app.production" /* VTEX_APP_PRODUCTION */]: constants_1.PRODUCTION,
            ["app.region" /* VTEX_APP_REGION */]: constants_1.REGION,
            ["app.version" /* VTEX_APP_VERSION */]: constants_1.APP.VERSION,
            ["app.workspace" /* VTEX_APP_WORKSPACE */]: constants_1.WORKSPACE,
            ["app.node_env" /* VTEX_APP_NODE_ENV */]: constants_1.NODE_ENV !== null && constants_1.NODE_ENV !== void 0 ? constants_1.NODE_ENV : 'undefined',
        });
    }
    static createJaegerTracer(serviceName, defaultTags) {
        const config = {
            reporter: {
                agentHost: process.env.VTEX_OWN_NODE_IP,
            },
            sampler: {
                host: process.env.VTEX_OWN_NODE_IP,
                param: 0.05,
                refreshIntervalMs: 60 * 1000,
                type: 'remote',
            },
            serviceName,
        };
        const options = {
            tags: defaultTags,
        };
        return jaeger_client_1.initTracer(config, options);
    }
}
exports.TracerSingleton = TracerSingleton;
