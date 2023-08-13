const Bree = require('bree')
const ms = require('ms')

const config = {
    jobs: [
        {
            name: 'GetProxy.job',
            interval: '20m',
            closeWorkerAfterMs: ms('20s')
        }
    ]
}

const scheduler = new Bree(config)

module.exports = { scheduler }