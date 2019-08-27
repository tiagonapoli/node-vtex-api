import { path } from 'ramda'

import { AppGraphQLClient, InstanceOptions } from '../HttpClient'
import { IOContext } from '../service/typings'
import { IOMessage } from '../utils/message'

type IOMessageInput = Pick<IOMessage, 'id' | 'content' | 'description' | 'behavior'>
type Behavior = 'USER_ONLY' | 'USER_AND_APP' | 'FULL'

interface MessagesInput {
  provider: string,
  messages: IOMessageInput[],
}

interface MessageInput {
  context?: string
  content: string
  description?: string
  behavior?: Behavior
}

export interface IOMessageSaveInput extends IOMessageInput {
  content: string
}

export interface Translate {
  messages: MessagesInput[]
  from?: string
  to: string
}

export interface Translate2 {
  messages: MessageInput[]
  from?: string
  to: string
}

export interface SaveArgs {
  to: string
  messagesByProvider: Array<{
    messages: IOMessageSaveInput[]
    provider: string
  }>
}

interface TranslateResponse {
  newTranslate: string[]
}

interface TranslateResponse2 {
  translate: string[]
}

export class MessagesGraphQL extends AppGraphQLClient {
  constructor(vtex: IOContext, options?: InstanceOptions) {
    super('vtex.messages', vtex, options)
  }

  public translate = async (args: Translate): Promise<string[]> => this.graphql.query<TranslateResponse, { args: Translate }>({
    query: `
    query Translate($args: NewTranslateArgs!) {
      newTranslate(args: $args)
    }
    `,
    variables: { args },
  }, {
    metric: 'messages-translate',
  }).then(path(['data', 'newTranslate'])) as Promise<TranslateResponse['newTranslate']>

  public translate2 = async (args: Translate2): Promise<string[]> => this.graphql.query<TranslateResponse2, { args: Translate2 }>({
    query: `
    query Translate($args: TranslateArgs!) {
      translate(args: $args)
    }
    `,
    variables: { args },
  }, {
    metric: 'messages-translate',
  }).then(path(['data', 'translate'])) as Promise<TranslateResponse2['translate']>

  public save = (args: SaveArgs): Promise<boolean> => this.graphql.mutate<boolean, { args: SaveArgs }>({
    mutate: `
    mutation Save($args: SaveArgs!) {
      save(args: $args)
    }
    `,
    variables: { args },
  }, {
    metric: 'messages-save-translation',
  }).then(path(['data', 'save'])) as Promise<boolean>

}

