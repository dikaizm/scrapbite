const puppeteer = require('puppeteer')
const ProxyChain = require('proxy-chain');
const Proxy = require('../models/Proxy.model');
const sequelize = require('../configs/db.config');
const ms = require('ms')

function getRandomIndex(index) {
    if (index.length === 0) {
        console.log('All indices used.');
        return null;
    }

    const randomIndex = index.splice(
        Math.floor(Math.random() * index.length), // Generate random index within index array
        1 // Remove 1 element at the generated index
    )[0];

    return randomIndex;
}

const getScrapData = async (req, res) => {

    const url = req.body.url;
    if (!url) return res.status(400).json({ error: 'Missing URL parameter.' })

    try {
        const fetchProxy = await Proxy.findAll({
            attributes: ['ip_address', 'port', 'last_checked'],
            order: [['last_checked', 'DESC']],
        });

        const proxyList = fetchProxy.map(
            (proxy) => `http://${proxy.ip_address}:${proxy.port}`
        );

        const proxyIndex = Array.from({ length: proxyList.length }, (_, i) => i)

        let success = false;
        for (let i = 0; i < proxyList.length; i++) {
            let index = getRandomIndex(proxyIndex)

            var proxyUrl = proxyList[index];

            try {
                const proxyServer = new ProxyChain.Server({
                    port: 0,
                    prepareRequestFunction: ({ request }) => ({
                        requestAuthentication: false,
                        upstreamProxyUrl: proxyUrl,
                    }),
                });

                await proxyServer.listen();

                const proxyServerPort = proxyServer.port;

                const browser = await puppeteer.launch({
                    headless: "new",
                    ignoreHTTPSErrors: true,
                    args: [`--proxy-server=http=127.0.0.1:${proxyServerPort}`],
                });

                const page = await browser.newPage();
                await page.goto(url);

                var title = await page.title();

                const maxScrapingTime = 20000; // Specify the maximum scraping time in milliseconds (e.g., 60 seconds)
                const startTime = Date.now();

                let previousHeight = await page.evaluate('document.body.scrollHeight')
                while (Date.now() - startTime < maxScrapingTime) {
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                    await new Promise(resolve => setTimeout(resolve, 200)) // Adjust the waiting time as needed

                    // const newHeight = await page.evaluate('document.body.scrollHeight');
                    // if (newHeight === previousHeight) {
                    //     break; // No more content is being loaded, exit the loop
                    // }
                    // previousHeight = newHeight;
                }

                var results = await page.evaluate(() => {
                    const products = [];

                    const imgElements = document.querySelectorAll('.css-1q90pod');
                    const productNameElements = document.querySelectorAll('.prd_link-product-name');
                    const priceElements = document.querySelectorAll('.prd_link-product-price');
                    const locationElements = document.querySelectorAll('.prd_link-shop-loc')
                    const shopNameElements = document.querySelectorAll('.prd_link-shop-name')

                    productNameElements.forEach((item, index) => {
                        id = index + 1
                        const name = productNameElements[index].textContent.trim();
                        const price = priceElements[index]?.textContent.trim() || 'Price not available';
                        const image = imgElements[index]?.getAttribute('src') || 'Image not available';
                        const location = locationElements[index]?.textContent.trim() || 'Location not available';
                        const shop = shopNameElements[index]?.textContent.trim() || 'Shop not available';

                        products.push({ id, name, price, image, location, shop });
                    });

                    return products;
                })

                if (results.length === 0) continue;

                await browser.close();
                await proxyServer.close();

                // Exit the loop if scraping is successful
                success = true;
                break;
            } catch (error) {
                console.error('Error:', error);
            }
        }

        if (success) {
            res.json({
                proxyUrl,
                url,
                title,
                results
            });
        } else {
            res.status(500).json({ error: 'No proxy servers available or an error occurred' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
}

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
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        await browser.close()
    }
}

module.exports = { getProxies, getScrapData }