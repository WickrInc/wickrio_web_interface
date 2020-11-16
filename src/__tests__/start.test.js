import { BotAPI } from 'wickrio-toolbox'
import dotenv from 'dotenv'
dotenv.config()

// const rawMessage = JSON.stringify({
//   message: '',
//   message_id: 'x',
//   // msg_ts: '1599257133.267822',
//   msg_ts: 'x',
//   msgtype: 1000,
//   receiver: 'localbroadcasttestbot',
//   respond_api: 'http:///0/Apps//Messages',
//   sender: 'jesttest',
//   // time: '9/4/20 10:05 PM',
//   // ttl: '9/8/20 10:05 PM',
//   users: [
//     { name: 'alane+largeroom@wickr.com' },
//     { name: 'localrecordertestbot' },
//   ],
//   vgroupid: '6bd4fe7088ff7a470b94339fe1eb0d5b18940f6faf30ed3464779daf9eb8f14c', // put in env
// })

const bot = new BotAPI()
// bot.runHandlers()
describe('Connecting', () => {
  it('should test the Bot object, ensuring the bot connects', async () => {
    try {
      const tokens = JSON.parse(process.env.tokens)
      // console.log({ tokens })
      const status = await bot.start(tokens.WICKRIO_BOT_NAME.value)

      // await bot.provision({
      //   status,
      //   setAdminOnly: false,
      //   attachLifeMinutes: '0',
      //   doreceive: 'true',
      //   duration: '0',
      //   readreceipt: 'true',
      //   cleardb: 'false',
      //   contactbackup: 'false',
      //   convobackup: 'false',
      //   verifyusers: tokens.VERIFY_USERS,
      //   // verifyusers = { encryption: false, value: 'automatic' },
      // })
      // // if (!status) {
      // //   exitHandler(null, {
      // //     exit: true,
      // //     reason: 'Client not able to start',
      // //   })
      // // }
      // await bot.startListening(listen) // Passes a callback function that will receive incoming messages into the bot client
      expect(status).toEqual(true)
    } catch (err) {
      console.log(err)
    }
  })
  // it('should test storing a normal message', async () => {
  // expect(status).toEqual(true)
  // })
})
