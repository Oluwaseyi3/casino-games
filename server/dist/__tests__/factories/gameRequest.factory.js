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
exports.playGameRequestFactory = exports.gameMoveFactory = exports.createGameRequestFactory = void 0;
const Factory = __importStar(require("factory.ts"));
const secureRandomness_1 = require("../../utils/secureRandomness");
exports.createGameRequestFactory = Factory.Sync.makeFactory({
    gameType: Factory.each((i) => ["blackjack", "dice", "slots"][i % 3]),
    betAmount: Factory.each((i) => 0.1 + i * 0.05),
    clientSeed: Factory.each((i) => `client_seed_${i}`),
    deviceFingerprint: Factory.each((i) => `device_${i}`),
});
exports.gameMoveFactory = Factory.Sync.makeFactory({
    action: Factory.each((i) => ["hit", "stand", "double"][i % 3]),
    data: {},
    operationId: Factory.each((i) => (0, secureRandomness_1.secureRandomString)(16)),
});
exports.playGameRequestFactory = Factory.Sync.makeFactory({
    sessionId: Factory.each((i) => (0, secureRandomness_1.secureRandomString)(24)),
    move: Factory.each((i) => exports.gameMoveFactory.build()),
});
