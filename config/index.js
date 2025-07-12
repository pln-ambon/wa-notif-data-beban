require('dotenv').config()

const {
  PORT,
  DB_SERVER,
  DB_PASSWORD,
  DB_USER,
  DB_NAME,
  DB_PORT,
  WABLAS_URL,
  WABLAS_TOKEN,
  WA_GROUP_ID,
  WA_PRIVATE_ID
} = process.env

const config = {
  sqlConfig: {
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    server: DB_SERVER,
    port: Number(DB_PORT),
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: true, 
      trustServerCertificate: true
    }
  },
  WABLAS_URL,
  WABLAS_TOKEN,
  WA_GROUP_ID,
  WA_PRIVATE_ID,
  PORT: PORT ? Number(PORT) : 7001
}

module.exports = config