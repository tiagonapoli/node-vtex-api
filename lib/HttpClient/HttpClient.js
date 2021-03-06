"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const koa_compose_1 = __importDefault(require("koa-compose"));
const p_limit_1 = __importDefault(require("p-limit"));
const constants_1 = require("../constants");
const binding_1 = require("../utils/binding");
const tenant_1 = require("../utils/tenant");
const cache_1 = require("./middlewares/cache");
const cancellationToken_1 = require("./middlewares/cancellationToken");
const inflight_1 = require("./middlewares/inflight");
const memoization_1 = require("./middlewares/memoization");
const metrics_1 = require("./middlewares/metrics");
const notFound_1 = require("./middlewares/notFound");
const recorder_1 = require("./middlewares/recorder");
const request_1 = require("./middlewares/request");
const tracing_1 = require("./middlewares/tracing");
const DEFAULT_TIMEOUT_MS = 1000;
const noTransforms = [(data) => data];
class HttpClient {
    constructor(opts) {
        this.get = (url, config = {}) => {
            const cacheableConfig = this.getConfig(url, config);
            return this.request(cacheableConfig).then(response => response.data);
        };
        this.getRaw = (url, config = {}) => {
            const cacheableConfig = this.getConfig(url, config);
            return this.request(cacheableConfig);
        };
        this.getWithBody = (url, data, config = {}) => {
            const bodyHash = crypto_1.createHash('md5').update(JSON.stringify(data)).digest('hex');
            const cacheableConfig = this.getConfig(url, {
                ...config,
                data,
                params: {
                    ...config.params,
                    [constants_1.BODY_HASH]: bodyHash,
                },
            });
            return this.request(cacheableConfig).then(response => response.data);
        };
        this.getBuffer = (url, config = {}) => {
            const bufferConfig = { cacheable: cache_1.CacheType.Disk, ...config, url, responseType: 'arraybuffer', transformResponse: noTransforms };
            return this.request(bufferConfig);
        };
        this.getStream = (url, config = {}) => {
            const streamConfig = { ...config, url, responseType: 'stream', transformResponse: noTransforms };
            return this.request(streamConfig).then(response => response.data);
        };
        this.put = (url, data, config = {}) => {
            const putConfig = { ...config, url, data, method: 'put' };
            return this.request(putConfig).then(response => response.data);
        };
        this.putRaw = (url, data, config = {}) => {
            const putConfig = { ...config, url, data, method: 'put' };
            return this.request(putConfig);
        };
        this.post = (url, data, config = {}) => {
            const postConfig = { ...config, url, data, method: 'post' };
            return this.request(postConfig).then(response => response.data);
        };
        this.postRaw = (url, data, config = {}) => {
            const postConfig = { ...config, url, data, method: 'post' };
            return this.request(postConfig);
        };
        this.patch = (url, data, config = {}) => {
            const patchConfig = { ...config, url, data, method: 'patch' };
            return this.request(patchConfig).then(response => response.data);
        };
        this.head = (url, config = {}) => {
            const headConfig = { ...config, url, method: 'head' };
            return this.request(headConfig);
        };
        this.delete = (url, config) => {
            const deleteConfig = { ...config, url, method: 'delete' };
            return this.request(deleteConfig);
        };
        this.request = async (config) => {
            const context = { config };
            await this.runMiddlewares(context);
            return context.response;
        };
        this.getConfig = (url, config = {}) => ({
            cacheable: cache_1.CacheType.Memory,
            memoizable: true,
            ...config,
            url,
        });
        const { baseURL, authToken, authType, memoryCache, diskCache, locale, name, metrics, product, serverTiming, recorder, userAgent, timeout = DEFAULT_TIMEOUT_MS, segmentToken, sessionToken, retries, concurrency, headers: defaultHeaders, host, params, operationId, tenant, binding, verbose, cancellation, exponentialTimeoutCoefficient, initialBackoffDelay, exponentialBackoffCoefficient, httpsAgent, tracer, logger, } = opts;
        this.name = name || baseURL || 'unknown';
        const limit = concurrency && concurrency > 0 && p_limit_1.default(concurrency) || undefined;
        const headers = {
            ...defaultHeaders,
            'Accept-Encoding': 'gzip',
            'User-Agent': userAgent,
            ...host ? { [constants_1.FORWARDED_HOST_HEADER]: host } : null,
            ...tenant ? { [constants_1.TENANT_HEADER]: tenant_1.formatTenantHeaderValue(tenant) } : null,
            ...binding ? { [constants_1.BINDING_HEADER]: binding_1.formatBindingHeaderValue(binding) } : null,
            ...locale ? { [constants_1.LOCALE_HEADER]: locale } : null,
            ...operationId ? { 'x-vtex-operation-id': operationId } : null,
            ...product ? { [constants_1.PRODUCT_HEADER]: product } : null,
            ...segmentToken ? { [constants_1.SEGMENT_HEADER]: segmentToken } : null,
            ...sessionToken ? { [constants_1.SESSION_HEADER]: sessionToken } : null,
        };
        if (authType && authToken) {
            headers['Authorization'] = `${authType} ${authToken}`; // tslint:disable-line
        }
        const memoizedCache = new Map();
        this.runMiddlewares = koa_compose_1.default([
            tracing_1.createHttpClientTracingMiddleware({ tracer, logger, clientName: this.name, hasDiskCacheMiddleware: !!diskCache, hasMemoryCacheMiddleware: !!memoryCache }),
            ...(opts.middlewares || []),
            request_1.defaultsMiddleware({ baseURL, rawHeaders: headers, params, timeout, retries, verbose, exponentialTimeoutCoefficient, initialBackoffDelay, exponentialBackoffCoefficient, httpsAgent }),
            metrics_1.metricsMiddleware({ metrics, serverTiming, name }),
            memoization_1.memoizationMiddleware({ memoizedCache }),
            ...recorder ? [recorder_1.recorderMiddleware(recorder)] : [],
            cancellationToken_1.cancellationToken(cancellation),
            inflight_1.singleFlightMiddleware,
            notFound_1.acceptNotFoundMiddleware,
            ...memoryCache ? [cache_1.cacheMiddleware({ type: cache_1.CacheType.Memory, storage: memoryCache })] : [],
            ...diskCache ? [cache_1.cacheMiddleware({ type: cache_1.CacheType.Disk, storage: diskCache })] : [],
            notFound_1.notFoundFallbackMiddleware,
            request_1.routerCacheMiddleware,
            request_1.requestMiddleware(limit),
        ]);
    }
}
exports.HttpClient = HttpClient;
