"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipCaptainCrewProvider = void 0;
const BaseGameProvider_1 = require("./BaseGameProvider");
class ShipCaptainCrewProvider extends BaseGameProvider_1.BaseGameProvider {
    constructor() {
        super(...arguments);
        this.gameType = "shipcaptaincrew";
        this.config = {
            minBet: 1,
            maxBet: 100,
            baseMultiplier: 1,
            houseEdge: 0.05,
        };
    }
    rollDice(serverSeed, clientSeed, nonce, count = 5) {
        const randoms = this.generateSecureRandoms(serverSeed, clientSeed, nonce, count);
        return randoms.map((random) => Math.floor(random * 6) + 1);
    }
    calculateMultiplier(cargoSum, hasShip, hasCaptain, hasCrew) {
        if (!hasShip || !hasCaptain || !hasCrew) {
            return 0;
        }
        if (cargoSum === 12) {
            return 8;
        }
        else if (cargoSum >= 10) {
            return 4;
        }
        else if (cargoSum >= 7) {
            return 2;
        }
        else {
            return 1;
        }
    }
    processRoll(dice, gameData) {
        const availableDice = [...dice];
        let cargoIndices = [];
        if (!gameData.hasShip && availableDice.includes(6)) {
            gameData.hasShip = true;
            const index = availableDice.indexOf(6);
            availableDice.splice(index, 1);
        }
        if (gameData.hasShip && !gameData.hasCaptain && availableDice.includes(5)) {
            gameData.hasCaptain = true;
            const index = availableDice.indexOf(5);
            availableDice.splice(index, 1);
        }
        if (gameData.hasCaptain && !gameData.hasCrew && availableDice.includes(4)) {
            gameData.hasCrew = true;
            const index = availableDice.indexOf(4);
            availableDice.splice(index, 1);
        }
        if (gameData.hasShip && gameData.hasCaptain && gameData.hasCrew) {
            gameData.cargoSum = Math.max(gameData.cargoSum, availableDice.reduce((sum, die) => sum + die, 0));
        }
    }
    initializeGame(betAmount, serverSeed, clientSeed = "", nonce = 0) {
        const gameData = {
            betAmount,
            serverSeed,
            clientSeed,
            nonce,
            rolls: [],
            rollNumber: 0,
            hasShip: false,
            hasCaptain: false,
            hasCrew: false,
            cargoSum: 0,
            gamePhase: "rolling",
            maxRolls: 3,
        };
        return {
            gameType: this.gameType,
            status: "in_progress",
            currentData: gameData,
            history: [],
        };
    }
    async playGame(state, move) {
        const gameData = state.currentData;
        if (gameData.gamePhase === "finished") {
            throw new Error("Game already finished");
        }
        if (!move || !move.action) {
            return this.autoPlay(gameData, state);
        }
        switch (move.action) {
            case "roll":
                return this.handleRoll(gameData, state);
            case "stop":
                return this.handleStop(gameData, state);
            default:
                return this.autoPlay(gameData, state);
        }
    }
    async autoPlay(gameData, state) {
        while (gameData.rollNumber < gameData.maxRolls &&
            gameData.gamePhase === "rolling") {
            const dice = this.rollDice(gameData.serverSeed, gameData.clientSeed, gameData.nonce + gameData.rollNumber, 5);
            gameData.rolls.push(...dice);
            gameData.rollNumber++;
            this.processRoll(dice, gameData);
            if (gameData.hasShip &&
                gameData.hasCaptain &&
                gameData.hasCrew &&
                gameData.cargoSum === 12) {
                break;
            }
        }
        return this.finishGame(gameData, state);
    }
    async handleRoll(gameData, state) {
        if (gameData.rollNumber >= gameData.maxRolls) {
            return this.finishGame(gameData, state);
        }
        const dice = this.rollDice(gameData.serverSeed, gameData.clientSeed, gameData.nonce + gameData.rollNumber, 5);
        gameData.rolls.push(...dice);
        gameData.rollNumber++;
        this.processRoll(dice, gameData);
        if (gameData.rollNumber >= gameData.maxRolls ||
            (gameData.hasShip &&
                gameData.hasCaptain &&
                gameData.hasCrew &&
                gameData.cargoSum === 12)) {
            return this.finishGame(gameData, state);
        }
        state.currentData = gameData;
        return {
            isWin: false,
            multiplier: 0,
            winAmount: 0,
            gameData: {
                rolls: gameData.rolls.slice(-5),
                rollNumber: gameData.rollNumber,
                hasShip: gameData.hasShip,
                hasCaptain: gameData.hasCaptain,
                hasCrew: gameData.hasCrew,
                cargoSum: gameData.cargoSum,
                gamePhase: gameData.gamePhase,
            },
            outcome: {
                action: "roll",
                rollNumber: gameData.rollNumber,
                status: "continue",
            },
        };
    }
    async handleStop(gameData, state) {
        return this.finishGame(gameData, state);
    }
    finishGame(gameData, state) {
        gameData.gamePhase = "finished";
        state.status = "completed";
        const multiplier = this.calculateMultiplier(gameData.cargoSum, gameData.hasShip, gameData.hasCaptain, gameData.hasCrew);
        const isWin = multiplier > 0;
        const winAmount = this.calculateWinnings(gameData.betAmount, multiplier);
        const result = {
            rolls: gameData.rolls,
            hasShip: gameData.hasShip,
            hasCaptain: gameData.hasCaptain,
            hasCrew: gameData.hasCrew,
            cargoSum: gameData.cargoSum,
            outcome: isWin ? "win" : "lose",
            isWin,
            multiplier,
        };
        state.history.push(result);
        return {
            isWin,
            multiplier,
            winAmount,
            gameData: result,
            outcome: {
                hasShip: gameData.hasShip,
                hasCaptain: gameData.hasCaptain,
                hasCrew: gameData.hasCrew,
                cargoSum: gameData.cargoSum,
                multiplier,
                totalRolls: gameData.rollNumber,
            },
        };
    }
}
exports.ShipCaptainCrewProvider = ShipCaptainCrewProvider;
