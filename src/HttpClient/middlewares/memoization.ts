import { MiddlewareContext } from '../context'
import { cacheKey, CacheType, isCacheable } from './cache'

export type Memoized = Required<Pick<MiddlewareContext, 'cacheHit' | 'response'>>

interface MemoizationOptions {
  memoizedCache: Map<string, Promise<Memoized>>
  type: CacheType
}

export const memoizationMiddleware = ({type, memoizedCache}: MemoizationOptions) => {
  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    if (!isCacheable(ctx.config, type)) {
      return await next()
    }

    const key = cacheKey(ctx.config)

    if (memoizedCache.has(key)) {
      console.log('memoizedHIT', ctx.config.url)
      const memoized = await memoizedCache.get(key)!
      ctx.cacheHit = {
        ...memoized.cacheHit,
        memoized: true,
      }
      ctx.response = memoized.response
    } else {
      console.log('memoizedMISS', ctx.config.url)
      const promise = new Promise<Memoized>(async (resolve, reject) => {
        try {
          await next()
          resolve({
            cacheHit: {
              ...ctx.cacheHit,
              memoized: false,
            },
            response: ctx.response!,
          })
        }
        catch (err) {
          reject(err)
        }
      })
      memoizedCache.set(key, promise)
      await promise
    }
  }
}
