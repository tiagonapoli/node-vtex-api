/// <reference types="node" />
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheLayer } from '../../caches/CacheLayer';
import { MiddlewareContext, RequestConfig } from '../typings';
export declare const cacheKey: (config: AxiosRequestConfig) => string;
export declare function isLocallyCacheable(arg: RequestConfig, type: CacheType): arg is CacheableRequestConfig;
export declare enum CacheType {
    None = 0,
    Memory = 1,
    Disk = 2,
    Any = 3
}
export declare const enum CacheResult {
    HIT = "HIT",
    MISS = "MISS",
    STALE = "STALE"
}
interface CacheOptions {
    type: CacheType;
    storage: CacheLayer<string, Cached>;
}
export declare const cacheMiddleware: ({ type, storage }: CacheOptions) => (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;
export interface Cached {
    etag: string;
    expiration: number;
    response: Partial<AxiosResponse>;
    responseType?: string;
    responseEncoding?: BufferEncoding;
}
export declare type CacheableRequestConfig = RequestConfig & {
    url: string;
    cacheable: CacheType;
    memoizable: boolean;
};
export {};
