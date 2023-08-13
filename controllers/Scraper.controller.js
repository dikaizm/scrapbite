const puppeteer = require('puppeteer')
const proxyChain = require('proxy-chain');
const Proxy = require('../models/Proxy.model');
const sequelize = require('../configs/db.config');

const getProxies = async (req, res) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    try {
        await page.goto('https://www.sslproxies.org/')

        const tables = await page.evaluate(() => {
            const tableRows = Array.from(document.querySelectorAll('table.table tr'))
            const headerCells = tableRows[0].querySelectorAll('th')
            const headers = Array.from(headerCells).map(cell => cell.textContent.trim().toLowerCase().replace(/\s+/g, '_'))

            const rowData = tableRows.slice(1, 101).map((row, i) => {
                const cells = row.querySelectorAll('td');
                const rowObj = {};
                rowObj['id'] = i + 1

                Array.from(cells).forEach((cell, j) => {
                    rowObj[headers[j]] = cell.textContent.trim();
                });

                const lastChecked = rowObj['last_checked'].split(' ');
                let lastCheckedMs = 0;

                for (let i = 0; i < lastChecked.length; i += 2) {
                    const value = parseInt(lastChecked[i]);
                    const unit = lastChecked[i + 1] ? lastChecked[i + 1].toLowerCase() : '';

                    if (unit.includes('hour')) {
                        lastCheckedMs += value * 60 * 60 * 1000;
                    } else if (unit.includes('min')) {
                        lastCheckedMs += value * 60 * 1000;
                    } else if (unit.includes('sec')) {
                        lastCheckedMs += value * 1000;
                    }
                }

                const currentTime = Date.now()
                const timestamp = currentTime - lastCheckedMs

                rowObj['last_checked'] = new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
                rowObj['port'] = parseInt(rowObj['port'], 10)

                if (rowObj['google'] !== 'yes') rowObj['google'] = false
                else rowObj['google'] = true

                if (rowObj['https'] !== 'yes') rowObj['https'] = false
                else rowObj['https'] = true

                return rowObj;
            });

            return rowData.slice(0, 100)
        })

        await Promise.all(tables.map(async (row) => {
            await Proxy.create({
                id: row.id,
                ip_address: row.ip_address,
                port: row.port,
                code: row.code,
                country: row.country,
                anonymity: row.anonymity,
                google: row.google,
                https: row.https,
                last_checked: sequelize.literal(`STR_TO_DATE('${row.last_checked}', '%c/%e/%Y %h:%i:%s %p')`),
            })
        }))

        res.json({ result: { tables } })
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await browser.close()
    }
}

module.exports = { getProxies }