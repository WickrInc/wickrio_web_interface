/* eslint-disable camelcase */
import express from 'express'
import https from 'https'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import * as WickrIOAPI from 'wickrio_addon'
import WickrIOBotAPI from 'wickr-bot-api'
import fs from 'fs'
import multer from 'multer'

const app = express()
app.use(helmet()) // security http headers

const bot = new WickrIOBotAPI.WickrIOBot()

process.title = 'wickrioWebApi'
process.stdin.resume() // so the program will not close instantly
process.setMaxListeners(0)

async function exitHandler(options, err) {
  try {
    await bot.close()
    if (err || options.exit) {
      console.log('Exit reason:', err)
      process.exit()
    } else if (options.pid) {
      process.kill(process.pid)
    }
  } catch (err) {
    console.log(err)
  }
}

// catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }))

let bot_username,
  bot_port,
  bot_api_key,
  bot_api_auth_token,
  ssl_key_location,
  ssl_crt_location,
  https_choice

async function main() {
  const tokens = JSON.parse(process.env.tokens)
  try {
    const status = await bot.start(tokens.WICKRIO_BOT_NAME.value)
    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      })
    }
  } catch (err) {
    console.log(err)
  }

  bot.setAdminOnly(false)

  bot_username = tokens.WICKRIO_BOT_NAME.value
  bot_port = tokens.BOT_PORT.value
  bot_api_key = tokens.BOT_API_KEY.value
  bot_api_auth_token = tokens.BOT_API_AUTH_TOKEN.value
  https_choice = tokens.HTTPS_CHOICE.value

  console.log('bot_username=' + bot_username)
  console.log('bot_port=' + bot_port)
  console.log('https_choice=' + https_choice)

  if (https_choice === 'yes' || https_choice === 'y') {
    ssl_key_location = tokens.SSL_KEY_LOCATION.value
    ssl_crt_location = tokens.SSL_CRT_LOCATION.value

    try {
      if (!fs.existsSync(ssl_key_location)) {
        exitHandler(null, {
          exit: true,
          reason: 'ERROR: Cannot access ' + ssl_key_location,
        })
      }
    } catch (err) {
      console.error(err)
    }

    try {
      if (!fs.existsSync(ssl_crt_location)) {
        exitHandler(null, {
          exit: true,
          reason: 'ERROR: Cannot access ' + ssl_crt_location,
        })
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
  } else {
    app.listen(bot_port, () => {
      console.log('We are live on ' + bot_port)
    })
  }

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())

  app.use(function (error, req, res, next) {
    if (error instanceof SyntaxError) {
      console.log('bodyParser:', error)
      res.statusCode = 400
      res.type('txt').send(error.toString())
    } else {
      next()
    }
  })

  app.all('*', function (req, res, next) {
    next()
  })

  const endpoint = '/WickrIO/V1/Apps/' + bot_api_key
  const upload = multer({ dest: 'attachments/' })

  app.post(endpoint + '/Messages', function (req, res) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      res.statusCode = 401
      return res.send(
        'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
      )
    }
    // Check credentials
    if (!checkCreds(authToken)) {
      res.statusCode = 401
      return res.send('Access denied: invalid basic-auth token.')
    } else {
      if (!req.body.users && !req.body.vgroupid) {
        return res.send('Need a list of users OR a vGroupID to send a message.')
      } else if (!req.body.message && !req.body.attachment) {
        return res.send('Need a message OR an attachment to send a message.')
      }
      let ttl = ''
      let bor = ''
      if (req.body.ttl) ttl = req.body.ttl.toString()
      if (req.body.bor) bor = req.body.bor.toString()
      if (req.body.users) {
        const users = []
        for (const i in req.body.users) {
          users.push(req.body.users[i].name)
        }
        if (req.body.attachment) {
          let attachment
          let displayName = ''
          if (req.body.attachment.url) {
            if (!req.body.attachment.displayname) {
              res.statusCode = 400
              return res.send('Attachment displayname must be set')
            }
            displayName = req.body.attachment.displayname
            attachment = req.body.attachment.url
          } else {
            if (req.body.attachment.displayname)
              displayName = req.body.attachment.displayname
            attachment = req.body.attachment.filename
          }
          console.log('displayName:', displayName)
          try {
            const s1t1a = WickrIOAPI.cmdSend1to1Attachment(
              users,
              attachment,
              displayName,
              ttl,
              bor
            )
            res.send(s1t1a)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        } else {
          const message = req.body.message
          try {
            const csm = WickrIOAPI.cmdSend1to1Message(users, message, ttl, bor)
            console.log(csm)
            res.send(csm)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        }
      } else if (req.body.vgroupid) {
        const vGroupID = req.body.vgroupid
        if (req.body.attachment) {
          let attachment
          let displayName = ''
          if (req.body.attachment.url) {
            if (!req.body.attachment.displayname) {
              res.statusCode = 400
              return res.send('Attachment displayname must be set.')
            }
            displayName = req.body.attachment.displayname
            attachment = req.body.attachment.url
          } else {
            if (req.body.attachment.displayname)
              displayName = req.body.attachment.displayname
            attachment = req.body.attachment.filename
          }
          console.log('attachment:', attachment)
          console.log('displayName:', displayName)
          try {
            const csra = WickrIOAPI.cmdSendRoomAttachment(
              vGroupID,
              attachment,
              displayName,
              ttl,
              bor
            )
            console.log(csra)
            res.send(csra)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        } else {
          const message = req.body.message
          try {
            const csrm = WickrIOAPI.cmdSendRoomMessage(
              vGroupID,
              message,
              ttl,
              bor
            )
            console.log(csrm)
            res.send(csrm)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        }
      }
    }
  })

  app.post(endpoint + '/File', upload.single('attachment'), function (
    req,
    res
  ) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')

    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      res.statusCode = 401
      return res.send(
        'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
      )
    }
    // Check credentials
    if (!checkCreds(authToken)) {
      res.statusCode = 401
      return res.send('Access denied: invalid basic-auth token.')
    } else if (!req.body.users && !req.body.vgroupid) {
      return res.send('Need a list of users OR a vGroupID to send a message.')
    } else {
      let userAttachments
      let userNewFile
      let inFile
      const { ttl = '', bor = '' } = req.body
      if (req.file === undefined) {
        console.log('attachment is not defined!')
      } else {
        userAttachments = process.cwd() + '/attachments'
        userNewFile = userAttachments + '/' + req.file.originalname

        inFile = process.cwd() + '/attachments/' + req.file.filename

        fs.mkdirSync(userAttachments, { recursive: true })
        if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile)
        // userAttachments = process.cwd() + '/attachments/' + req.user.email;
        fs.renameSync(inFile, userNewFile)
        console.log({ inFile, userNewFile })

        if (req.body.vgroupid) {
          try {
            const csra = WickrIOAPI.cmdSendRoomAttachment(
              req.body.vgroupid,
              userNewFile,
              req.file.originalname,
              ttl,
              bor
            )
            res.send(csra)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        } else if (req.body.users) {
          // userAttachments = process.cwd() + '/attachments/' + req.user.email;
          console.log({ bodyusers: req.body.users })
          const users = []
          for (const user of JSON.parse(req.body.users)) {
            users.push(user)
          }
          try {
            const reply = WickrIOAPI.cmdSend1to1Attachment(
              users,
              userNewFile,
              req.file.originalname,
              ttl,
              bor
            )
            res.send(reply)
          } catch (err) {
            console.log(err)
            res.statusCode = 400
            res.send(err.toString())
          }
        }
      }
    }
  })

  app.get(endpoint + '/Statistics', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      res.statusCode = 401
      res.set('Authorization', 'Basic base64_auth_token')
      res.set('Content-Type', 'text/plain')
      return res.send(
        'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
      )
    }
    if (!checkCreds(authToken)) {
      res.statusCode = 401
      res.set('Authorization', 'Basic base64_auth_token')
      res.set('Content-Type', 'text/plain')
      return res.send('Access denied: invalid basic-auth token.')
    } else {
      try {
        let statistics = WickrIOAPI.cmdGetStatistics()
        const response = isJson(statistics)
        if (response !== false) {
          statistics = response
        }
        if (statistics.statistics) {
          res.set('Content-Type', 'application/json')
          res.send(statistics)
        }
        console.log(statistics)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.delete(endpoint + '/Statistics', function (req, res) {
    res.set('Content-Type', 'text/plain')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cleared = WickrIOAPI.cmdClearStatistics()
        console.log(cleared)
        res.send('statistics cleared successfully')
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.post(endpoint + '/Rooms', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      if (!req.body.room) {
        return res
          .type('txt')
          .status(400)
          .send('Cannot process request without a room object')
      }
      const room = req.body.room
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
      let ttl = ''
      let bor = ''
      if (room.ttl) ttl = room.ttl.toString()
      if (room.bor) bor = room.bor.toString()
      const members = []
      const masters = []
      for (const i in room.members) {
        members.push(room.members[i].name)
      }

      for (const i in room.masters) {
        masters.push(room.masters[i].name)
      }
      try {
        const car = WickrIOAPI.cmdAddRoom(
          members,
          masters,
          title,
          description,
          ttl,
          bor
        )
        res.type('json').send(car)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/Rooms/:vGroupID', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      res.set('Content-Type', 'application/json')
      const vGroupID = req.params.vGroupID
      try {
        const cgr = WickrIOAPI.cmdGetRoom(vGroupID)
        res.send(cgr)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/Rooms', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cgr = WickrIOAPI.cmdGetRooms()
        res.type('json').send(cgr)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.delete(endpoint + '/Rooms/:vGroupID', function (req, res) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      return res
        .status(401)
        .send(
          'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
        )
    }
    if (!checkCreds(authToken)) {
      return res.status(401).send('Access denied: invalid basic-auth token.')
    } else {
      const vGroupID = req.params.vGroupID
      const reason = req.query.reason
      if (reason === 'leave') {
        try {
          const clr = WickrIOAPI.cmdLeaveRoom(vGroupID)
          console.log('cmdLeaveRoom:', clr)
          res.send(bot_username + ' left room successfully')
        } catch (err) {
          console.log(err)
          res.statusCode = 400
          res.type('txt').send(err.toString())
        }
      } else {
        try {
          const cdr = WickrIOAPI.cmdDeleteRoom(vGroupID)
          console.log('cmdDeleteRoom:', cdr)
          res.send('Room deleted successfully')
        } catch (err) {
          console.log(err)
          res.statusCode = 400
          res.type('txt').send(err.toString())
        }
      }
      res.end()
    }
  })

  // ModifyRoom
  app.post(endpoint + '/Rooms/:vGroupID', function (req, res) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      return res
        .status(401)
        .send(
          'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
        )
    }
    if (!checkCreds(authToken)) {
      return res.status(401).send('Access denied: invalid basic-auth token.')
    } else {
      const vGroupID = req.params.vGroupID
      if (typeof vGroupID !== 'string')
        return res.send('vGroupID must be a string.')
      let ttl = ''
      let bor = ''
      let title = ''
      let description = ''
      if (req.body.ttl) ttl = req.body.ttl.toString()
      if (req.body.bor) bor = req.body.bor.toString()
      if (req.body.title) title = req.body.title
      if (req.body.description) description = req.body.description
      const members = []
      const masters = []
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
        const cmr = WickrIOAPI.cmdModifyRoom(
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
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.post(endpoint + '/GroupConvo', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      const groupconvo = req.body.groupconvo
      if (!groupconvo.members)
        return res.send('An array of GroupConvo members is required')
      let ttl = ''
      let bor = ''
      if (groupconvo.ttl) ttl = groupconvo.ttl.toString()
      if (groupconvo.bor) bor = groupconvo.bor.toString()
      const members = []
      for (const i in groupconvo.members) {
        members.push(groupconvo.members[i].name)
      }
      try {
        const cagc = WickrIOAPI.cmdAddGroupConvo(members, ttl, bor)
        console.log(cagc)
        res.type('json').send(cagc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/GroupConvo', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cggc = WickrIOAPI.cmdGetGroupConvos()
        res.type('json').send(cggc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/GroupConvo/:vGroupID', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      const vGroupID = req.params.vGroupID
      try {
        const cggc = WickrIOAPI.cmdGetGroupConvo(vGroupID)
        res.type('json').send(cggc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.delete(endpoint + '/GroupConvo/:vGroupID', function (req, res) {
    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      res.statusCode = 401
      return res.send(
        'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
      )
    }
    if (!checkCreds(authToken)) {
      res.statusCode = 401
      return res.send('Access denied: invalid basic-auth token.')
    } else {
      const vGroupID = req.params.vGroupID
      try {
        const cdgc = WickrIOAPI.cmdDeleteGroupConvo(vGroupID)
        console.log(cdgc)
        res.send(bot_username + ' has left the GroupConvo.')
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/Messages', async function (req, res) {
    res.set('Authorization', 'Basic base64_auth_token')
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      return res
        .type('txt')
        .status(401)
        .send(
          'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
        )
    }
    if (!checkCreds(authToken)) {
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      let count = 1
      // const index = 0
      if (req.query.count) count = req.query.count
      const msgArray = []
      for (let i = 0; i < count; i++) {
        try {
          const message = await WickrIOAPI.cmdGetReceivedMessage()
          if (message === '{ }' || message === '' || !message) {
            continue
          } else {
            msgArray.push(JSON.parse(message))
            console.log(message)
          }
        } catch (err) {
          console.log(err)
          res.statusCode = 400
          return res.type('txt').send(err.toString())
        }
      }
      if (msgArray === '[]') res.set('Content-Type', 'text/plain')
      else res.set('Content-Type', 'application/json')
      res.send(msgArray)
      res.end()
    }
  })

  app.post(endpoint + '/MsgRecvCallback', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      const callbackUrl = req.query.callbackurl
      console.log('callbackUrl:', callbackUrl)
      try {
        const csmc = WickrIOAPI.cmdSetMsgCallback(callbackUrl)
        console.log(csmc)
        res.type('txt').send(csmc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/MsgRecvCallback', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cgmc = WickrIOAPI.cmdGetMsgCallback() // callbabck
        res.type('txt').send(cgmc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.delete(endpoint + '/MsgRecvCallback', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cdmc = WickrIOAPI.cmdDeleteMsgCallback()
        console.log(cdmc)
        res.type('txt').send(cdmc)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  app.get(endpoint + '/Directory', function (req, res) {
    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
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
    if (!checkCreds(authToken)) {
      res.set('Authorization', 'Basic base64_auth_token')
      return res
        .type('txt')
        .status(401)
        .send('Access denied: invalid basic-auth token.')
    } else {
      try {
        const cgd = WickrIOAPI.cmdGetDirectory()
        res.type('json').send(cgd)
      } catch (err) {
        console.log(err)
        res.statusCode = 400
        res.type('txt').send(err.toString())
      }
    }
  })

  // What to do for ALL requests for ALL Paths
  // that are not handled above
  app.all('*', function (req, res) {
    console.log('*** 404 ***')
    console.log('404 for url: ' + req.url)
    console.log('***********')
    return res
      .type('txt')
      .status(404)
      .send('Endpoint ' + req.url + ' not found')
  })

  // What to do for ALL requests for ALL Paths
  // that are not handled above
  app.all('*', function (req, res) {
    console.log('*** 404 ***')
    console.log('404 for url: ' + req.url)
    console.log('***********')
    return res
      .type('txt')
      .status(404)
      .send('Endpoint ' + req.url + ' not found')
  })
}

// Basic function to validate credentials for example
function checkCreds(authToken) {
  try {
    let valid = true
    const authStr = Buffer.from(authToken, 'base64').toString()
    // implement authToken verification in here
    if (authStr !== bot_api_auth_token) valid = false
    return valid
  } catch (err) {
    console.log(err)
  }
}

function isJson(str) {
  try {
    str = JSON.parse(str)
  } catch (e) {
    return false
  }
  return str
}

main()
