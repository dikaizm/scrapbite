const express = require('express')

const { getProxies } = require('../controllers/Scraper.controller')

const router = express.Router()

router.get('/scraper', getProxies)

module.exports = router