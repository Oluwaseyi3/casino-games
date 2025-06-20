"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payOutWorker = exports.payoutQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const cron_1 = require("cron");
const constants_1 = require("../config/constants");
const SolanaService_1 = require("../services/SolanaService");
const GameSession_1 = __importDefault(require("../services/GameSession"));
const User_1 = __importDefault(require("../services/User"));
// queue that fetches transaction of an entity
exports.payoutQueue = new bull_1.default("payout", constants_1.REDIS_URL || "redis://127.0.0.1:6379");
exports.payoutQueue.process(async function (job, done) {
    try {
        const payout = await new SolanaService_1.SolanaService(constants_1.SOLANA_RPC_URL).initiateTokenPayout(job.data.amount, job.data.recipientAddress, job.data.tokenMintAddress, constants_1.MANAGER_KEYPAIR);
        done();
    }
    catch (error) {
        console.error("Error at queue ", error);
        done(error);
    }
});
exports.payOutWorker = new cron_1.CronJob("*/1 * * * *", async function () {
    try {
        const pendingPayouts = await GameSession_1.default.getPendingPayouts();
        for (const session of pendingPayouts) {
            if (!session.result?.winAmount || session.result.winAmount <= 0) {
                return;
            }
            const user = await User_1.default.get(session.userId.toString());
            if (!user) {
                return;
            }
            exports.payoutQueue.add({
                amount: session.result.winAmount,
                recipientAddress: user?.walletAddress,
                tokenMintAddress: constants_1.PAYOUT_TOKEN.mint,
            });
        }
    }
    catch (error) {
        console.error(error);
    }
});
