const mysql = require('mysql');
const {
    mysql_db_host,
    mysql_db_user,
    mysql_db_pass,
    mysql_db_name
} = require('../config/config');
const { log } = require('../services/log.service');

const connectionPool = mysql.createPool({
    connectionLimit: 10,
    host: mysql_db_host,
    user: mysql_db_user,
    password: mysql_db_pass,
    database: mysql_db_name,
    dateStrings: true
});

connectionPool.on('acquire', function (connection) {
    log.debug(`Connection ${connection.threadId} acquired`);
});

connectionPool.on('release', function (connection) {
    log.debug(`Connection ${connection.threadId} released`);
});

module.exports = connectionPool;
