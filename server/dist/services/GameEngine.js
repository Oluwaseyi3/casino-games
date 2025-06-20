"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const mongoose_1 = require("mongoose");
const GameSession_1 = __importDefault(require("./GameSession"));
const GameFactory_1 = __importDefault(require("../factories/GameFactory"));
const secureRandomness_1 = require("../utils/secureRandomness");
const SolanaService_1 = require("./SolanaService");
const constants_1 = require("../config/constants");
class GameEngine {
    constructor() {
        this.sessionService = GameSession_1.default;
    }
    async createGame(userId, request, depositTxHash, clientInfo) {
        try {
            if (!GameFactory_1.default.validateGameType(request.gameType)) {
                throw new Error(`Invalid game type: ${request.gameType}`);
            }
            if (!depositTxHash) {
                throw new Error("Deposit transaction hash is required");
            }
            const solanaService = new SolanaService_1.SolanaService(constants_1.SOLANA_RPC_URL);
            const existingSession = await this.sessionService.getGameSessionByDepositTxHash(depositTxHash);
            if (existingSession) {
                throw new Error("Deposit transaction already used");
            }
            const depositVerified = await solanaService.verifyTokenTransfer(depositTxHash, constants_1.STAKING_TOKEN.mint, constants_1.MANAGER_WALLET_ADDRESS, request.betAmount);
            if (!depositVerified) {
                throw new Error("Deposit transaction not verified");
            }
            const provider = GameFactory_1.default.getProvider(request.gameType);
            if (!provider.validateBet(request.betAmount)) {
                const config = provider.config;
                throw new Error(`Invalid bet amount. Min: ${config.minBet}, Max: ${config.maxBet}`);
            }
            const serverSeed = require("crypto").randomBytes(32).toString("hex");
            const clientSeed = request.clientSeed || (0, secureRandomness_1.secureRandomString)(16);
            const nonce = Math.floor(Math.random() * 1000000);
            const gameState = provider.initializeGame(request.betAmount, serverSeed, clientSeed, nonce);
            const sessionData = {
                userId: new mongoose_1.Types.ObjectId(userId),
                gameType: request.gameType,
                betAmount: request.betAmount,
                bet: request.betAmount,
                initialState: gameState,
                currentState: gameState,
                serverSeed,
                clientSeed,
                nonce,
                status: "created",
                ipAddress: clientInfo?.ipAddress,
                userAgent: clientInfo?.userAgent,
                serverSeedHash: new TextEncoder().encode(serverSeed).toString(),
                deviceFingerprint: request.deviceFingerprint,
            };
            const session = await this.sessionService.create(sessionData);
            return {
                sessionId: session.sessionId,
                gameType: request.gameType,
                betAmount: request.betAmount,
                status: session.status,
                gameState: this.sanitizeGameState(gameState),
                serverSeedHash: session.serverSeedHash,
            };
        }
        catch (error) {
            throw new Error(`Failed to create game: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async playGame(userId, request) {
        try {
            const session = await this.sessionService.getBySessionId(request.sessionId, false);
            if (!session) {
                throw new Error("Game session not found");
            }
            if (session.userId.toString() !== userId) {
                throw new Error("Unauthorized access to game session");
            }
            if (session.completed || session.status === "completed") {
                throw new Error("Game session already completed");
            }
            if (new Date() > session.expiresAt) {
                await this.sessionService.cancelSession(session.id, "Session expired");
                throw new Error("Game session expired");
            }
            const provider = GameFactory_1.default.getProvider(session.gameType);
            const currentState = session.currentState;
            if (request.move) {
                const operationId = request.move.operationId || (0, secureRandomness_1.secureRandomString)(16);
                const actionRecorded = await this.sessionService.recordAction(session.id, request.move.action, operationId);
                if (!actionRecorded) {
                    throw new Error("Duplicate operation detected");
                }
            }
            const result = await provider.playGame(currentState, request.move);
            await this.sessionService.update(session.id, {
                currentState,
                status: currentState.status === "completed" ? "completed" : "in_progress",
            });
            if (currentState.status === "completed") {
                await this.sessionService.completeSession(session.id, {
                    winAmount: result.winAmount,
                    multiplier: result.multiplier,
                    gameData: result.gameData,
                });
                await this.sessionService.update(session.id, {
                    winAmount: result.winAmount,
                    outcome: result.outcome,
                    completedAt: new Date(),
                });
            }
            return {
                sessionId: session.sessionId,
                gameType: session.gameType,
                betAmount: session.betAmount,
                status: currentState.status === "completed" ? "completed" : "in_progress",
                result: currentState.status === "completed" ? result : undefined,
                gameState: this.sanitizeGameState(currentState),
                serverSeedHash: session.serverSeedHash,
            };
        }
        catch (error) {
            throw new Error(`Failed to play game: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async getGameSession(userId, sessionId) {
        try {
            const session = await this.sessionService.getBySessionId(sessionId, false);
            if (!session) {
                return null;
            }
            if (session.userId.toString() !== userId) {
                throw new Error("Unauthorized access to game session");
            }
            return {
                sessionId: session.sessionId,
                gameType: session.gameType,
                betAmount: session.betAmount,
                status: session.status,
                result: session.result,
                gameState: this.sanitizeGameState(session.currentState),
                serverSeedHash: session.serverSeedHash,
            };
        }
        catch (error) {
            throw new Error(`Failed to get game session: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async getUserGameHistory(userId, gameType, limit = 50) {
        try {
            let sessions;
            if (gameType) {
                sessions = await this.sessionService.getByUserIdAndGameType(userId, gameType);
            }
            else {
                sessions = await this.sessionService.model
                    .find({
                    userId: new mongoose_1.Types.ObjectId(userId),
                })
                    .sort({ createdAt: -1 })
                    .limit(limit);
            }
            return sessions.map((session) => ({
                sessionId: session.sessionId,
                gameType: session.gameType,
                betAmount: session.betAmount,
                status: session.status,
                result: session.result
                    ? {
                        isWin: session.outcome === "win",
                        multiplier: session.result.multiplier,
                        winAmount: session.result.winAmount,
                        gameData: session.result.gameData,
                        outcome: session.outcome,
                    }
                    : undefined,
                gameState: session.completed
                    ? this.sanitizeGameState(session.currentState)
                    : undefined,
                serverSeedHash: session.serverSeedHash,
            }));
        }
        catch (error) {
            throw new Error(`Failed to get user game history: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async getSupportedGames() {
        const supportedGames = GameFactory_1.default.getSupportedGames();
        return supportedGames.map((gameType) => ({
            gameType,
            config: GameFactory_1.default.getGameConfig(gameType),
        }));
    }
    sanitizeGameState(gameState) {
        if (!gameState)
            return null;
        const sanitized = { ...gameState };
        if (sanitized.currentData) {
            const currentData = { ...sanitized.currentData };
            delete currentData.serverSeed;
            sanitized.currentData = currentData;
        }
        return sanitized;
    }
    async cancelGame(userId, sessionId, reason) {
        try {
            const session = await this.sessionService.getBySessionId(sessionId, false);
            if (!session) {
                throw new Error("Game session not found");
            }
            if (session.userId.toString() !== userId) {
                throw new Error("Unauthorized access to game session");
            }
            if (session.completed) {
                throw new Error("Cannot cancel completed game");
            }
            await this.sessionService.cancelSession(session.id, reason);
            return true;
        }
        catch (error) {
            throw new Error(`Failed to cancel game: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.GameEngine = GameEngine;
exports.default = new GameEngine();
