"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("./config/constants");
const http_1 = require("http");
const ioredis_1 = __importDefault(require("ioredis"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = require("body-parser");
const pinoLogger_1 = require("./services/logger/pinoLogger");
const auth_1 = __importDefault(require("./routes/auth"));
const games_1 = __importDefault(require("./routes/games"));
const payoutQueue_1 = require("./jobs/payoutQueue");
const PORT = process.env.PORT || 8000;
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.redisClient = new ioredis_1.default(constants_1.REDIS_URL);
mongoose_1.default
    .connect(constants_1.MONGO_URI, { maxPoolSize: 10000, serverSelectionTimeoutMS: 5000 })
    .then(() => {
    console.log("Connected to the database");
})
    .catch((err) => {
    console.log(err);
    console.error("Could not connect to database");
});
async function Mainrun() {
    try {
        app.use((0, morgan_1.default)("dev"));
        app.get("", async (req, res) => {
            res.status(200).send("Pinged Server");
        });
        app.use((0, cors_1.default)());
        app.use((0, body_parser_1.urlencoded)({ extended: true }));
        app.use((0, body_parser_1.json)({ limit: "50mb" }));
        app.use((0, cookie_parser_1.default)());
        app.use("/auth", auth_1.default);
        app.use("/games", games_1.default);
        payoutQueue_1.payOutWorker.start();
        //@ts-ignore
        httpServer.listen(PORT, "0.0.0.0", async (error) => {
            pinoLogger_1.consoleLogger.info("Started listening on port", PORT);
        });
    }
    catch (error) {
        pinoLogger_1.consoleLogger.info("Occured Mainrun", error);
    }
}
Mainrun();
