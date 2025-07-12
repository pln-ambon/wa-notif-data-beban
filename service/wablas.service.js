const axios = require('axios')
const { WABLAS_TOKEN, WABLAS_URL } = require('../config')

async function sendMessageToWaBlas(message) {
  try {
    await axios({
      method: 'POST',
      url: WABLAS_URL,
      headers: {
        Authorization: WABLAS_TOKEN,
        'Content-Type': 'application/json'
      },
      data: message
    })

    // insert in to log database

    return;
  } catch (error) {
    // if error, insert in to log database
    console.log(error);
    
    return;
  }
}

module.exports = {
  sendMessageToWaBlas
}