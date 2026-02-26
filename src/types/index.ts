export interface TokenValue {
  value: string
}

export interface Tokens {
  WICKRIO_BOT_NAME: TokenValue
  BOT_PORT: TokenValue
  BOT_API_KEY: TokenValue
  BOT_API_AUTH_TOKEN: TokenValue
  HTTPS_CHOICE: TokenValue
  SSL_KEY_LOCATION?: TokenValue
  SSL_CRT_LOCATION?: TokenValue
}

export interface UserEntry {
  name: string
}

export interface RoomRequest {
  title: string
  description: string
  members: UserEntry[]
  masters: UserEntry[]
  ttl?: number | string
  bor?: number | string
}

export interface GroupConvoRequest {
  members: UserEntry[]
  ttl?: number | string
  bor?: number | string
}

export interface AttachmentInfo {
  url?: string
  filename?: string
  displayname?: string
}

export interface MessageBody {
  users?: UserEntry[]
  vgroupid?: string
  message?: string
  attachment?: AttachmentInfo
  ttl?: number | string
  bor?: number | string
  messagemeta?: Record<string, unknown>
}
