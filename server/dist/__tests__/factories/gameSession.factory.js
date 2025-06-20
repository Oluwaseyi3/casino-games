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
exports.gameSessionFactory = void 0;
const Factory = __importStar(require("factory.ts"));
const mongoose_1 = require("mongoose");
const secureRandomness_1 = require("../../utils/secureRandomness");
exports.gameSessionFactory = Factory.Sync.makeFactory({
    _id: Factory.each((i) => new mongoose_1.Types.ObjectId()),
    userId: Factory.each((i) => new mongoose_1.Types.ObjectId()),
    gameType: Factory.each((i) => ["blackjack", "dice", "slots"][i % 3]),
    sessionId: Factory.each((i) => (0, secureRandomness_1.secureRandomString)(24)),
    betAmount: Factory.each((i) => 0.1 + i * 0.05),
    bet: Factory.each((i) => 0.1 + i * 0.05),
    initialState: {
        gameType: "dice",
        status: "created",
        currentData: { target: 50, isOver: true },
        history: [],
    },
    currentState: {
        gameType: "dice",
        status: "created",
        currentData: { target: 50, isOver: true },
        history: [],
    },
    createdAt: Factory.each(() => new Date()),
    updatedAt: Factory.each(() => new Date()),
    expiresAt: Factory.each(() => new Date(Date.now() + 30 * 60 * 1000)),
    completed: false,
    serverSeed: (0, secureRandomness_1.generateSecureSeed)(32),
    clientSeed: Factory.each((i) => `client_seed_${i}`),
    serverSeedHash: Factory.each((i) => (0, secureRandomness_1.createServerSeedHash)((0, secureRandomness_1.generateSecureSeed)(32))),
    winAmount: 0,
    status: "created",
    nonce: Factory.each((i) => Math.floor(Math.random() * 1000000)),
    ipAddress: Factory.each((i) => `192.168.1.${(i % 255) + 1}`),
    userAgent: "Mozilla/5.0 (Test Browser)",
    deviceFingerprint: Factory.each((i) => `device_${i}`),
    actionSequence: [],
    operationIds: [],
    payoutProcessed: false,
    validationChecks: {},
    suspiciousActivity: [],
});
