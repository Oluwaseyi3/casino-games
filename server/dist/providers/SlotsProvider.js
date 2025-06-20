"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotsProvider = void 0;
const BaseGameProvider_1 = require("./BaseGameProvider");
class SlotsProvider extends BaseGameProvider_1.BaseGameProvider {
    constructor() {
        super(...arguments);
        this.gameType = "slots";
        this.config = {
            minBet: 1,
            maxBet: 50,
            baseMultiplier: 1,
            houseEdge: 0.03, // Updated for 97% RTP
        };
        this.REEL_SIZE = 3;
        this.NUM_REELS = 5;
        this.SYMBOLS = [
            // Fruit symbols (common) - any fruit combo gives 1.5x
            {
                id: "cherry",
                name: "Cherry",
                weight: 150,
                multipliers: { 3: 1.5, 4: 3, 5: 6 },
            },
            {
                id: "lemon",
                name: "Lemon",
                weight: 150,
                multipliers: { 3: 1.5, 4: 3, 5: 6 },
            },
            {
                id: "orange",
                name: "Orange",
                weight: 150,
                multipliers: { 3: 1.5, 4: 3, 5: 6 },
            },
            {
                id: "plum",
                name: "Plum",
                weight: 150,
                multipliers: { 3: 1.5, 4: 3, 5: 6 },
            },
            // Mid-tier symbols
            {
                id: "bell",
                name: "Bell",
                weight: 100,
                multipliers: { 3: 2, 4: 5, 5: 10 },
            },
            { id: "bar", name: "Bar", weight: 80, multipliers: { 3: 3, 4: 8, 5: 15 } },
            {
                id: "seven",
                name: "Seven",
                weight: 60,
                multipliers: { 3: 5, 4: 12, 5: 20 },
            },
            // Crypto symbols (rare)
            {
                id: "btc",
                name: "Bitcoin",
                weight: 10,
                multipliers: { 3: 25, 4: 50, 5: 100 },
                isCrypto: true,
                theme: "BTC",
            },
            {
                id: "eth",
                name: "Ethereum",
                weight: 15,
                multipliers: { 3: 20, 4: 40, 5: 80 },
                isCrypto: true,
                theme: "ETH",
            },
            {
                id: "sol",
                name: "Solana",
                weight: 20,
                multipliers: { 3: 15, 4: 30, 5: 60 },
                isCrypto: true,
                theme: "SOL",
            },
        ];
    }
    getSymbolsForTheme(theme) {
        if (!theme)
            return this.SYMBOLS;
        return this.SYMBOLS.map((symbol) => {
            if (symbol.isCrypto && symbol.theme !== theme) {
                // Reduce weight of other crypto symbols
                return { ...symbol, weight: Math.floor(symbol.weight * 0.3) };
            }
            if (symbol.isCrypto && symbol.theme === theme) {
                // Increase weight of themed crypto symbol
                return { ...symbol, weight: Math.floor(symbol.weight * 2) };
            }
            return symbol;
        });
    }
    createWeightedPool(symbols) {
        const pool = [];
        for (const symbol of symbols) {
            for (let i = 0; i < symbol.weight; i++) {
                pool.push(symbol.id);
            }
        }
        return pool;
    }
    getSymbolById(id) {
        return this.SYMBOLS.find((symbol) => symbol.id === id);
    }
    initializeGame(betAmount, serverSeed, clientSeed = "", nonce = 0, theme) {
        const gameData = {
            betAmount,
            serverSeed,
            clientSeed,
            nonce,
            paylines: 25,
            theme,
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
        const symbols = this.getSymbolsForTheme(gameData.theme);
        const weightedPool = this.createWeightedPool(symbols);
        const randoms = this.generateSecureRandoms(gameData.serverSeed, gameData.clientSeed, gameData.nonce, this.NUM_REELS * this.REEL_SIZE);
        const reels = [];
        let randomIndex = 0;
        for (let i = 0; i < this.NUM_REELS; i++) {
            const reel = [];
            for (let j = 0; j < this.REEL_SIZE; j++) {
                const poolIndex = Math.floor(randoms[randomIndex] * weightedPool.length);
                reel.push(weightedPool[poolIndex]);
                randomIndex++;
            }
            reels.push(reel);
        }
        const paylines = this.calculatePaylines(reels);
        const totalMultiplier = paylines.reduce((sum, line) => sum + line.multiplier, 0);
        const isWin = totalMultiplier > 0;
        const winAmount = this.calculateWinnings(gameData.betAmount, totalMultiplier);
        const result = {
            reels,
            paylines,
            totalMultiplier,
            isWin,
            theme: gameData.theme,
        };
        state.status = "completed";
        state.history.push(result);
        return {
            isWin,
            multiplier: totalMultiplier,
            winAmount,
            gameData: result,
            outcome: { reels, totalMultiplier, isWin, theme: gameData.theme },
        };
    }
    calculatePaylines(reels) {
        const paylines = [];
        // Check horizontal paylines
        for (let row = 0; row < this.REEL_SIZE; row++) {
            const line = [];
            for (let reel = 0; reel < this.NUM_REELS; reel++) {
                line.push(reels[reel][row]);
            }
            const result = this.calculateLineMultiplier(line);
            if (result.multiplier > 0) {
                paylines.push({
                    line,
                    multiplier: result.multiplier,
                    symbolCount: result.count,
                });
            }
        }
        // Check diagonal paylines (top-left to bottom-right and top-right to bottom-left)
        if (this.REEL_SIZE >= 3) {
            const diagonalLine1 = [];
            const diagonalLine2 = [];
            for (let i = 0; i < Math.min(this.NUM_REELS, this.REEL_SIZE); i++) {
                diagonalLine1.push(reels[i][i]);
                diagonalLine2.push(reels[i][this.REEL_SIZE - 1 - i]);
            }
            const diagonal1Result = this.calculateLineMultiplier(diagonalLine1);
            if (diagonal1Result.multiplier > 0) {
                paylines.push({
                    line: diagonalLine1,
                    multiplier: diagonal1Result.multiplier,
                    symbolCount: diagonal1Result.count,
                });
            }
            const diagonal2Result = this.calculateLineMultiplier(diagonalLine2);
            if (diagonal2Result.multiplier > 0) {
                paylines.push({
                    line: diagonalLine2,
                    multiplier: diagonal2Result.multiplier,
                    symbolCount: diagonal2Result.count,
                });
            }
        }
        return paylines;
    }
    calculateLineMultiplier(line) {
        if (line.length < 3)
            return { multiplier: 0, count: 0 };
        const firstSymbol = line[0];
        let consecutiveCount = 1;
        for (let i = 1; i < line.length; i++) {
            if (line[i] === firstSymbol) {
                consecutiveCount++;
            }
            else {
                break;
            }
        }
        // Check for any fruit combination (different fruits)
        if (consecutiveCount < 3) {
            const fruitSymbols = ["cherry", "lemon", "orange", "plum"];
            const fruitCount = line.filter((symbol) => fruitSymbols.includes(symbol)).length;
            if (fruitCount >= 3) {
                return { multiplier: 1.5, count: fruitCount };
            }
        }
        if (consecutiveCount >= 3) {
            const symbol = this.getSymbolById(firstSymbol);
            if (symbol && symbol.multipliers[consecutiveCount]) {
                return {
                    multiplier: symbol.multipliers[consecutiveCount],
                    count: consecutiveCount,
                };
            }
        }
        return { multiplier: 0, count: 0 };
    }
    // Public method to support themed games
    initializeThemedGame(betAmount, serverSeed, theme, clientSeed = "", nonce = 0) {
        return this.initializeGame(betAmount, serverSeed, clientSeed, nonce, theme);
    }
    // Method to get available themes
    getAvailableThemes() {
        return ["BTC", "ETH", "SOL"];
    }
    // Method to get symbol information for a theme
    getThemeSymbols(theme) {
        return this.getSymbolsForTheme(theme);
    }
    // Calculate theoretical RTP
    calculateTheoreticalRTP() {
        return (1 - this.config.houseEdge) * 100;
    }
    // Get all available symbols
    getAllSymbols() {
        return this.SYMBOLS;
    }
}
exports.SlotsProvider = SlotsProvider;
