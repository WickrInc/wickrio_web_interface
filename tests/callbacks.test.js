import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks } from './setup/mocks.js'

describe('Message Callback API Tests', () => {
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

  describe('POST /MsgRecvCallback - Set Callback', () => {
    it('should set message callback successfully', async () => {
      const callbackUrl = 'http://example.com/webhook'
      const response = await request(app)
        .post(`/WickrIO/V2/Apps/MsgRecvCallback?callbackurl=${encodeURIComponent(callbackUrl)}`)
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSetMsgCallback).toHaveBeenCalledWith(callbackUrl)
    })

    it('should set message callback with V1 endpoint', async () => {
      const callbackUrl = 'https://webhook.example.com/receive'
      const response = await request(app)
        .post(
          `/WickrIO/V1/Apps/test-api-key/MsgRecvCallback?callbackurl=${encodeURIComponent(callbackUrl)}`
        )
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdSetMsgCallback).toHaveBeenCalledWith(callbackUrl)
    })
  })

  describe('GET /MsgRecvCallback - Get Callback', () => {
    it('should get message callback successfully', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/MsgRecvCallback')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('http://example.com/callback')
      expect(mockWickrIOAPI.cmdGetMsgCallback).toHaveBeenCalled()
    })

    it('should get message callback with V1 endpoint', async () => {
      const response = await request(app)
        .get('/WickrIO/V1/Apps/test-api-key/MsgRecvCallback')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetMsgCallback).toHaveBeenCalled()
    })
  })

  describe('DELETE /MsgRecvCallback - Delete Callback', () => {
    it('should delete message callback successfully', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/MsgRecvCallback')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdDeleteMsgCallback).toHaveBeenCalled()
    })

    it('should delete message callback with V1 endpoint', async () => {
      const response = await request(app)
        .delete('/WickrIO/V1/Apps/test-api-key/MsgRecvCallback')
        .set('Authorization', authHeader)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdDeleteMsgCallback).toHaveBeenCalled()
    })
  })
})
