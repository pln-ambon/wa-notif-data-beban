require("dotenv").config();

const express = require("express");
const app = express();

const { PORT } = require('./config')

const cronJob = require('./service')

cronJob.start()

app.listen(PORT, () => {
  console.log("App is running on port " + PORT);
});
