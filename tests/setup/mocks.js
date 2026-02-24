import { vi } from 'vitest'

// Mock responses
export const mockResponses = {
  success: 'Success',
  rooms: {
    rooms: [
      {
        description: 'Test Room',
        masters: [{ name: 'testuser' }],
        members: [{ name: 'testuser' }, { name: 'user2' }],
        title: 'Test Room Title',
        ttl: '7776000',
        bor: '0',
        vgroupid: 'S00bf0ca3169bb9e7c3eba13b767bd10fcc8f41a3e34e5c54dab8bflkjdfde',
      },
    ],
  },
  statistics: {
    statistics: {
      message_count: 5,
      pending_messages: 0,
      sent: 7,
      received: 3,
      sent_errors: 1,
      recv_errors: 1,
    },
  },
  message: {
    msgid: 'msg123',
    time: '1234567890',
    sender: 'testuser',
    message: 'Test message',
    vgroupid: 'S00bf0ca3169bb9e7c3eba13b767bd10fcc8f41a3e34e5c54dab8bflkjdfde',
  },
  groupConvos: {
    groupconvos: [
      {
        members: [{ name: 'testuser' }, { name: 'user2' }],
        ttl: '7776000',
        bor: '0',
        vgroupid: 'GC123456789',
      },
    ],
  },
  directory: {
    users: [{ name: 'user1' }, { name: 'user2' }, { name: 'user3' }],
  },
}

// Create mock WickrIOAPI
export const mockWickrIOAPI = {
  cmdSend1to1Message: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSend1to1Attachment: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSendRoomMessage: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSendRoomAttachment: vi.fn().mockResolvedValue(mockResponses.success),
  cmdGetReceivedMessage: vi.fn().mockResolvedValue('{ }'),
  cmdGetStatistics: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.statistics)),
  cmdClearStatistics: vi.fn().mockResolvedValue(mockResponses.success),
  cmdAddRoom: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.rooms.rooms[0])),
  cmdGetRooms: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.rooms)),
  cmdGetRoom: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.rooms)),
  cmdModifyRoom: vi.fn().mockResolvedValue(mockResponses.success),
  cmdDeleteRoom: vi.fn().mockResolvedValue(mockResponses.success),
  cmdLeaveRoom: vi.fn().mockResolvedValue(mockResponses.success),
  cmdAddGroupConvo: vi
    .fn()
    .mockResolvedValue(JSON.stringify(mockResponses.groupConvos.groupconvos[0])),
  cmdGetGroupConvos: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.groupConvos)),
  cmdGetGroupConvo: vi
    .fn()
    .mockResolvedValue(JSON.stringify({ groupconvos: [mockResponses.groupConvos.groupconvos[0]] })),
  cmdDeleteGroupConvo: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSendDeleteMessage: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSendRecallMessage: vi.fn().mockResolvedValue(mockResponses.success),
  cmdSetMsgCallback: vi.fn().mockResolvedValue(mockResponses.success),
  cmdGetMsgCallback: vi.fn().mockResolvedValue('http://example.com/callback'),
  cmdDeleteMsgCallback: vi.fn().mockResolvedValue(mockResponses.success),
  cmdGetDirectory: vi.fn().mockResolvedValue(JSON.stringify(mockResponses.directory)),
}

// Mock logger
export const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

// Mock WickrIOBot class
export class MockWickrIOBot {
  constructor() {
    this.apiServiceInstance = {
      WickrIOAPI: mockWickrIOAPI,
    }
  }

  apiService() {
    return this.apiServiceInstance
  }

  async start(botName) {
    return true
  }

  async close() {
    return true
  }

  setAdminOnly(value) {
    return true
  }

  processesJsonToProcessEnv() {
    // Always set up test environment - this is called by web_interface.js main()
    const tokensObj = {
      WICKRIO_BOT_NAME: { value: 'testbot' },
      BOT_PORT: { value: '3000' },
      BOT_API_KEY: { value: 'test-api-key' },
      BOT_API_AUTH_TOKEN: { value: 'test-auth-token' },
      HTTPS_CHOICE: { value: 'no' },
    }
    process.env.tokens = JSON.stringify(tokensObj)
    console.log(
      '[MOCK] processesJsonToProcessEnv called, set process.env.tokens to:',
      process.env.tokens
    )
  }
}

// Mock the entire wickrio-bot-api module
vi.mock('wickrio-bot-api', () => ({
  WickrIOBot: MockWickrIOBot,
  logger: mockLogger,
}))

// Mock logger.js
vi.mock('../../logger.js', () => ({
  default: mockLogger,
  info: mockLogger.info,
  error: mockLogger.error,
  warn: mockLogger.warn,
  debug: mockLogger.debug,
}))

export function resetMocks() {
  Object.values(mockWickrIOAPI).forEach(mockFn => {
    if (mockFn.mockClear) {
      mockFn.mockClear()
    }
  })
  Object.values(mockLogger).forEach(mockFn => {
    if (mockFn.mockClear) {
      mockFn.mockClear()
    }
  })
}
