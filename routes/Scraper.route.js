const express = require('express')

const { getProxies, getScrapData } = require('../controllers/Scraper.controller')

const router = express.Router()

router.get('/proxy', getProxies)
router.get('/scraper', getScrapData)

module.exports = router