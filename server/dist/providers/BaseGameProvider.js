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
exports.BaseGameProvider = void 0;
const crypto = __importStar(require("crypto"));
class BaseGameProvider {
    validateBet(betAmount) {
        return betAmount >= this.config.minBet && betAmount <= this.config.maxBet;
    }
    calculateWinnings(betAmount, multiplier) {
        return Math.floor(betAmount * multiplier);
    }
    generateRandomNumber(serverSeed, clientSeed = '', nonce = 0) {
        const combined = `${serverSeed}:${clientSeed}:${nonce}`;
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        const randomValue = parseInt(hash.substring(0, 8), 16);
        return randomValue / 0xffffffff;
    }
    generateSecureRandoms(serverSeed, clientSeed = '', nonce = 0, count = 1) {
        const randoms = [];
        for (let i = 0; i < count; i++) {
            randoms.push(this.generateRandomNumber(serverSeed, clientSeed, nonce + i));
        }
        return randoms;
    }
}
exports.BaseGameProvider = BaseGameProvider;
