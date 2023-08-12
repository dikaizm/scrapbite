require('dotenv').config()

const router = require('./routes/App.route')
const port = process.env.PORT || 3000

const express = require('express')

const app = express()

app.use(express.json())
app.use(router)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})