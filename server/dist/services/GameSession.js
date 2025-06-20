"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameSession_1 = require("../models/GameSession");
const mongoose_1 = require("mongoose");
class GameSessionService {
    constructor() {
        this.model = GameSession_1.GameSession;
    }
    async get(id, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model.findById(id).populate("userId");
            }
            return await this.model.findById(id);
        }
        catch (error) {
            throw new Error(`Failed to get game session: ${error}`);
        }
    }
    async getBySessionId(sessionId, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model.findOne({ sessionId }).populate("userId");
            }
            return await this.model.findOne({ sessionId });
        }
        catch (error) {
            throw new Error(`Failed to get game session by session ID: ${error}`);
        }
    }
    async getActiveSessionsByUserId(userId, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model
                    .find({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    completed: false,
                    expiresAt: { $gt: new Date() },
                })
                    .populate("userId");
            }
            return await this.model.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                completed: false,
                expiresAt: { $gt: new Date() },
            });
        }
        catch (error) {
            throw new Error(`Failed to get active sessions for user: ${error}`);
        }
    }
    async getByUserIdAndGameType(userId, gameType, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model
                    .find({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    gameType,
                })
                    .populate("userId")
                    .sort({ createdAt: -1 });
            }
            return await this.model
                .find({
                userId: new mongoose_1.Types.ObjectId(userId),
                gameType,
            })
                .sort({ createdAt: -1 });
        }
        catch (error) {
            throw new Error(`Failed to get sessions by user ID and game type: ${error}`);
        }
    }
    async create(sessionData) {
        try {
            const session = new this.model(sessionData);
            return await session.save();
        }
        catch (error) {
            throw new Error(`Failed to create game session: ${error}`);
        }
    }
    async update(id, updateData, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model
                    .findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true })
                    .populate("userId");
            }
            return await this.model.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
        }
        catch (error) {
            throw new Error(`Failed to update game session: ${error}`);
        }
    }
    async completeSession(id, result, shouldPopulateUserId = false) {
        try {
            if (shouldPopulateUserId) {
                return await this.model
                    .findByIdAndUpdate(id, {
                    completed: true,
                    status: "completed",
                    result,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                }, { new: true })
                    .populate("userId");
            }
            return await this.model.findByIdAndUpdate(id, {
                completed: true,
                status: "completed",
                result,
                completedAt: new Date(),
                updatedAt: new Date(),
            }, { new: true });
        }
        catch (error) {
            throw new Error(`Failed to complete game session: ${error}`);
        }
    }
    async getWinningGames() {
        try {
            const games = await GameSession_1.GameSession.find({
                status: "completed",
            });
            games.filter((game) => (game.result?.winAmount || 0) > 0);
            return games;
        }
        catch (error) {
            throw new Error(`Failed to get winning games: ${error}`);
        }
    }
    async cancelSession(id, reason, shouldPopulateUserId = false) {
        try {
            const updateData = {
                status: "cancelled",
                updatedAt: new Date(),
            };
            if (reason) {
                updateData.$push = {
                    suspiciousActivity: {
                        reason: `Session cancelled: ${reason}`,
                        timestamp: new Date(),
                        details: { cancellationReason: reason },
                    },
                };
            }
            if (shouldPopulateUserId) {
                return await this.model
                    .findByIdAndUpdate(id, updateData, { new: true })
                    .populate("userId");
            }
            return await this.model.findByIdAndUpdate(id, updateData, { new: true });
        }
        catch (error) {
            throw new Error(`Failed to cancel game session: ${error}`);
        }
    }
    async recordAction(id, action, operationId) {
        try {
            const session = await this.model.findById(id);
            if (!session) {
                throw new Error("Session not found");
            }
            const success = session.recordAction(action, operationId);
            if (success) {
                await session.save();
            }
            return success;
        }
        catch (error) {
            throw new Error(`Failed to record action: ${error}`);
        }
    }
    async flagAsSuspicious(id, reason, details) {
        try {
            const session = await this.model.findById(id);
            if (!session) {
                throw new Error("Session not found");
            }
            session.flagAsSuspicious(reason, details);
            return await session.save();
        }
        catch (error) {
            throw new Error(`Failed to flag session as suspicious: ${error}`);
        }
    }
    async getExpiredSessions() {
        try {
            return await this.model.find({
                completed: false,
                expiresAt: { $lt: new Date() },
            });
        }
        catch (error) {
            throw new Error(`Failed to get expired sessions: ${error}`);
        }
    }
    async getSuspiciousSessions(limit = 50) {
        try {
            return await this.model
                .find({
                "suspiciousActivity.0": { $exists: true },
            })
                .populate("userId")
                .sort({ "suspiciousActivity.timestamp": -1 })
                .limit(limit);
        }
        catch (error) {
            throw new Error(`Failed to get suspicious sessions: ${error}`);
        }
    }
    async getPendingPayouts() {
        try {
            return await this.model.find({
                status: "completed",
                payoutProcessed: false,
                "result.winAmount": { $gt: 0 },
            });
        }
        catch (error) {
            throw new Error(`Failed to get pending payouts: ${error}`);
        }
    }
    async markPayoutProcessed(id, transactionId) {
        try {
            return await this.model
                .findByIdAndUpdate(id, {
                payoutProcessed: true,
                payoutTransactionId: transactionId,
                updatedAt: new Date(),
            }, { new: true })
                .populate("userId");
        }
        catch (error) {
            throw new Error(`Failed to mark payout as processed: ${error}`);
        }
    }
    async getSessionStats(userId) {
        try {
            const matchStage = {};
            if (userId) {
                matchStage.userId = new mongoose_1.Types.ObjectId(userId);
            }
            const stats = await this.model.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalSessions: { $sum: 1 },
                        completedSessions: {
                            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
                        },
                        totalBetAmount: { $sum: "$betAmount" },
                        totalWinAmount: { $sum: "$winAmount" },
                        suspiciousCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $gt: [
                                            { $size: { $ifNull: ["$suspiciousActivity", []] } },
                                            0,
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);
            return (stats[0] || {
                totalSessions: 0,
                completedSessions: 0,
                totalBetAmount: 0,
                totalWinAmount: 0,
                suspiciousCount: 0,
            });
        }
        catch (error) {
            throw new Error(`Failed to get session stats: ${error}`);
        }
    }
    async getGameSessionByDepositTxHash(depositTxHash) {
        try {
            const session = await this.model.findOne({
                depositTxHash,
            });
            return session;
        }
        catch (error) {
            throw new Error(`Failed to get game session by deposit tx hash: ${error}`);
        }
    }
    async delete(id) {
        try {
            return await this.model.findByIdAndDelete(id);
        }
        catch (error) {
            throw new Error(`Failed to delete game session: ${error}`);
        }
    }
}
exports.default = new GameSessionService();
