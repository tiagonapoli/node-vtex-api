import { runHttpQuery } from 'apollo-server-core'

import { LRUCache } from '../../../caches'
import { GraphQLServiceContext } from '../typings'
import { formatError } from '../utils/formatError'
import { formatResponse } from '../utils/formatResponse'
import { defaultMaxAgeFromCtx } from '../utils/maxAgeEnum'

const ONE_HOUR_MS = 60 * 60 * 1e3

const persistedQueries = {
  cache: new LRUCache<string, string>({
    max: 500,
    maxAge: ONE_HOUR_MS,
  }),
}

export const run = async (ctx: GraphQLServiceContext, next: () => Promise<void>) => {
  const {
    method,
    graphql,
    vtex: {production},
    request,
  } = ctx

  const {
    dataSources,
    schema,
    query,
  } = graphql

  // We don't want resolvers to have access to the GraphQL context,
  // so we delete it here and restore it after execution.
  delete ctx.graphql

  const {graphqlResponse, responseInit} = await runHttpQuery([], {
    method,
    options: {
      cacheControl: {
        calculateHttpHeaders: true,
        defaultMaxAge: defaultMaxAgeFromCtx(ctx),
        stripFormattedExtensions: false,
      },
      context: ctx,
      dataSources,
      debug: !production,
      formatError,
      formatResponse,
      persistedQueries,
      schema,
      tracing: true,
    } as any,
    query: query!,
    request,
  })

  ctx.graphql = graphql
  ctx.graphql.responseInit = responseInit
  ctx.graphql.graphqlResponse = JSON.parse(graphqlResponse)

  await next()
}
