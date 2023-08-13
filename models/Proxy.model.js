const { Sequelize } = require('sequelize')
const db = require('../configs/db.config')

const { DataTypes } = Sequelize

const Proxy = db.define('proxies',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        port: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        anonymity: {
            type: DataTypes.STRING,
            allowNull: true
        },
        google: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        https: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        last_checked: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        timestamps: false,
        freezeTableName: true
    }
);

(async () => {
    try {
        await Proxy.sync()
        console.log('Proxy table has been synced');
    } catch (error) {
        console.error('Error syncing Proxy table:', error);
    }
})();

module.exports = Proxy