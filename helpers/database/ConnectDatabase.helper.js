const db = require('../../configs/db.config')

const connectDatabase = async () => {
    try {
        await db.authenticate()
        console.log('Connection has been established successfully.')
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = connectDatabase