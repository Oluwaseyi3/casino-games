"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../services/api/auth/auth");
const GameEngine_1 = __importDefault(require("../services/GameEngine"));
const gameRouter = express_1.default.Router();
/**
 * @openapi
 * /games/supported:
 *   get:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     description: Get list of supported games and their configurations
 *     responses:
 *       200:
 *         description: List of supported games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gameType:
 *                         type: string
 *                         enum: [blackjack, dice, slots]
 *                       config:
 *                         type: object
 */
gameRouter.get("/supported", async (req, res) => {
    try {
        const supportedGames = await GameEngine_1.default.getSupportedGames();
        res.status(200).json({
            success: true,
            data: supportedGames,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
/**
 * @openapi
 * /games/create:
 *   post:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameType
 *               - betAmount
 *             properties:
 *               gameType:
 *                 type: string
 *                 enum: [blackjack, dice, slots]
 *               betAmount:
 *                 type: number
 *                 minimum: 0.001
 *               clientSeed:
 *                 type: string
 *               deviceFingerprint:
 *                 type: string
 *     description: Create a new game session
 *     responses:
 *       201:
 *         description: Game session created successfully
 *       400:
 *         description: Invalid request or bet amount
 *       422:
 *         description: Validation error
 */
gameRouter.post("/create", auth_1.authenticatetoken, async (req, res) => {
    try {
        const { gameType, betAmount, clientSeed, deviceFingerprint, depositTxHash, } = req.body;
        const schema = joi_1.default.object({
            gameType: joi_1.default.string()
                .valid("blackjack", "dice", "slots", "shipcaptaincrew")
                .required(),
            betAmount: joi_1.default.number().positive().required(),
            clientSeed: joi_1.default.string().optional(),
            deviceFingerprint: joi_1.default.string().optional(),
            depositTxHash: joi_1.default.string().required(),
        });
        const { error } = schema.validate({
            gameType,
            betAmount,
            clientSeed,
            deviceFingerprint,
            depositTxHash,
        });
        if (error) {
            res.status(422).json({
                success: false,
                message: "Invalid request",
                error: error.details[0].message,
            });
            return;
        }
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const createGameRequest = {
            gameType: gameType,
            betAmount,
            clientSeed,
            deviceFingerprint,
        };
        const clientInfo = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
        };
        const gameResponse = await GameEngine_1.default.createGame(userId, createGameRequest, depositTxHash, clientInfo);
        res.status(201).json({
            success: true,
            data: gameResponse,
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
/**
 * @openapi
 * /games/play:
 *   post:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               move:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                   data:
 *                     type: object
 *                   operationId:
 *                     type: string
 *     description: Make a move in an existing game session
 *     responses:
 *       200:
 *         description: Move processed successfully
 *       400:
 *         description: Invalid move or session
 *       404:
 *         description: Session not found
 */
gameRouter.post("/play", auth_1.authenticatetoken, async (req, res) => {
    try {
        const { sessionId, move } = req.body;
        const schema = joi_1.default.object({
            sessionId: joi_1.default.string().required(),
            move: joi_1.default.object({
                action: joi_1.default.string().required(),
                data: joi_1.default.object().optional(),
                operationId: joi_1.default.string().optional(),
            }).optional(),
        });
        const { error } = schema.validate({ sessionId, move });
        if (error) {
            res.status(422).json({
                success: false,
                message: "Invalid request",
                error: error.details[0].message,
            });
            return;
        }
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const playGameRequest = {
            sessionId,
            move,
        };
        const gameResponse = await GameEngine_1.default.playGame(userId, playGameRequest);
        res.status(200).json({
            success: true,
            data: gameResponse,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
/**
 * @openapi
 * /games/session/{sessionId}:
 *   get:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     description: Get game session details
 *     responses:
 *       200:
 *         description: Game session details
 *       404:
 *         description: Session not found
 */
gameRouter.get("/session/:sessionId", auth_1.authenticatetoken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            res.status(422).json({
                success: false,
                message: "Session ID is required",
            });
            return;
        }
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const gameSession = await GameEngine_1.default.getGameSession(userId, sessionId);
        if (!gameSession) {
            res.status(404).json({
                success: false,
                message: "Game session not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: gameSession,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
/**
 * @openapi
 * /games/history:
 *   get:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: gameType
 *         schema:
 *           type: string
 *           enum: [blackjack, dice, slots]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     description: Get user's game history
 *     responses:
 *       200:
 *         description: User's game history
 */
gameRouter.get("/history", auth_1.authenticatetoken, async (req, res) => {
    try {
        const { gameType, limit } = req.query;
        const schema = joi_1.default.object({
            gameType: joi_1.default.string()
                .valid("blackjack", "dice", "slots", "shipcaptaincrew")
                .optional(),
            limit: joi_1.default.number().integer().min(1).max(100).optional(),
        });
        const { error } = schema.validate({ gameType, limit });
        if (error) {
            res.status(422).json({
                success: false,
                message: "Invalid request",
                error: error.details[0].message,
            });
            return;
        }
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const gameHistory = await GameEngine_1.default.getUserGameHistory(userId, gameType, limit ? parseInt(limit) : 50);
        res.status(200).json({
            success: true,
            data: gameHistory,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
/**
 * @openapi
 * /games/cancel/{sessionId}:
 *   post:
 *     tags:
 *       - "Games"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     description: Cancel a game session
 *     responses:
 *       200:
 *         description: Game session cancelled successfully
 *       404:
 *         description: Session not found
 */
gameRouter.post("/cancel/:sessionId", auth_1.authenticatetoken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason } = req.body;
        if (!sessionId) {
            res.status(422).json({
                success: false,
                message: "Session ID is required",
            });
            return;
        }
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }
        const cancelled = await GameEngine_1.default.cancelGame(userId, sessionId, reason);
        res.status(200).json({
            success: true,
            data: { cancelled },
            message: "Game session cancelled successfully",
        });
        return;
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
        return;
    }
});
exports.default = gameRouter;
