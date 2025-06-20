"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const secureRandomness_1 = require("../utils/secureRandomness");
const GameSessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    gameType: {
        type: String,
        required: true,
        enum: ["slots", "dice", "blackjack", "shipcaptaincrew"],
        index: true,
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        default: () => (0, secureRandomness_1.secureRandomString)(24),
        index: true,
    },
    betAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    initialState: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    currentState: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 60 * 1000),
        index: true,
    },
    completed: {
        type: Boolean,
        default: false,
        index: true,
    },
    serverSeed: {
        type: String,
        required: true,
        default: () => (0, secureRandomness_1.generateSecureSeed)(32),
    },
    clientSeed: {
        type: String,
    },
    serverSeedHash: {
        type: String,
        required: true,
    },
    result: {
        winAmount: {
            type: Number,
            min: 0,
        },
        multiplier: {
            type: Number,
            min: 0,
        },
        gameData: mongoose_1.Schema.Types.Mixed,
    },
    bet: {
        type: Number,
        required: true,
        min: 0,
    },
    winAmount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        required: true,
        enum: ["created", "in_progress", "completed", "cancelled", "error"],
        default: "created",
        index: true,
    },
    outcome: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    nonce: {
        type: Number,
        default: () => Math.floor(Math.random() * 1000000),
    },
    completedAt: {
        type: Date,
    },
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    actionSequence: {
        type: [String],
        default: [],
    },
    operationIds: {
        type: [String],
        default: [],
    },
    payoutProcessed: {
        type: Boolean,
        default: false,
        index: true,
    },
    payoutTransactionId: String,
    validationChecks: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    depositTxHash: {
        type: String,
        required: false,
    },
    payoutTxHash: {
        type: String,
        required: false,
    },
    suspiciousActivity: [
        {
            reason: String,
            timestamp: {
                type: Date,
                default: Date.now,
            },
            details: mongoose_1.Schema.Types.Mixed,
        },
    ],
}, {
    timestamps: true,
    collection: "game_sessions",
});
GameSessionSchema.index({ userId: 1, completed: 1, expiresAt: 1 });
GameSessionSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    if (!this.serverSeedHash && this.serverSeed) {
        this.serverSeedHash = (0, secureRandomness_1.createServerSeedHash)(this.serverSeed);
    }
    next();
});
GameSessionSchema.index({ userId: 1, gameType: 1, createdAt: -1 });
GameSessionSchema.index({ status: 1, createdAt: -1 });
GameSessionSchema.index({ payoutProcessed: 1, status: 1 });
GameSessionSchema.index({ "suspiciousActivity.timestamp": 1 });
GameSessionSchema.methods.recordAction = function (action, operationId) {
    if (this.operationIds.includes(operationId)) {
        return false;
    }
    this.actionSequence.push(action);
    this.operationIds.push(operationId);
    return true;
};
GameSessionSchema.methods.flagAsSuspicious = function (reason, details = {}) {
    if (!this.suspiciousActivity) {
        this.suspiciousActivity = [];
    }
    this.suspiciousActivity.push({
        reason,
        timestamp: new Date(),
        details,
    });
};
exports.GameSession = mongoose_1.default.model("GameSession", GameSessionSchema);
exports.default = exports.GameSession;
