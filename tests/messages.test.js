import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
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
})
