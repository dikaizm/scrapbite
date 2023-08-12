const express = require('express')

const Scraper = require('./Scraper.route')

const router = express.Router()

router.use('/api', Scraper)

module.exports = router