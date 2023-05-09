import winston from 'winston';
import { Constants } from './Constants';



const logger = winston.createLogger({
	level: 'debug',
	transports: [
		new winston.transports.File({
			filename: 'logs/app.log',
		}),
	],
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'MMM-DD-YYYY HH:mm:ss',
		}),
		winston.format.printf(
			(info) => `${info.level}: ${[info.timestamp]}: ${info.message}`
		)
	),
});

export default logger;
// module.exports = { cache };