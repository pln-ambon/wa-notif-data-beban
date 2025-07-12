require("dotenv").config();

const express = require("express");
const app = express();

const { PORT } = require('./config')

const schedulerPowerData = require('./service/scheduler-power-data.service')

schedulerPowerData.start()

app.listen(PORT, () => {
  console.log("App is running on port " + PORT);
});
