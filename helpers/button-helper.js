import logger from './logger'

class ButtonHelper {
  // TODO replace entries parameter with table
  static makeButtonList(
    tableName,
    colName,
    colAction,
    cutStartIndex,
    cutEndIndex,
    entries
  ) {
    const tablestring = JSON.stringify(entries)
    logger.debug('report: table:' + tablestring)
    let messageMeta = {}

    messageMeta = {
      table: {
        name: tableName,
        firstcolname: colName,
        actioncolname: colAction,
        rows: [],
      },
      textcut: [
        {
          startindex: cutStartIndex,
          endindex: cutEndIndex,
        },
      ],
    }
    for (let i = 0; i < entries.length; i++) {
      const response = i + 1
      const row = {
        firstcolvalue: entries[i],
        response: response.toString(),
      }
      messageMeta.table.rows.push(row)
    }

    const messageMetaString = JSON.stringify(messageMeta)
    logger.debug('report: messageMeta:' + messageMetaString)
    return messageMeta
  }

  static makeYesNoButton(preferredIndex = -1) {
    return {
      buttons: [
        {
          type: 'message',
          text: 'Yes',
          message: 'yes',
          preferred: preferredIndex === 0,
        },
        {
          type: 'message',
          text: 'No',
          message: 'no',
          preferred: preferredIndex === 1,
        },
        {
          type: 'message',
          text: 'Cancel',
          message: '/cancel',
          preferred: preferredIndex === 2,
        },
      ],
    }
  }

  static makeMessageButtons(buttonArray, preferredIndex = -1) {
    const buttons = []
    for (const button of buttonArray) {
      buttons.push({
        type: 'message',
        text: button,
        message: button,
        preferred: preferredIndex,
      })
    }
    return { buttons }
  }

  static makeCancelButtons(buttonArray) {
    const buttons = []
    for (const button of buttonArray) {
      buttons.push({
        type: 'message',
        text: button,
        message: button,
      })
    }
    buttons.push({
      type: 'message',
      text: 'Cancel',
      message: '/cancel',
    })
    return { buttons }
  }

  static makeStartButtons(hasHelpButton) {
    const buttons = []
    buttons.push({
      type: 'message',
      text: 'Start a Broadcast',
      message: '/start',
      preferred: true,
    })
    if (hasHelpButton) {
      buttons.push({
        type: 'message',
        text: 'Help',
        message: '/help',
      })
    }
    return { buttons }
  }

  static makeCommandButtons(buttonArray, preferredIndex = -1) {
    const buttons = []
    for (let i = 0; i < buttonArray.length; i++) {
      buttons.push({
        type: 'message',
        text: buttonArray[i],
        message: '/' + buttonArray[i],
        preferred: i === preferredIndex,
      })
    }
    return { buttons }
  }

  static makeRecipientButtons(ackFlag, dmFlag, dmRecipient) {
    const buttons = []
    if (ackFlag) {
      buttons.push({
        type: 'message',
        text: '/Ack',
        message: '/ack',
      })
      // TODO check if location is enabled??
      buttons.push({
        type: 'getlocation',
        text: '/Ack with Location',
      })
    }
    if (dmFlag) {
      // TODO still doing this? const btntext = 'DM ' + this.user.dmRecipient
      buttons.push({
        type: 'dm',
        text: '/Ack and Respond',
        messagetosend: '/ack',
        messagetodm: 'Response to broadcast:',
        userid: dmRecipient,
      })
    }
    const meta = { buttons }
    return JSON.stringify(meta)
  }
}

export default ButtonHelper
