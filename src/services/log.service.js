const { log_level, log_path, log_file_name } = require('../config/config');

const { createLogger, transports, format } = require('winston');
const { printf } = format;

// a custom format that outputs request id
const logFormat = printf(info => {
    return `${info.timestamp}: ${info.level}: ${info.message}`;
});

const logger = createLogger({
    level: log_level,
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        logFormat
    ),
    transports: [
        new transports.File({
            filename: `${log_path}/${log_file_name}`,
            json: false,
            maxsize: 5242880,
            maxFiles: 5
        }),
        new transports.Console()
    ]
});

module.exports.log = logger;
module.exports.logger = logger;
