const express = require("express")
const https = require("https")
const bodyParser = require("body-parser")
const helmet = require("helmet")
const WickrIOBotAPI = require("wickrio-bot-api")
const fs = require("fs")
const os = require("os")
const app = express()
const logger = require("./logger")
app.use(helmet()) //security http headers
const multer = require("multer")

const bot = new WickrIOBotAPI.WickrIOBot()
const WickrIOAPI = bot.apiService().WickrIOAPI;

process.title = "wickrioWebApi"
process.stdin.resume() //so the program will not close instantly
process.setMaxListeners(0)

async function exitHandler(options, err) {
	try {
		var closed = await bot.close()
		if (err || options.exit) {
			logger.info("Exit reason:", err)
			process.exit()
		} else if (options.pid) {
			process.kill(process.pid)
		}
	} catch (err) {
		logger.error(err)
	}
}

//catches ctrl+c and stop.sh events
process.on("SIGINT", exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { pid: true }))
process.on("SIGUSR2", exitHandler.bind(null, { pid: true }))

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }))

var bot_username,
	bot_port,
	bot_api_key,
	bot_api_auth_token,
	ssl_key_location,
	ssl_crt_location

async function main() {
  bot.processesJsonToProcessEnv()
	try {
		var tokens = JSON.parse(process.env.tokens)
		var status = await bot.start(tokens.WICKRIO_BOT_NAME.value)
		if (!status) {
			exitHandler(null, {
				exit: true,
				reason: "Client not able to start"
			})
		}
	} catch (err) {
		logger.error(err)
	}

	bot.setAdminOnly(false)

	bot_username = tokens.WICKRIO_BOT_NAME.value
	bot_port = tokens.BOT_PORT.value
	bot_api_key = tokens.BOT_API_KEY.value
	bot_api_auth_token = tokens.BOT_API_AUTH_TOKEN.value
	https_choice = tokens.HTTPS_CHOICE.value

	logger.info("bot_username=" + bot_username)
	logger.info("bot_port=" + bot_port)
	logger.info("https_choice=" + https_choice)

  logger.verbose(os.networkInterfaces())

	if (https_choice === "yes" || https_choice === "y") {
		ssl_key_location = tokens.SSL_KEY_LOCATION.value
		ssl_crt_location = tokens.SSL_CRT_LOCATION.value

		try {
			if (!fs.existsSync(ssl_key_location)) {
				exitHandler(null, {
					exit: true,
					reason: "ERROR: Cannot access " + ssl_key_location
				})
			}
		} catch (err) {
			console.error(err)
		}

		try {
			if (!fs.existsSync(ssl_crt_location)) {
				exitHandler(null, {
					exit: true,
					reason: "ERROR: Cannot access " + ssl_crt_location
				})
			}
		} catch (err) {
			console.error(err)
		}

		const credentials = {
			key: fs.readFileSync(ssl_key_location, "utf8"),
			cert: fs.readFileSync(ssl_crt_location, "utf8")
		}

		https.createServer(credentials, app).listen(bot_port, () => {
			console.log("HTTPS Server running on port", bot_port)
		})
	} else {
		app.listen(bot_port, () => {
			console.log("We are live on " + bot_port)
		})
	}

	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: false }))
	// parse application/json
	app.use(bodyParser.json())

	app.use(function (error, req, res, next) {
		if (error instanceof SyntaxError) {
			console.log("bodyParser:", error)
			res.statusCode = 400
			res.type("txt").send(error.toString())
		} else {
			next()
		}
	})

	app.all("*", function (req, res, next) {
		var authHeader = req.get("Authorization")
		var authToken
		if (authHeader) {
			if (authHeader.indexOf(" ") == -1) {
				authToken = authHeader
			} else {
				authHeader = authHeader.split(" ")
				authToken = authHeader[1]
			}
		} else {
			res.set("Authorization", "Basic base64_auth_token")
			return res
				.type("txt")
				.status(401)
				.send(
					'Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"'
				)
		}
		if (!checkCreds(authToken)) {
			res.set("Authorization", "Basic base64_auth_token")
			return res
				.type("txt")
				.status(401)
				.send("Access denied: invalid basic-auth token.")
		}

		next()
	})

	var endpoint = "/WickrIO/V1/Apps/" + bot_api_key
  const xapiEndpoint = "/WickrIO/V2/Apps"

  app.use(xapiEndpoint, function(req, res, next) {
	const xapi = req.get("x-api-key");
	if(xapi != bot_api_key) {
			return res
				.type("txt")
				.status(401)
				.send("Access denied: invalid api-key.")
	}
	next()
  })

	var upload = multer({ dest: "attachments/" })

	app.route([xapiEndpoint + "/Messages", endpoint + "/Messages"]).post(async function (req, res) {
		res.set("Content-Type", "text/plain")
		res.set("Authorization", "Basic base64_auth_token")

		if (!req.body.users && !req.body.vgroupid) {
			return res.send("Need a list of users OR a vGroupID to send a message.")
		} else if (!req.body.message && !req.body.attachment) {
			return res.send("Need a message OR an attachment to send a message.")
		}
		var ttl = "",
			bor = ""
	let messagemeta = {}
		if (req.body.ttl) ttl = req.body.ttl.toString()
		if (req.body.bor) bor = req.body.bor.toString()

	if (req.body.messagemeta)
		messagemeta = JSON.stringify(req.body.messagemeta)
	else
		messagemeta = ""
		if (req.body.users) {
			var users = []
			for (var i in req.body.users) {
				users.push(req.body.users[i].name)
			}
			if (req.body.attachment) {
				var attachment
				var displayName = ""
				if (req.body.attachment.url) {
					if (!req.body.attachment.displayname) {
						res.statusCode = 400
						return res.send("Attachment displayname must be set")
					}
					displayName = req.body.attachment.displayname
					attachment = req.body.attachment.url
				} else {
					if (req.body.attachment.displayname)
						displayName = req.body.attachment.displayname
					attachment = req.body.attachment.filename
				}
				console.log("displayName:", displayName)
				try {
					var s1t1a = await WickrIOAPI.cmdSend1to1Attachment(
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
				var message = req.body.message
				try {
					var csm = await WickrIOAPI.cmdSend1to1Message(users, message, ttl, bor, '', [], messagemeta)
					console.log(csm)
					res.send(csm)
				} catch (err) {
					console.log(err)
					res.statusCode = 400
					res.send(err.toString())
				}
			}
		} else if (req.body.vgroupid) {
			var vGroupID = req.body.vgroupid
			if (req.body.attachment) {
				var attachment
				var displayName = ""
				if (req.body.attachment.url) {
					if (!req.body.attachment.displayname) {
						res.statusCode = 400
						return res.send("Attachment displayname must be set.")
					}
					displayName = req.body.attachment.displayname
					attachment = req.body.attachment.url
				} else {
					if (req.body.attachment.displayname)
						displayName = req.body.attachment.displayname
					attachment = req.body.attachment.filename
				}
				console.log("attachment:", attachment)
				console.log("displayName:", displayName)
				try {
					var csra = await WickrIOAPI.cmdSendRoomAttachment(
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
				var message = req.body.message
				try {
					var csrm = await WickrIOAPI.cmdSendRoomMessage(
						vGroupID,
						message,
						ttl,
						bor,
			'',
			[],
			messagemeta
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
	})

	app.route([xapiEndpoint + "/File", endpoint + "/File"]).post(upload.single("attachment"), async function (req, res) {
		res.set("Content-Type", "text/plain")
		res.set("Authorization", "Basic base64_auth_token")

		if (!req.body.users && !req.body.vgroupid) {
			return res.send("Need a list of users OR a vGroupID to send a message.")
		} else {
			var userAttachments
			var userNewFile
			var inFile
			let { ttl = "", bor = "" } = req.body
			if (req.file === undefined) {
				console.log("attachment is not defined!")
				return
			} else {
				userAttachments = process.cwd() + "/attachments"
				userNewFile = userAttachments + "/" + req.file.originalname

				inFile = process.cwd() + "/attachments/" + req.file.filename

				fs.mkdirSync(userAttachments, { recursive: true })
				if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile)
				// userAttachments = process.cwd() + '/attachments/' + req.user.email;
				fs.renameSync(inFile, userNewFile)
				console.log({ inFile, userNewFile })

				if (req.body.vgroupid) {
					try {
						var csra = await WickrIOAPI.cmdSendRoomAttachment(
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
					var users = []
					try {
						for (let user of JSON.parse(req.body.users)) {
							users.push(user)
						}
					} catch (err) {
						console.log(err)
						res.statusCode = 400
						res.send('error processing users JSON data')
						return
					}

					try {
						let reply = await WickrIOAPI.cmdSend1to1Attachment(
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
						res.send('error sending attachment!')
					}
				}
			}
		}
	})

	app.route([xapiEndpoint + "/Statistics", endpoint + "/Statistics"]).get(async function (req, res) {
	  try {
		var statistics = await WickrIOAPI.cmdGetStatistics()
		var response = isJson(statistics)
		if (response !== false) {
		  statistics = response
		}
		if (statistics.statistics) {
		  res.set("Content-Type", "application/json")
		  res.send(statistics)
		}
		console.log(statistics)
	  } catch (err) {
		console.log(err)
		res.statusCode = 400
		res.type("txt").send(err.toString())
	  }
  })

	app.route([xapiEndpoint + "/Statistics", endpoint + "/Statistics"]).delete(async function (req, res) {
		res.set("Content-Type", "text/plain")
		try {
			var cleared = await WickrIOAPI.cmdClearStatistics()
			console.log(cleared)
			res.send("statistics cleared successfully")
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/Rooms", endpoint + "/Rooms"]).post(async function (req, res) {
		if (!req.body.room) {
			return res
				.type("txt")
				.status(400)
				.send("Cannot process request without a room object")
		}
		var room = req.body.room
		if (!room.title || !room.description || !room.members || !room.masters) {
			return res
				.type("txt")
				.status(400)
				.send(
					"To Create a secure room you must at least send the following Arguments: Title, description, members and masters."
				)
		}
		var title = room.title
		var description = room.description
		var ttl = "",
			bor = ""
		if (room.ttl) ttl = room.ttl.toString()
		if (room.bor) bor = room.bor.toString()
		var members = [],
			masters = []
		for (var i in room.members) {
			members.push(room.members[i].name)
		}

		for (var i in room.masters) {
			masters.push(room.masters[i].name)
		}
		try {
			var car = await WickrIOAPI.cmdAddRoom(
				members,
				masters,
				title,
				description,
				ttl,
				bor
			)
			res.type("json").send(car)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/Rooms", endpoint + "/Rooms"]).get(async function (req, res) {
		res.set("Content-Type", "application/json")
		var vGroupID = req.params.vGroupID
		if (vGroupID === undefined) {
			try {
				var cgr = await WickrIOAPI.cmdGetRooms()
				res.type("json").send(cgr)
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		} else {
			try {
				var cgr = await WickrIOAPI.cmdGetRoom(vGroupID)
				res.send(cgr)
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		}
	})

	app.route([xapiEndpoint + "/Rooms/:vGroupID", endpoint + "/Rooms/:vGroupID"]).get(async function (req, res) {
		res.set("Content-Type", "application/json")
		var vGroupID = req.params.vGroupID
		try {
			var cgr = await WickrIOAPI.cmdGetRoom(vGroupID)
			res.send(cgr)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/Rooms/:vGroupID", endpoint + "/Rooms/:vGroupID"]).delete(async function (req, res) {
		var vGroupID = req.params.vGroupID
		var reason = req.query.reason
		if (reason === "leave") {
			try {
				var clr = await WickrIOAPI.cmdLeaveRoom(vGroupID)
				console.log("cmdLeaveRoom:", clr)
				res.send(bot_username + " left room successfully")
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		} else {
			try {
				var cdr = await WickrIOAPI.cmdDeleteRoom(vGroupID)
				console.log("cmdDeleteRoom:", cdr)
				res.send("Room deleted successfully")
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		}
		res.end()
	})

	//ModifyRoom
	app.route([xapiEndpoint + "/Rooms/:vGroupID", endpoint + "/Rooms/:vGroupID"]).post(async function (req, res) {
		var vGroupID = req.params.vGroupID
		if (typeof vGroupID !== "string")
			return res.send("vGroupID must be a string.")
		var ttl = "",
			bor = "",
			title = "",
			description = ""
		if (req.body.ttl) ttl = req.body.ttl.toString()
		if (req.body.bor) bor = req.body.bor.toString()
		if (req.body.title) title = req.body.title
		if (req.body.description) description = req.body.description
		var members = [],
			masters = []
		if (req.body.members) {
			for (var i in req.body.members) {
				members.push(req.body.members[i].name)
			}
		}
		if (req.body.masters) {
			for (var i in req.body.masters) {
				masters.push(req.body.masters[i].name)
			}
		}
		try {
			var cmr = await WickrIOAPI.cmdModifyRoom(
				vGroupID,
				members,
				masters,
				title,
				description,
				ttl,
				bor
			)
			console.log(cmr)
			res.send("Room modified successfully")
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/GroupConvo", endpoint + "/GroupConvo"]).post(async function (req, res) {
		var groupconvo = req.body.groupconvo
		if (!groupconvo.members)
			return res.send("An array of GroupConvo members is required")
		var ttl = "",
			bor = ""
		if (groupconvo.ttl) ttl = groupconvo.ttl.toString()
		if (groupconvo.bor) bor = groupconvo.bor.toString()
		var members = []
		for (var i in groupconvo.members) {
			members.push(groupconvo.members[i].name)
		}
		try {
			var cagc = await WickrIOAPI.cmdAddGroupConvo(members, ttl, bor)
			console.log(cagc)
			res.type("json").send(cagc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/GroupConvo", endpoint + "/GroupConvo"]).get(async function (req, res) {
		try {
			var cggc = await WickrIOAPI.cmdGetGroupConvos()
			res.type("json").send(cggc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/GroupConvo/:vGroupID", endpoint + "/GroupConvo/:vGroupID"]).get(async function (req, res) {
		var vGroupID = req.params.vGroupID
		try {
			var cggc = await WickrIOAPI.cmdGetGroupConvo(vGroupID)
			res.type("json").send(cggc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/GroupConvo/:vGroupID", endpoint + "/GroupConvo/:vGroupID"]).delete(async function (req, res) {
		var vGroupID = req.params.vGroupID
		try {
			var cdgc = WickrIOAPI.cmdDeleteGroupConvo(vGroupID)
			console.log(cdgc)
			res.type("txt").send(bot_username + " has left the GroupConvo.")
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/Messages", endpoint + "/Messages"]).get(async function (req, res) {
		console.log("Received GET request to /Messages endpoint")
		var count = 1

		// Cap message count at 10
		if (req.query.count) {
			count = Math.min(req.query.count, 10)
		}

		var msgArray = []
		for (var i = 0; i < count; i++) {
			try {
				var message = await WickrIOAPI.cmdGetReceivedMessage()
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				return res.type("txt").send(err.toString())
			}
			if (message === "{ }" || message === "" || !message) {
				continue
			} else {
				msgArray.push(JSON.parse(message))
				console.log(message)
			}
		}
		if (msgArray === "[]") {
			res.set("Content-Type", "text/plain")
		} else {
			res.set("Content-Type", "application/json")
			console.log(`Returning ${msgArray.length} messages in response`)
		}

		res.send(msgArray)
		res.end()
	})

	app.route([xapiEndpoint + "/Messages/:vGroupID/:messageID", endpoint + "/Messages/:vGroupID/:messageID"]).delete(async function (req, res) {
		var vGroupID = req.params.vGroupID
		var msgID = req.params.messageID

		var doRecall = req.query.dorecall ? req.query.dorecall : "false"
		if (doRecall === "true") {
			try {
				var cdr = await WickrIOAPI.cmdSendRecallMessage(vGroupID, msgID)
				console.log("cmdSendRecallMessage:", cdr)
				res.send("Recall message sent")
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		} else {
			try {
				var clr = await WickrIOAPI.cmdSendDeleteMessage(vGroupID, msgID)
				console.log("cmdSendDeleteMessage:", clr)
				res.send("Delete message sent")
			} catch (err) {
				console.log(err)
				res.statusCode = 400
				res.type("txt").send(err.toString())
			}
		}
		res.end()
	})

	app.route([xapiEndpoint + "/MsgRecvCallback", endpoint + "/MsgRecvCallback"]).post(async function (req, res) {
		var callbackUrl = req.query.callbackurl
		console.log("callbackUrl:", callbackUrl)
		try {
			var csmc = await WickrIOAPI.cmdSetMsgCallback(callbackUrl)
			console.log(csmc)
			res.type("txt").send(csmc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/MsgRecvCallback", endpoint + "/MsgRecvCallback"]).get(async function (req, res) {
		try {
			var cgmc = await WickrIOAPI.cmdGetMsgCallback() // callbabck
			res.type("txt").send(cgmc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/MsgRecvCallback", endpoint + "/MsgRecvCallback"]).delete(async function (req, res) {
		try {
			var cdmc = await WickrIOAPI.cmdDeleteMsgCallback()
			console.log(cdmc)
			res.type("txt").send(cdmc)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	app.route([xapiEndpoint + "/Directory", endpoint + "/Directory"]).get(async function (req, res) {
		try {
			var cgd = await WickrIOAPI.cmdGetDirectory()
			res.type("json").send(cgd)
		} catch (err) {
			console.log(err)
			res.statusCode = 400
			res.type("txt").send(err.toString())
		}
	})

	// What to do for ALL requests for ALL Paths
	// that are not handled above
	app.all("*", function (req, res) {
		console.log("*** 404 ***")
		console.log("404 for url: " + req.url)
		console.log("***********")
		return res
			.type("txt")
			.status(404)
			.send("Endpoint " + req.url + " not found")
	})

}

//Basic function to validate credentials for example
function checkCreds(authToken) {
	try {
		var valid = true
		const authStr = Buffer.from(authToken, "base64").toString()
		//implement authToken verification in here
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
