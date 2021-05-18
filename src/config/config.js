require("dotenv").config();

const CONFIG = {};

// MySQL configurations
CONFIG.mysql_db_host = process.env.MYSQL_DB_HOST || '127.0.0.1'
CONFIG.mysql_db_user = process.env.MYSQL_DB_USER || 'root'
CONFIG.mysql_db_pass = process.env.MYSQL_DB_PASS || 'root'
CONFIG.mysql_db_name = process.env.MYSQL_DB_NAME || 'locations'

CONFIG.mysql_db_table_name = process.env.MYSQL_DB_TABLE_NAME || 'locations'

CONFIG.log_path = process.env.LOG_PATH || 'logs';
CONFIG.log_file_name = process.env.LOG_FILE_NAME || 'website-crawler.log';
CONFIG.log_level = process.env.LOG_LEVEL || 'info';
CONFIG.log_driver = process.env.LOG_DRIVER || 'local';

CONFIG.keywords_file_path = process.env.KEYWORDS_FILE_PATH || './sample_data/keywords.txt';

module.exports = CONFIG;
