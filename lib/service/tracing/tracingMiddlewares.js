"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const constants_1 = require("../../constants");
const tracing_1 = require("../../tracing");
const Tags_1 = require("../../tracing/Tags");
const utils_1 = require("../../utils");
const addPrefixOntoObjectKeys_1 = require("../../utils/addPrefixOntoObjectKeys");
const PATHS_BLACKLISTED_FOR_TRACING = ['/metrics', '/_status', '/healthcheck'];
exports.addTracingMiddleware = (tracer) => {
    return async function addTracing(ctx, next) {
        var _a;
        if (PATHS_BLACKLISTED_FOR_TRACING.includes(ctx.request.path)) {
            return next();
        }
        const rootSpan = tracer.extract(opentracing_1.FORMAT_HTTP_HEADERS, ctx.request.headers);
        const currentSpan = tracer.startSpan('unknown-operation', { childOf: rootSpan });
        ctx.tracing = { currentSpan, tracer };
        try {
            await next();
        }
        catch (err) {
            tracing_1.ErrorReport.create({ originalError: err }).injectOnSpan(currentSpan, (_a = ctx.vtex) === null || _a === void 0 ? void 0 : _a.logger);
            throw err;
        }
        finally {
            const traceInfo = tracing_1.getTraceInfo(currentSpan);
            if (traceInfo.isSampled) {
                currentSpan.addTags({
                    [Tags_1.OpentracingTags.SPAN_KIND]: Tags_1.OpentracingTags.SPAN_KIND_RPC_SERVER,
                    [Tags_1.OpentracingTags.HTTP_URL]: ctx.request.href,
                    [Tags_1.OpentracingTags.HTTP_METHOD]: ctx.request.method,
                    [Tags_1.OpentracingTags.HTTP_STATUS_CODE]: ctx.response.status,
                    ["http.path" /* HTTP_PATH */]: ctx.request.path,
                    ["vtex.request_id" /* VTEX_REQUEST_ID */]: ctx.get(constants_1.REQUEST_ID_HEADER),
                    ["vtex.incoming.workspace" /* VTEX_WORKSPACE */]: ctx.get(constants_1.WORKSPACE_HEADER),
                    ["vtex.incoming.account" /* VTEX_ACCOUNT */]: ctx.get(constants_1.ACCOUNT_HEADER),
                });
                currentSpan.log(addPrefixOntoObjectKeys_1.addPrefixOntoObjectKeys('req.headers', ctx.request.headers));
                currentSpan.log(addPrefixOntoObjectKeys_1.addPrefixOntoObjectKeys('res.headers', ctx.response.headers));
                ctx.set(constants_1.TRACE_ID_HEADER, traceInfo.traceId);
            }
            currentSpan.finish();
        }
    };
};
exports.nameSpanOperationMiddleware = (operationType, operationName) => {
    return function nameSpanOperation(ctx, next) {
        var _a;
        (_a = ctx.tracing) === null || _a === void 0 ? void 0 : _a.currentSpan.setOperationName(`${operationType}:${operationName}`);
        return next();
    };
};
exports.traceUserLandRemainingPipelineMiddleware = () => {
    return async function traceUserLandRemainingPipeline(ctx, next) {
        const tracingCtx = ctx.tracing;
        ctx.tracing = undefined;
        const span = tracingCtx.currentSpan;
        const userLandTracer = ctx.vtex.tracer;
        userLandTracer.setFallbackSpan(span);
        userLandTracer.lockFallbackSpan();
        const startTime = process.hrtime();
        try {
            span.log({ event: "user-middlewares-start" /* USER_MIDDLEWARES_START */ });
            await next();
        }
        catch (err) {
            tracing_1.ErrorReport.create({ originalError: err }).injectOnSpan(span, ctx.vtex.logger);
            throw err;
        }
        finally {
            span.log({
                event: "user-middlewares-finish" /* USER_MIDDLEWARES_FINISH */,
                ["user-middlewares-duration" /* USER_MIDDLEWARES_DURATION */]: utils_1.hrToMillis(process.hrtime(startTime)),
            });
            ctx.tracing = tracingCtx;
        }
    };
};
