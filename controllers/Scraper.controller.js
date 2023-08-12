const puppeteer = require('puppeteer')
const proxyChain = require('proxy-chain')

const getProxies = async (req, res) => {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()

    try {
        await page.goto('https://www.sslproxies.org/')

        const tables = await page.evaluate(() => {
            const tableRows = Array.from(document.querySelectorAll('table.table tr'))
            const headerCells = tableRows[0].querySelectorAll('th')
            const headers = Array.from(headerCells).map(cell => cell.textContent.trim())

            const rowData = tableRows.slice(1).map((row, index) => {
                const cells = row.querySelectorAll('td')
                const rowObj = Array.from(cells).reduce((rowObj, cell, index) => {
                    rowObj[headers[index]] = cell.textContent.trim()
                    return rowObj
                }, {});
                rowObj['id'] = index + 1

                return rowObj
            })

            return rowData.slice(0, 100)
        })

        res.json({ result: { tables } })
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await browser.close()
    }
}

module.exports = { getProxies }