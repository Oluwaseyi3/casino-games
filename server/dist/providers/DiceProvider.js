"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiceProvider = void 0;
const BaseGameProvider_1 = require("./BaseGameProvider");
class DiceProvider extends BaseGameProvider_1.BaseGameProvider {
    constructor() {
        super(...arguments);
        this.gameType = "dice";
        this.config = {
            minBet: 1,
            maxBet: 100,
            baseMultiplier: 1,
            houseEdge: 0.01,
        };
    }
    initializeGame(betAmount, serverSeed, clientSeed = "", nonce = 0) {
        const gameData = {
            betAmount,
            serverSeed,
            clientSeed,
            nonce,
            target: 50,
            isOver: true,
        };
        return {
            gameType: this.gameType,
            status: "created",
            currentData: gameData,
            history: [],
        };
    }
    async playGame(state, move) {
        const gameData = state.currentData;
        if (move) {
            if (move.data?.target !== undefined) {
                gameData.target = Math.max(0.01, Math.min(99.99, move.data.target));
            }
            if (move.data?.isOver !== undefined) {
                gameData.isOver = move.data.isOver;
            }
        }
        const random = this.generateRandomNumber(gameData.serverSeed, gameData.clientSeed, gameData.nonce);
        const roll = Math.floor(random * 10000) / 100;
        const isWin = gameData.isOver
            ? roll > gameData.target
            : roll < gameData.target;
        const winChance = gameData.isOver
            ? (100 - gameData.target) / 100
            : gameData.target / 100;
        const payout = (1 - this.config.houseEdge) / winChance;
        const multiplier = isWin ? payout : 0;
        const winAmount = this.calculateWinnings(gameData.betAmount, multiplier);
        const result = {
            roll,
            target: gameData.target,
            isOver: gameData.isOver,
            isWin,
        };
        state.status = "completed";
        state.history.push(result);
        return {
            isWin,
            multiplier,
            winAmount,
            gameData: result,
            outcome: { roll, isWin, multiplier },
        };
    }
}
exports.DiceProvider = DiceProvider;
