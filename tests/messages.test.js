import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import path from 'path'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks, mockResponses } from './setup/mocks.js'

describe('Messages API Tests', () => {
  let app
  const authHeader = createAuthHeader()
  const apiKey = createApiKeyHeader()

  beforeAll(async () => {
    app = await createTestServer()
  })

  afterAll(async () => {
    await closeTestServer()
  })

  beforeEach(() => {
    resetMocks()
  })

  describe('POST /Messages - Send 1-to-1 Messages', () => {
    it('should send 1-to-1 message successfully (V1)', async () => {
      const response = await request(app)
        .post('/WickrIO/V1/Apps/test-api-key/Messages')
        .set('Authorization', authHeader)
        .send({
          users: [{ name: 'user1' }, { name: 'user2' }],
          message: 'Test message',
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'Test message',
        '',
        '',
        '',
        [],
        ''
      )
    })

    it('should send 1-to-1 message successfully (V2)', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          message: 'Test message',
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalled()
    })

    it('should send 1-to-1 message with TTL and BOR', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          message: 'Test message',
          ttl: 3600,
          bor: 1,
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalledWith(
        ['user1'],
        'Test message',
        '3600',
        '1',
        '',
        [],
        ''
      )
    })

    it('should send 1-to-1 message with metadata', async () => {
      const metadata = { key: 'value' }
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          message: 'Test message',
          messagemeta: metadata,
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalledWith(
        ['user1'],
        'Test message',
        '',
        '',
        '',
        [],
        JSON.stringify(metadata)
      )
    })

    it('should reject message without users or vgroupid', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          message: 'Test message',
        })

      expect(response.status).toBe(200)
      expect(response.text).toContain('Need a list of users OR a vGroupID')
    })

    it('should reject message without message or attachment', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
        })

      expect(response.status).toBe(200)
      expect(response.text).toContain('Need a message OR an attachment')
    })
  })

  describe('POST /Messages - Send Room Messages', () => {
    it('should send room message successfully', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          vgroupid: 'room123',
          message: 'Room message',
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomMessage).toHaveBeenCalledWith(
        'room123',
        'Room message',
        '',
        '',
        '',
        [],
        ''
      )
    })

    it('should send room message with TTL and BOR', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          vgroupid: 'room123',
          message: 'Room message',
          ttl: 7200,
          bor: 300,
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomMessage).toHaveBeenCalledWith(
        'room123',
        'Room message',
        '7200',
        '300',
        '',
        [],
        ''
      )
    })

    it('should send room message with TTL and BOR and ignore zeroes', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          vgroupid: 'room123',
          message: 'Room message',
          ttl: 0,
          bor: 0,
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomMessage).toHaveBeenCalledWith(
        'room123',
        'Room message',
        '',
        '',
        '',
        [],
        ''
      )
    })
  })

  describe('POST /Messages - Send Attachments', () => {
    it('should send 1-to-1 attachment with URL', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          attachment: {
            url: 'https://example.com/file.pdf',
            displayname: 'document.pdf',
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Attachment).toHaveBeenCalledWith(
        ['user1'],
        'https://example.com/file.pdf',
        'document.pdf',
        '',
        ''
      )
    })

    it('should reject attachment URL without displayname', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          attachment: {
            url: 'https://example.com/file.pdf',
          },
        })

      expect(response.status).toBe(400)
      expect(response.text).toContain('Attachment displayname must be set')
    })

    it('should send room attachment with URL', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          vgroupid: 'room123',
          attachment: {
            url: 'https://example.com/image.png',
            displayname: 'screenshot.png',
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomAttachment).toHaveBeenCalledWith(
        'room123',
        'https://example.com/image.png',
        'screenshot.png',
        '',
        ''
      )
    })

    it('should permit file sends from paths within the attachments directory', async () => {
      const filename = path.join(process.cwd(), 'attachments', 'document.pdf')
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          attachment: {
            filename,
            displayname: 'document.pdf',
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Attachment).toHaveBeenCalledWith(
        ['user1'],
        filename,
        'document.pdf',
        '',
        ''
      )
    })

    it('should reject file sends from paths outside of attachments directory', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          attachment: {
            filename: '/tmp/document.pdf',
            displayname: 'document.pdf',
          },
        })

      expect(response.status).toBe(400)
      expect(mockWickrIOAPI.cmdSend1to1Attachment).not.toHaveBeenCalled()
    })
  })

  describe('GET /Messages - Retrieve Messages', () => {
    it('should retrieve messages from queue', async () => {
      mockWickrIOAPI.cmdGetReceivedMessage
        .mockResolvedValueOnce(JSON.stringify(mockResponses.message))
        .mockResolvedValueOnce('{ }')

      const response = await request(app)
        .get('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject(mockResponses.message)
    })

    it('should retrieve multiple messages with count parameter', async () => {
      mockWickrIOAPI.cmdGetReceivedMessage
        .mockResolvedValueOnce(JSON.stringify({ ...mockResponses.message, msgid: 'msg1' }))
        .mockResolvedValueOnce(JSON.stringify({ ...mockResponses.message, msgid: 'msg2' }))
        .mockResolvedValueOnce('{ }')

      const response = await request(app)
        .get('/WickrIO/V2/Apps/Messages?count=3')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
    })

    it('should reject invalid count parameter', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Messages?count=invalid')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(400)
      expect(response.text).toContain('Invalid count parameter')
    })

    it('should limit count to maximum', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Messages?count=5000')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetReceivedMessage).toHaveBeenCalledTimes(1000)
    })
  })

  describe('DELETE /Messages - Delete/Recall Messages', () => {
    it('should delete message', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/Messages/room123/msg456')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('Delete message sent')
      expect(mockWickrIOAPI.cmdSendDeleteMessage).toHaveBeenCalledWith('room123', 'msg456')
    })

    it('should recall message', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/Messages/room123/msg456?dorecall=true')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('Recall message sent')
      expect(mockWickrIOAPI.cmdSendRecallMessage).toHaveBeenCalledWith('room123', 'msg456')
    })
  })

  describe('POST /Messages - Status Tracking (?status=true)', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    it('should register a status ID and return it for a 1-to-1 message', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages?status=true')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }, { name: 'user2' }],
          message: 'Tracked message',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.status_id).toMatch(UUID_REGEX)

      const statusId = response.body.status_id

      // cmdAddMessageID(messageID, sender, target, dateSent, message)
      expect(mockWickrIOAPI.cmdAddMessageID).toHaveBeenCalledTimes(1)
      const addArgs = mockWickrIOAPI.cmdAddMessageID.mock.calls[0]
      expect(addArgs[0]).toBe(statusId)
      expect(addArgs[1]).toBe('testbot') // bot username as sender
      expect(addArgs[2]).toBe('user1,user2') // target stashes recipients
      expect(typeof addArgs[3]).toBe('string') // dateSent
      expect(addArgs[4]).toBe('Tracked message')

      // Status ID is passed as the 5th argument (messageID) to the send call
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'Tracked message',
        '',
        '',
        statusId,
        [],
        ''
      )
    })

    it('should register a status ID and return it for a room message', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages?status=true')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          vgroupid: 'room123',
          message: 'Tracked room message',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.status_id).toMatch(UUID_REGEX)

      const statusId = response.body.status_id

      const addArgs = mockWickrIOAPI.cmdAddMessageID.mock.calls[0]
      expect(addArgs[0]).toBe(statusId)
      expect(addArgs[1]).toBe('testbot')
      expect(addArgs[2]).toBe('room123') // target stashes the vGroupID
      expect(addArgs[4]).toBe('Tracked room message')

      expect(mockWickrIOAPI.cmdSendRoomMessage).toHaveBeenCalledWith(
        'room123',
        'Tracked room message',
        '',
        '',
        statusId,
        [],
        ''
      )
    })

    it('should reject status tracking on an attachment with a 400 JSON error', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages?status=true')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          attachment: {
            url: 'https://example.com/file.pdf',
            displayname: 'document.pdf',
          },
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('attachment')
      expect(mockWickrIOAPI.cmdAddMessageID).not.toHaveBeenCalled()
      expect(mockWickrIOAPI.cmdSend1to1Attachment).not.toHaveBeenCalled()
    })

    it('should not register a status ID when status is not requested', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          message: 'Untracked message',
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddMessageID).not.toHaveBeenCalled()
      // 5th argument (messageID) remains empty
      expect(mockWickrIOAPI.cmdSend1to1Message).toHaveBeenCalledWith(
        ['user1'],
        'Untracked message',
        '',
        '',
        '',
        [],
        ''
      )
    })

    it('should not treat status values other than "true" as opt-in', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Messages?status=1')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          users: [{ name: 'user1' }],
          message: 'Untracked message',
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddMessageID).not.toHaveBeenCalled()
    })
  })

  describe('GET /MessageStatus/:status_id - Retrieve Message Status', () => {
    it('should retrieve message status defaulting type to "full" (V1)', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/MessageStatus/status-uuid-123')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject(mockResponses.messageStatus)
      expect(mockWickrIOAPI.cmdGetMessageStatus).toHaveBeenCalledWith('status-uuid-123', 'full')
    })

    it('should retrieve message status (V2)', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/MessageStatus/status-uuid-123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetMessageStatus).toHaveBeenCalledWith('status-uuid-123', 'full')
    })

    it('should return 400 when the status lookup fails', async () => {
      mockWickrIOAPI.cmdGetMessageStatus.mockRejectedValueOnce(new Error('not found'))

      const response = await request(app)
        .get('/WickrIO/V2/Apps/MessageStatus/does-not-exist')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(400)
      expect(response.text).toContain('Failed to retrieve message status')
    })
  })
})
