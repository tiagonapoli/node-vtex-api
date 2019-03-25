import { ClientsImplementation, IOClients } from '../../clients/IOClients'
import { InstanceOptions } from '../../HttpClient'
import { createHttpRoute } from '../http'
import { GraphQLOptions, RouteHandler } from '../typings'

import { error } from './middlewares/error'
import { parseQuery } from './middlewares/query'
import { response } from './middlewares/response'
import { run } from './middlewares/run'
import { injectSchema } from './middlewares/schema'
import { timings } from './middlewares/timings'
import { upload } from './middlewares/upload'
import { GraphQLContext, GraphQLServiceContext } from './typings'

export const GRAPHQL_ROUTE = '__graphql'

export const createGraphQLRoute = <ClientsT extends IOClients, StateT, CustomT>(
    graphql: GraphQLOptions<ClientsT>,
    Clients: ClientsImplementation<ClientsT>,
    options: Record<string, InstanceOptions>
  ): RouteHandler<ClientsT, StateT, CustomT> => {
    const injectGraphql = async (ctx: GraphQLServiceContext, next: () => Promise<void>) => {
      ctx.graphql = graphql as GraphQLOptions<IOClients>
      await next()
      delete ctx.graphql
    }

    return createHttpRoute<ClientsT, StateT, CustomT & GraphQLContext>(Clients, options)([
      injectGraphql,
      error,
      timings,
      upload,
      parseQuery,
      injectSchema,
      run,
      response,
    ]) as RouteHandler<ClientsT, StateT, CustomT>
}