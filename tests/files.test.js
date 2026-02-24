import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import path from 'path'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks } from './setup/mocks.js'

describe('File Upload API Tests', () => {
  let app
  const authHeader = createAuthHeader()
  const apiKey = createApiKeyHeader()
  const testFilePath = path.join(process.cwd(), 'tests/fixtures/test-file.txt')

  beforeAll(async () => {
    app = await createTestServer()
  })

  afterAll(async () => {
    await closeTestServer()
  })

  beforeEach(() => {
    resetMocks()
  })

  describe('POST /File - Upload and Send to Room', () => {
    it('should upload and send file to room', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .field('vgroupid', 'room123')
        .attach('attachment', testFilePath)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomAttachment).toHaveBeenCalled()
      const callArgs = mockWickrIOAPI.cmdSendRoomAttachment.mock.calls[0]
      expect(callArgs[0]).toBe('room123')
      expect(callArgs[2]).toBe('test-file.txt')
    })

    it('should upload and send file to room with TTL', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .field('vgroupid', 'room123')
        .field('ttl', '3600')
        .field('bor', '1')
        .attach('attachment', testFilePath)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSendRoomAttachment).toHaveBeenCalled()
      const callArgs = mockWickrIOAPI.cmdSendRoomAttachment.mock.calls[0]
      expect(callArgs[3]).toBe('3600')
      expect(callArgs[4]).toBe('1')
    })
  })

  describe('POST /File - Upload and Send to Users', () => {
    it('should upload and send file to users', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .field('users', JSON.stringify(['user1', 'user2']))
        .attach('attachment', testFilePath)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSend1to1Attachment).toHaveBeenCalled()
      const callArgs = mockWickrIOAPI.cmdSend1to1Attachment.mock.calls[0]
      expect(callArgs[0]).toEqual(['user1', 'user2'])
      expect(callArgs[2]).toBe('test-file.txt')
    })

    it('should reject invalid users JSON', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .field('users', 'invalid-json')
        .attach('attachment', testFilePath)

      expect(response.status).toBe(400)
      expect(response.text).toContain('error processing users JSON data')
    })
  })

  describe('POST /File - Validation', () => {
    it('should reject request without users or vgroupid', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .attach('attachment', testFilePath)

      expect(response.status).toBe(400)
      expect(response.text).toContain('Need a list of users OR a vGroupID')
    })

    it('should reject request without attachment', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/File')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .field('vgroupid', 'room123')

      expect(response.status).toBe(400)
      expect(response.text).toContain('No attachment included in request')
    })
  })
})
