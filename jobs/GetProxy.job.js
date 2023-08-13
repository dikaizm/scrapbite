const { Worker } = require('worker_threads')

console.log('Updating proxy server data...');

const worker = new Worker('./jobs/workers/GetProxy.worker.js')

worker.on('message', (message) => {
    console.log(message);
});

worker.on('error', (error) => {
    console.error(error);
});

worker.on('exit', (code) => {
    console.log(`Exit code: ${code}`);
});