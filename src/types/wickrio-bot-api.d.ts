declare module 'wickrio-bot-api' {
  import { WickrIOAddon } from 'wickrio_addon'

  interface ApiServiceInstance {
    WickrIOAPI: WickrIOAddon
  }

  class WickrIOBot {
    apiService(): ApiServiceInstance
    start(botName: string): Promise<boolean>
    close(): Promise<boolean>
    setAdminOnly(value: boolean): boolean
    processesJsonToProcessEnv(): void
  }

  interface WickrIOConfigureTokens {
    token: string
    pattern: string
    type: string
    description: string
    message: string
    required: boolean
    default: string
    list?: WickrIOConfigureTokens[]
  }

  class WickrIOConfigure {
    constructor(
      tokens: WickrIOConfigureTokens[],
      fullName: string,
      supportAdministrators: boolean,
      supportVerification: boolean
    )
    configureYourBot(integration: string): Promise<void>
  }

  const logger: {
    info: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    debug: (...args: unknown[]) => void
  }

  export {
    WickrIOBot,
    WickrIOConfigure,
    WickrIOConfigureTokens,
    WickrIOAddon,
    ApiServiceInstance,
    logger,
  }
}
