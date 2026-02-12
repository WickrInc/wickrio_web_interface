import express, { Request, Response, NextFunction } from 'express'
import https from 'https'
import helmet from 'helmet'
import WickrIOBotAPI from 'wickrio-bot-api'
import fs from 'fs'
import logger from './logger'
import multer from 'multer'
import path from 'node:path'
import morgan from 'morgan'
import { GroupConvoRequest, MessageBody, RoomRequest, Tokens, UserEntry } from './types'

const app = express()
app.use(helmet())

const bot = new WickrIOBotAPI.WickrIOBot()
const userAttachmentsDir = path.join(process.cwd(), 'attachments')

let WickrIOAPI = bot.apiService().WickrIOAPI

if (process.env.NODE_ENV === 'test') {
  // Inject mock API in test mode
  ;(module.exports as Record<string, unknown>).setMockAPI = (mockAPI: typeof WickrIOAPI): void => {
    WickrIOAPI = mockAPI
  }
} else {
  process.stdin.resume() //so the program will not close instantly
  process.setMaxListeners(0)
}

process.title = 'wickrioWebApi'

async function exitHandler(
  options: { exit?: boolean; pid?: boolean } | null,
  err?: unknown
): Promise<void> {
  try {
    await bot.close()
    if (err || options?.exit) {
      logger.info('Exit reason:', err)
      process.exit()
    } else if (options?.pid) {
      process.kill(process.pid)
    }
  } catch (e) {
    logger.error(e)
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
process.on('unhandledRejection', (reason: unknown, p: Promise<unknown>) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

let bot_username: string,
  bot_port: string,
  bot_api_key: string,
  bot_api_auth_token: string,
  https_choice: string,
  ssl_key_location: string,
  ssl_crt_location: string

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    const testTokens = JSON.parse(fs.readFileSync('./tests/configTokens.test.json', 'utf8'))
    process.env.tokens = JSON.stringify(testTokens)
  } else {
    bot.processesJsonToProcessEnv()
  }

  try {
    const tokens: Tokens = JSON.parse(process.env.tokens!)

    // Skip bot.start() in test mode since it requires a real WickrIO bot
    if (process.env.NODE_ENV !== 'test') {
      const status = await bot.start(tokens.WICKRIO_BOT_NAME.value)
      if (!status) {
        exitHandler(null, {
          exit: true,
          reason: 'Client not able to start',
        } as unknown)
      }

      bot.setAdminOnly(false)
      fs.mkdirSync(userAttachmentsDir, { recursive: true })
    }

    bot_username = tokens.WICKRIO_BOT_NAME.value
    bot_port = tokens.BOT_PORT.value
    bot_api_key = tokens.BOT_API_KEY.value
    bot_api_auth_token = tokens.BOT_API_AUTH_TOKEN.value
    https_choice = tokens.HTTPS_CHOICE.value
  } catch (err) {
    logger.error(err)
  }

  logger.info('bot_username=' + bot_username)
  logger.info('bot_port=' + bot_port)
  logger.info('https_choice=' + https_choice)

  if (https_choice === 'yes' || https_choice === 'y') {
    const tokens: Tokens = JSON.parse(process.env.tokens!)
    ssl_key_location = tokens.SSL_KEY_LOCATION!.value
    ssl_crt_location = tokens.SSL_CRT_LOCATION!.value

    try {
      if (!fs.existsSync(ssl_key_location)) {
        exitHandler(null, {
          exit: true,
          reason: 'ERROR: Cannot access ' + ssl_key_location,
        } as unknown)
      }
    } catch (err) {
      console.error(err)
    }

    try {
      if (!fs.existsSync(ssl_crt_location)) {
        exitHandler(null, {
          exit: true,
          reason: 'ERROR: Cannot access ' + ssl_crt_location,
        } as unknown)
      }
    } catch (err) {
      console.error(err)
    }

    const credentials = {
      key: fs.readFileSync(ssl_key_location, 'utf8'),
      cert: fs.readFileSync(ssl_crt_location, 'utf8'),
    }

    https.createServer(credentials, app).listen(bot_port, () => {
      console.log('HTTPS Server running on port', bot_port)
    })
  } else if (process.env.NODE_ENV !== 'test') {
    app.listen(bot_port, () => {
      console.log('We are live on ' + bot_port)
    })
  }

  // parse application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: false }))
  // parse application/json
  app.use(express.json())

  app.use(function (error: unknown, req: Request, res: Response, next: NextFunction) {
    if (error instanceof SyntaxError) {
      console.log('bodyParser:', error)
      res.statusCode = 400
      res.type('txt').send('Invalid JSON format in request body')
    } else {
      next()
    }
  })

  // HTTP request/response logging middleware
  app.use(
    morgan('combined', {
      stream: { write: (msg: string) => logger.info(msg.trim()) },
    })
  )

  app.all('*', function (req: Request, res: Response, next: NextFunction) {
    const authHeader = req.get('Authorization')
    let authToken: string | undefined
    if (authHeader) {
      if (authHeader.indexOf(' ') == -1) {
        authToken = authHeader
      } else {
        const parts = authHeader.split(' ')
        authToken = parts[1]
      }
    } else {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send(
          'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
        )
    }
    if (!checkCreds(authToken!)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res.type('txt').status(401).send('Access denied: invalid basic-auth token.')
    }

    next()
  })

  const endpoint = '/WickrIO/V1/Apps/' + bot_api_key
  const xapiEndpoint = '/WickrIO/V2/Apps'

  app.use(xapiEndpoint, function (req: Request, res: Response, next: NextFunction) {
    const xapi = req.get('x-api-key')
    if (xapi != bot_api_key) {
      return res.type('txt').status(401).send('Access denied: invalid api-key.')
    }
    next()
  })

  const upload = multer({ dest: 'attachments/' })

  app.route([xapiEndpoint + '/Messages', endpoint + '/Messages']).post(async function (
    req: Request,
    res: Response
  ) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')

    const body = req.body as MessageBody

    if (!body.users && !body.vgroupid) {
      return res.send('Need a list of users OR a vGroupID to send a message.')
    } else if (!body.message && !body.attachment) {
      return res.send('Need a message OR an attachment to send a message.')
    }
    const ttl = body.ttl ? body.ttl.toString() : ''
    const bor = body.bor ? body.bor.toString() : ''
    const messagemeta = body.messagemeta ? JSON.stringify(body.messagemeta) : ''

    if (
      body.attachment?.filename &&
      path.dirname(body.attachment.filename) !== userAttachmentsDir
    ) {
      console.info('Requested upload for file not in attachments directory, rejecting with 400')
      // Prevent sending files from outside of the attachments directory
      return res.status(400).send('Path of file must be within the attachments directory')
    }

    if (body.users) {
      // This is a message to be sent in 1:1s to at least 1 user
      const users = body.users.map((user: UserEntry) => user.name)

      if (body.attachment) {
        let attachment: string
        let displayName = ''
        if (body.attachment.url) {
          if (!body.attachment.displayname) {
            return res.status(400).send('Attachment displayname must be set')
          }
          displayName = body.attachment.displayname
          attachment = body.attachment.url
        } else {
          if (body.attachment.displayname) displayName = body.attachment.displayname
          attachment = body.attachment.filename!
        }
        console.log('displayName:', displayName)
        try {
          const s1t1a = await WickrIOAPI.cmdSend1to1Attachment(
            users,
            attachment,
            displayName,
            ttl,
            bor
          )
          res.send(s1t1a)
        } catch (err) {
          console.log(err)
          return res.status(400).send('Failed to send attachment')
        }
      } else {
        const message = body.message!
        try {
          const csm = await WickrIOAPI.cmdSend1to1Message(
            users,
            message,
            ttl,
            bor,
            '',
            [],
            messagemeta
          )
          logger.info('1to1 message sent')
          res.send(csm)
        } catch (err) {
          console.log(err)
          return res.status(400).send('Failed to send message')
        }
      }
    } else if (body.vgroupid) {
      // This is a group or room message
      const vGroupID = body.vgroupid
      if (body.attachment) {
        let attachment: string
        let displayName = ''
        if (body.attachment.url) {
          if (!body.attachment.displayname) {
            return res.status(400).send('Attachment displayname must be set.')
          }
          displayName = body.attachment.displayname
          attachment = body.attachment.url
        } else {
          if (body.attachment.displayname) displayName = body.attachment.displayname
          attachment = body.attachment.filename!
        }
        console.log('attachment:', attachment)
        console.log('displayName:', displayName)
        try {
          const csra = await WickrIOAPI.cmdSendRoomAttachment(
            vGroupID,
            attachment,
            displayName,
            ttl,
            bor
          )
          logger.info('Room attachment sent')
          res.send(csra)
        } catch (err) {
          console.log(err)
          return res.status(400).send('Failed to send attachment')
        }
      } else {
        const message = body.message!
        try {
          const csrm = await WickrIOAPI.cmdSendRoomMessage(
            vGroupID,
            message,
            ttl,
            bor,
            '',
            [],
            messagemeta
          )
          logger.info('Room message sent')
          res.send(csrm)
        } catch (err) {
          console.log(err)
          return res.status(400).send('Failed to send message')
        }
      }
    }
  })

  app
    .route([xapiEndpoint + '/File', endpoint + '/File'])
    .post(upload.single('attachment'), async function (req: Request, res: Response) {
      res.set('Content-Type', 'text/plain')
      res.set('Authorization', 'Basic base64_auth_token')

      const body = req.body as { users?: string; vgroupid?: string; ttl?: string; bor?: string }

      if (!body.users && !body.vgroupid) {
        return res.status(400).send('Need a list of users OR a vGroupID to send a message.')
      } else {
        const { ttl = '', bor = '' } = body

        if (req.file === undefined) {
          console.log('attachment is not defined!')
          return res.status(400).send('No attachment included in request')
        } else {
          // multer/busboy should provide only the basename of the file, but call
          // path.basename again to be certain there's no chance of path traversal
          const filename = path.basename(req.file.originalname)
          const userNewFile = path.join(userAttachmentsDir, filename)
          const inFile = path.join(userAttachmentsDir, req.file.filename)

          if (fs.existsSync(userNewFile)) {
            fs.unlinkSync(userNewFile)
          }

          fs.renameSync(inFile, userNewFile)
          console.log({ inFile, userNewFile }, 'Sending attachment')

          if (body.vgroupid) {
            try {
              const csra = await WickrIOAPI.cmdSendRoomAttachment(
                body.vgroupid,
                userNewFile,
                filename,
                ttl,
                bor
              )
              res.send(csra)
            } catch (err) {
              console.log({ err, vgroupid: body.vgroupid }, 'Error sending attachment to room')
              return res.status(400).send('Failed to send attachment')
            }
          } else if (body.users) {
            console.log({ bodyusers: body.users })
            const users: string[] = []
            try {
              for (const user of JSON.parse(body.users) as string[]) {
                users.push(user)
              }
            } catch (err) {
              console.log(err)
              return res.status(400).send('error processing users JSON data')
            }

            try {
              const reply = await WickrIOAPI.cmdSend1to1Attachment(
                users,
                userNewFile,
                filename,
                ttl,
                bor
              )
              res.send(reply)
            } catch (err) {
              console.log({ err }, 'Error sending attachment to users')
              return res.status(400).send('error sending attachment!')
            }
          }
        }
      }
    })

  app.route([xapiEndpoint + '/Statistics', endpoint + '/Statistics']).get(async function (
    req: Request,
    res: Response
  ) {
    try {
      let statistics: unknown = await WickrIOAPI.cmdGetStatistics()
      const response = isJson(statistics as string)
      if (response !== false) {
        statistics = response
      }
      if (typeof statistics === 'object' && statistics !== null && 'statistics' in statistics) {
        res.set('Content-Type', 'application/json')
        res.send(statistics)
      }
      console.log(statistics)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to retrieve statistics')
    }
  })

  app.route([xapiEndpoint + '/Statistics', endpoint + '/Statistics']).delete(async function (
    req: Request,
    res: Response
  ) {
    res.set('Content-Type', 'text/plain')
    try {
      const cleared = await WickrIOAPI.cmdClearStatistics()
      console.log(cleared)
      res.send('statistics cleared successfully')
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to clear statistics')
    }
  })

  app.route([xapiEndpoint + '/Rooms', endpoint + '/Rooms']).post(async function (
    req: Request,
    res: Response
  ) {
    if (!req.body.room) {
      return res.type('txt').status(400).send('Cannot process request without a room object')
    }
    const room = req.body.room as RoomRequest
    if (!room.title || !room.description || !room.members || !room.masters) {
      return res
        .type('txt')
        .status(400)
        .send(
          'To Create a secure room you must at least send the following Arguments: Title, description, members and masters.'
        )
    }
    const title = room.title
    const description = room.description
    let ttl = '',
      bor = ''
    if (room.ttl) ttl = room.ttl.toString()
    if (room.bor) bor = room.bor.toString()
    const members: string[] = []
    const masters: string[] = []
    for (const i in room.members) {
      members.push(room.members[i].name)
    }

    for (const i in room.masters) {
      masters.push(room.masters[i].name)
    }
    try {
      const car = await WickrIOAPI.cmdAddRoom(members, masters, title, description, ttl, bor)
      res.type('json').send(car)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to create room')
    }
  })

  app.route([xapiEndpoint + '/Rooms', endpoint + '/Rooms']).get(async function (
    req: Request,
    res: Response
  ) {
    res.set('Content-Type', 'application/json')
    const vGroupID = (req.params as Record<string, string>).vGroupID
    if (vGroupID === undefined) {
      try {
        const cgr = await WickrIOAPI.cmdGetRooms()
        res.type('json').send(cgr)
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to retrieve rooms')
      }
    } else {
      try {
        const cgr = await WickrIOAPI.cmdGetRoom(vGroupID)
        res.send(cgr)
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to retrieve room')
      }
    }
  })

  app.route([xapiEndpoint + '/Rooms/:vGroupID', endpoint + '/Rooms/:vGroupID']).get(async function (
    req: Request,
    res: Response
  ) {
    res.set('Content-Type', 'application/json')
    const vGroupID = req.params.vGroupID as string
    try {
      const cgr = await WickrIOAPI.cmdGetRoom(vGroupID)
      res.send(cgr)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to retrieve room')
    }
  })

  app
    .route([xapiEndpoint + '/Rooms/:vGroupID', endpoint + '/Rooms/:vGroupID'])
    .delete(async function (req: Request, res: Response) {
      const vGroupID = req.params.vGroupID as string
      const reason = req.query.reason as string | undefined
      if (reason === 'leave') {
        try {
          const clr = await WickrIOAPI.cmdLeaveRoom(vGroupID)
          console.log('cmdLeaveRoom:', clr)
          res.send(bot_username + ' left room successfully')
        } catch (err) {
          console.log(err)
          return res.status(400).type('txt').send('Failed to leave room')
        }
      } else {
        try {
          const cdr = await WickrIOAPI.cmdDeleteRoom(vGroupID)
          console.log('cmdDeleteRoom:', cdr)
          res.send('Room deleted successfully')
        } catch (err) {
          console.log(err)
          return res.status(400).type('txt').send('Failed to delete room')
        }
      }
      res.end()
    })

  //ModifyRoom
  app
    .route([xapiEndpoint + '/Rooms/:vGroupID', endpoint + '/Rooms/:vGroupID'])
    .post(async function (req: Request, res: Response) {
      const vGroupID = req.params.vGroupID as string
      if (typeof vGroupID !== 'string') return res.send('vGroupID must be a string.')
      let ttl = '',
        bor = '',
        title = '',
        description = ''
      if (req.body.ttl) ttl = req.body.ttl.toString()
      if (req.body.bor) bor = req.body.bor.toString()
      if (req.body.title) title = req.body.title
      if (req.body.description) description = req.body.description
      const members: string[] = []
      const masters: string[] = []
      if (req.body.members) {
        for (const i in req.body.members) {
          members.push(req.body.members[i].name)
        }
      }
      if (req.body.masters) {
        for (const i in req.body.masters) {
          masters.push(req.body.masters[i].name)
        }
      }
      try {
        const cmr = await WickrIOAPI.cmdModifyRoom(
          vGroupID,
          members,
          masters,
          title,
          description,
          ttl,
          bor
        )
        console.log(cmr)
        res.send('Room modified successfully')
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to modify room')
      }
    })

  app.route([xapiEndpoint + '/GroupConvo', endpoint + '/GroupConvo']).post(async function (
    req: Request,
    res: Response
  ) {
    const groupconvo = req.body.groupconvo as GroupConvoRequest
    if (!groupconvo.members) return res.send('An array of GroupConvo members is required')
    let ttl = '',
      bor = ''
    if (groupconvo.ttl) ttl = groupconvo.ttl.toString()
    if (groupconvo.bor) bor = groupconvo.bor.toString()
    const members: string[] = []
    for (const i in groupconvo.members) {
      members.push(groupconvo.members[i].name)
    }
    try {
      const cagc = await WickrIOAPI.cmdAddGroupConvo(members, ttl, bor)
      console.log(cagc)
      res.type('json').send(cagc)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to create group conversation')
    }
  })

  app.route([xapiEndpoint + '/GroupConvo', endpoint + '/GroupConvo']).get(async function (
    req: Request,
    res: Response
  ) {
    try {
      const cggc = await WickrIOAPI.cmdGetGroupConvos()
      res.type('json').send(cggc)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to retrieve group conversations')
    }
  })

  app
    .route([xapiEndpoint + '/GroupConvo/:vGroupID', endpoint + '/GroupConvo/:vGroupID'])
    .get(async function (req: Request, res: Response) {
      const vGroupID = req.params.vGroupID as string
      try {
        const cggc = await WickrIOAPI.cmdGetGroupConvo(vGroupID)
        res.type('json').send(cggc)
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to retrieve group conversation')
      }
    })

  app
    .route([xapiEndpoint + '/GroupConvo/:vGroupID', endpoint + '/GroupConvo/:vGroupID'])
    .delete(async function (req: Request, res: Response) {
      const vGroupID = req.params.vGroupID as string
      try {
        const cdgc = WickrIOAPI.cmdDeleteGroupConvo(vGroupID)
        console.log(cdgc)
        res.type('txt').send(bot_username + ' has left the GroupConvo.')
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to leave group conversation')
      }
    })

  app.route([xapiEndpoint + '/Messages', endpoint + '/Messages']).get(async function (
    req: Request,
    res: Response
  ) {
    let count = 1
    const maxCount = 1000

    if (req.query.count) {
      count = parseInt(req.query.count as string)
      if (count > maxCount) {
        count = maxCount
      } else if (isNaN(count) || count < 1) {
        return res
          .status(400)
          .type('txt')
          .send(`Invalid count parameter. Must be a number greater than 0.`)
      }
    }

    const msgArray: unknown[] = []
    for (let i = 0; i < count; i++) {
      let message: string
      try {
        message = await WickrIOAPI.cmdGetReceivedMessage()
      } catch (err) {
        console.log({ err }, 'Error calling cmdGetReceivedMessage')
        return res.status(400).type('txt').send('Failed to retrieve messages')
      }
      if (message === '{ }' || message === '' || !message) {
        continue
      } else {
        msgArray.push(JSON.parse(message))
      }
    }

    res.set('Content-Type', 'application/json')
    console.log(`Returning ${msgArray.length} messages from the queue`)
    res.send(msgArray)
    res.end()
  })

  app
    .route([
      xapiEndpoint + '/Messages/:vGroupID/:messageID',
      endpoint + '/Messages/:vGroupID/:messageID',
    ])
    .delete(async function (req: Request, res: Response) {
      const vGroupID = req.params.vGroupID as string
      const msgID = req.params.messageID as string

      const doRecall = (req.query.dorecall as string) || 'false'
      if (doRecall === 'true') {
        try {
          const cdr = await WickrIOAPI.cmdSendRecallMessage(vGroupID, msgID)
          console.log('cmdSendRecallMessage:', cdr)
          res.send('Recall message sent')
        } catch (err) {
          console.log(err)
          return res.status(400).type('txt').send('Failed to recall message')
        }
      } else {
        try {
          const clr = await WickrIOAPI.cmdSendDeleteMessage(vGroupID, msgID)
          console.log('cmdSendDeleteMessage:', clr)
          res.send('Delete message sent')
        } catch (err) {
          console.log(err)
          return res.status(400).type('txt').send('Failed to delete message')
        }
      }
      res.end()
    })

  app
    .route([xapiEndpoint + '/MsgRecvCallback', endpoint + '/MsgRecvCallback'])
    .post(async function (req: Request, res: Response) {
      const callbackUrl = req.query.callbackurl as string
      console.log('callbackUrl:', callbackUrl)
      try {
        const csmc = await WickrIOAPI.cmdSetMsgCallback(callbackUrl)
        console.log(csmc)
        res.type('txt').send(csmc)
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to set message callback')
      }
    })

  app.route([xapiEndpoint + '/MsgRecvCallback', endpoint + '/MsgRecvCallback']).get(async function (
    req: Request,
    res: Response
  ) {
    try {
      const cgmc = await WickrIOAPI.cmdGetMsgCallback()
      res.type('txt').send(cgmc)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to retrieve message callback')
    }
  })

  app
    .route([xapiEndpoint + '/MsgRecvCallback', endpoint + '/MsgRecvCallback'])
    .delete(async function (req: Request, res: Response) {
      try {
        const cdmc = await WickrIOAPI.cmdDeleteMsgCallback()
        console.log(cdmc)
        res.type('txt').send(cdmc)
      } catch (err) {
        console.log(err)
        return res.status(400).type('txt').send('Failed to delete message callback')
      }
    })

  app.route([xapiEndpoint + '/Directory', endpoint + '/Directory']).get(async function (
    req: Request,
    res: Response
  ) {
    try {
      const cgd = await WickrIOAPI.cmdGetDirectory()
      res.type('json').send(cgd)
    } catch (err) {
      console.log(err)
      return res.status(400).type('txt').send('Failed to retrieve directory')
    }
  })

  app.all('*', function (req: Request, res: Response) {
    return res.type('txt').status(404).send(`Endpoint ${req.url} not found`)
  })
}

//Basic function to validate credentials for example
function checkCreds(authToken: string): boolean {
  try {
    let valid = true
    const authStr = Buffer.from(authToken, 'base64').toString()
    //implement authToken verification in here
    if (authStr !== bot_api_auth_token) valid = false
    return valid
  } catch (err) {
    console.log(err)
    return false
  }
}

function isJson(str: string): Record<string, unknown> | false {
  try {
    const parsed = JSON.parse(str)
    return parsed
  } catch (e) {
    return false
  }
}

// Export app for testing
module.exports = { app, bot, main }

// Only run main if this file is executed directly (not imported)
if (require.main === module) {
  main()
}
