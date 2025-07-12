const cron = require("node-cron");
const sql = require('mssql')
const moment = require("moment");
const {
  getDataEvent,
} = require("../model/scada_unit.model")
const { dateEventMessage } = require("../utils/message-builder");
const { sendMessageToWaBlas } = require("./wablas.service")
const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"]

// Running job every minutes
const cronJob = cron.schedule(`* * * * *`, async () => {
  try {
    const day = days[new Date().getDay()]
    const notifTime = formatDate(moment(new Date()).add(9, 'hours'))
    const data = await getDataEvent()

   for (const item of data) {
      const message = dateEventMessage({ payload: item, day, notifTime })
      await sendMessageToWaBlas(message)
    }

  } catch (error) {
    console.log(error, "<<< error")
  }
});

module.exports = cronJob
