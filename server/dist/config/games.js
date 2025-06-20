"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_SETTINGS = exports.GAME_CONFIGS = void 0;
exports.getGameConfig = getGameConfig;
exports.validateGameConfig = validateGameConfig;
exports.GAME_CONFIGS = {
    blackjack: {
        minBet: 0.01,
        maxBet: 100,
        baseMultiplier: 2,
        houseEdge: 0.005
    },
    dice: {
        minBet: 0.001,
        maxBet: 100,
        baseMultiplier: 1,
        houseEdge: 0.01
    },
    slots: {
        minBet: 0.01,
        maxBet: 50,
        baseMultiplier: 1,
        houseEdge: 0.04
    },
    shipcaptaincrew: {
        minBet: 0.01,
        maxBet: 50,
        baseMultiplier: 2,
        houseEdge: 0.02
    }
};
exports.GAME_SETTINGS = {
    maxActiveSessions: 10,
    sessionTimeoutMinutes: 30,
    maxBetHistory: 1000,
    suspiciousActivityThreshold: 5
};
function getGameConfig(gameType) {
    return exports.GAME_CONFIGS[gameType];
}
function validateGameConfig(gameType, betAmount) {
    const config = getGameConfig(gameType);
    return betAmount >= config.minBet && betAmount <= config.maxBet;
}
