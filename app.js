require('dotenv').config()

const express = require('express')

const connectDatabase = require('./helpers/database/ConnectDatabase.helper')
const { scheduler } = require('./helpers/utils/Scheduler.helper')

const router = require('./routes/App.route')
const port = process.env.PORT || 3000

connectDatabase()
scheduler.start()

const app = express()

app.use(
    express.urlencoded({ extended: true }),
    express.json()
)
app.use(router)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})