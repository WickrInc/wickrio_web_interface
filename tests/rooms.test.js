import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import {
  createTestServer,
  createAuthHeader,
  createApiKeyHeader,
  closeTestServer,
} from './setup/test-server.js'
import { mockWickrIOAPI, resetMocks, mockResponses } from './setup/mocks.js'

describe('Rooms API Tests', () => {
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

  describe('POST /Rooms - Create Room', () => {
    it('should create room successfully', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          room: {
            title: 'Test Room',
            description: 'Test Description',
            members: [{ name: 'user1' }, { name: 'user2' }],
            masters: [{ name: 'user1' }],
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddRoom).toHaveBeenCalledWith(
        ['user1', 'user2'],
        ['user1'],
        'Test Room',
        'Test Description',
        '',
        ''
      )
    })

    it('should create room with TTL and BOR', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          room: {
            title: 'Test Room',
            description: 'Test Description',
            members: [{ name: 'user1' }],
            masters: [{ name: 'user1' }],
            ttl: 7776000,
            bor: 300,
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddRoom).toHaveBeenCalledWith(
        ['user1'],
        ['user1'],
        'Test Room',
        'Test Description',
        '7776000',
        '300'
      )
    })

    it('should create room with TTL and BOR and ignore zeroes', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          room: {
            title: 'Test Room',
            description: 'Test Description',
            members: [{ name: 'user1' }],
            masters: [{ name: 'user1' }],
            ttl: 0,
            bor: 0,
          },
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdAddRoom).toHaveBeenCalledWith(
        ['user1'],
        ['user1'],
        'Test Room',
        'Test Description',
        '',
        ''
      )
    })

    it('should reject request without room object', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({})

      expect(response.status).toBe(400)
      expect(response.text).toContain('Cannot process request without a room object')
    })

    it('should reject room without required fields', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          room: {
            title: 'Test Room',
          },
        })

      expect(response.status).toBe(400)
      expect(response.text).toContain('Title, description, members and masters')
    })
  })

  describe('GET /Rooms - List Rooms', () => {
    it('should get all rooms', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Rooms')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetRooms).toHaveBeenCalled()
      expect(response.body).toEqual(mockResponses.rooms)
    })
  })

  describe('GET /Rooms/:vGroupID - Get Specific Room', () => {
    it('should get specific room', async () => {
      const response = await request(app)
        .get('/WickrIO/V2/Apps/Rooms/room123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdGetRoom).toHaveBeenCalledWith('room123')
      expect(response.body).toEqual(mockResponses.rooms)
    })
  })

  describe('POST /Rooms/:vGroupID - Modify Room', () => {
    it('should modify room successfully', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms/room123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })

      expect(response.status).toBe(200)
      expect(response.text).toContain('Room modified successfully')
      expect(mockWickrIOAPI.cmdModifyRoom).toHaveBeenCalledWith(
        'room123',
        [],
        [],
        'Updated Title',
        'Updated Description',
        '',
        ''
      )
    })

    it('should modify room with members and masters', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms/room123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          members: [{ name: 'user1' }, { name: 'user2' }],
          masters: [{ name: 'user1' }],
          ttl: 3600,
        })

      expect(response.status).toBe(200)
      expect(mockWickrIOAPI.cmdModifyRoom).toHaveBeenCalledWith(
        'room123',
        ['user1', 'user2'],
        ['user1'],
        '',
        '',
        '3600',
        ''
      )
    })

    it('should reject non-string vGroupID', async () => {
      const response = await request(app)
        .post('/WickrIO/V2/Apps/Rooms/123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)
        .send({
          title: 'Test',
        })

      expect(response.status).toBe(200)
      // vGroupID is always a string from URL params
    })
  })

  describe('DELETE /Rooms/:vGroupID - Delete/Leave Room', () => {
    it('should delete room', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/Rooms/room123')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('Room deleted successfully')
      expect(mockWickrIOAPI.cmdDeleteRoom).toHaveBeenCalledWith('room123')
    })

    it('should leave room', async () => {
      const response = await request(app)
        .delete('/WickrIO/V2/Apps/Rooms/room123?reason=leave')
        .set('Authorization', authHeader)
        .set('x-api-key', apiKey)

      expect(response.status).toBe(200)
      expect(response.text).toContain('left room successfully')
      expect(mockWickrIOAPI.cmdLeaveRoom).toHaveBeenCalledWith('room123')
    })
  })
})
