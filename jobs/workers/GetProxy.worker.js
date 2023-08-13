const { parentPort } = require('worker_threads')
const { getProxies } = require('../../controllers/Scraper.controller')

getProxies().then(() => {
    if (parentPort) parentPort.postMessage('done')
    else process.exit(0)
})