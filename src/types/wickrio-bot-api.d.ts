declare module 'wickrio-bot-api' {
  interface WickrIOAPIInterface {
    cmdSend1to1Message(
      users: string[],
      message: string,
      ttl: string,
      bor: string,
      flags: string,
      attachments: unknown[],
      messagemeta: string
    ): Promise<string>
    cmdSend1to1Attachment(
      users: string[],
      attachment: string,
      displayName: string,
      ttl: string,
      bor: string
    ): Promise<string>
    cmdSendRoomMessage(
      vGroupID: string,
      message: string,
      ttl: string,
      bor: string,
      flags: string,
      attachments: unknown[],
      messagemeta: string
    ): Promise<string>
    cmdSendRoomAttachment(
      vGroupID: string,
      attachment: string,
      displayName: string,
      ttl: string,
      bor: string
    ): Promise<string>
    cmdGetReceivedMessage(): Promise<string>
    cmdGetStatistics(): Promise<string>
    cmdClearStatistics(): Promise<string>
    cmdAddRoom(
      members: string[],
      masters: string[],
      title: string,
      description: string,
      ttl: string,
      bor: string
    ): Promise<string>
    cmdGetRooms(): Promise<string>
    cmdGetRoom(vGroupID: string): Promise<string>
    cmdModifyRoom(
      vGroupID: string,
      members: string[],
      masters: string[],
      title: string,
      description: string,
      ttl: string,
      bor: string
    ): Promise<string>
    cmdDeleteRoom(vGroupID: string): Promise<string>
    cmdLeaveRoom(vGroupID: string): Promise<string>
    cmdAddGroupConvo(members: string[], ttl: string, bor: string): Promise<string>
    cmdGetGroupConvos(): Promise<string>
    cmdGetGroupConvo(vGroupID: string): Promise<string>
    cmdDeleteGroupConvo(vGroupID: string): string
    cmdSendDeleteMessage(vGroupID: string, msgID: string): Promise<string>
    cmdSendRecallMessage(vGroupID: string, msgID: string): Promise<string>
    cmdSetMsgCallback(callbackUrl: string): Promise<string>
    cmdGetMsgCallback(): Promise<string>
    cmdDeleteMsgCallback(): Promise<string>
    cmdGetDirectory(): Promise<string>
  }

  interface ApiServiceInstance {
    WickrIOAPI: WickrIOAPIInterface
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
    WickrIOAPIInterface,
    ApiServiceInstance,
    logger,
  }
}
