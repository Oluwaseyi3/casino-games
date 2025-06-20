"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLogger = void 0;
const pino_1 = __importDefault(require("pino"));
class Logger {
    constructor(options) {
        this.loggerType = options.loggerType || "console";
        switch (this.loggerType) {
            case "pino":
                this.logger = (0, pino_1.default)(options.pinoOptions || {});
                break;
            default:
                this.logger = console;
                break;
        }
    }
    log(level, ...args) {
        switch (this.loggerType) {
            case "pino":
                this.logger[level](args);
                break;
            default:
                this.logger.log(`${level.toUpperCase()}: ${args.join(" ")}`);
                break;
        }
    }
    info(...args) {
        this.log("info", ...args);
    }
    warn(...args) {
        this.log("warn", ...args);
    }
    error(...args) {
        this.log("error", ...args);
    }
    debug(...args) {
        this.log("debug", ...args);
    }
}
exports.consoleLogger = new Logger({ loggerType: "pino" });
