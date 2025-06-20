"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackjackProvider = void 0;
const BaseGameProvider_1 = require("./BaseGameProvider");
class BlackjackProvider extends BaseGameProvider_1.BaseGameProvider {
    constructor() {
        super(...arguments);
        this.gameType = "blackjack";
        this.config = {
            minBet: 1,
            maxBet: 100,
            baseMultiplier: 2,
            houseEdge: 0.005,
        };
    }
    createDeck() {
        const deck = [];
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                const value = rank > 10 ? 10 : rank;
                deck.push({ suit, rank, value });
            }
        }
        return deck;
    }
    shuffleDeck(deck, serverSeed, clientSeed, nonce) {
        const shuffled = [...deck];
        const randoms = this.generateSecureRandoms(serverSeed, clientSeed, nonce, deck.length);
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(randoms[i] * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    calculateHandValue(hand) {
        let total = 0;
        let aces = 0;
        for (const card of hand) {
            if (card.rank === 1) {
                aces++;
                total += 11;
            }
            else {
                total += card.value;
            }
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }
    isSoftTotal(hand) {
        let aces = 0;
        let total = 0;
        for (const card of hand) {
            if (card.rank === 1) {
                aces++;
                total += 11;
            }
            else {
                total += card.value;
            }
        }
        return aces > 0 && total <= 21;
    }
    isBlackjack(hand) {
        return hand.length === 2 && this.calculateHandValue(hand) === 21;
    }
    initializeGame(betAmount, serverSeed, clientSeed = "", nonce = 0) {
        const deck = this.createDeck();
        const shuffledDeck = this.shuffleDeck(deck, serverSeed, clientSeed, nonce);
        const playerHand = [shuffledDeck[0], shuffledDeck[2]];
        const dealerHand = [shuffledDeck[1]];
        const remainingDeck = shuffledDeck.slice(3);
        const gameData = {
            betAmount,
            serverSeed,
            clientSeed,
            nonce,
            playerHand,
            dealerHand,
            deck: remainingDeck,
            gamePhase: "dealing",
            playerTotal: this.calculateHandValue(playerHand),
            dealerTotal: this.calculateHandValue(dealerHand),
            canDoubleDown: true,
            canSplit: playerHand[0].rank === playerHand[1].rank,
            canSurrender: true,
            isSplit: false,
            currentHand: "main",
            actionHistory: [
                {
                    hand: "main",
                    action: "deal",
                    cards: playerHand,
                    timestamp: Date.now(),
                },
                {
                    hand: "dealer",
                    action: "deal",
                    cards: [dealerHand[0]],
                    timestamp: Date.now(),
                },
            ],
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
        if (!move || !move.action) {
            return this.autoPlay(gameData, state);
        }
        switch (move.action) {
            case "hit":
                return this.handleHit(gameData, state);
            case "stand":
                return this.handleStand(gameData, state);
            case "double":
                return this.handleDouble(gameData, state);
            case "split":
                return this.handleSplit(gameData, state);
            case "surrender":
                return this.handleSurrender(gameData, state);
            default:
                return this.autoPlay(gameData, state);
        }
    }
    async autoPlay(gameData, state) {
        if (this.isBlackjack(gameData.playerHand)) {
            gameData.dealerHand.push(gameData.deck.shift());
            gameData.dealerTotal = this.calculateHandValue(gameData.dealerHand);
            if (this.isBlackjack(gameData.dealerHand)) {
                return this.finishGame(gameData, state, "push");
            }
            else {
                return this.finishGame(gameData, state, "blackjack");
            }
        }
        if (gameData.playerTotal > 21) {
            return this.finishGame(gameData, state, "lose");
        }
        return this.dealerPlay(gameData, state);
    }
    async handleHit(gameData, state) {
        if (gameData.deck.length === 0) {
            throw new Error("No cards left in deck");
        }
        const newCard = gameData.deck.shift();
        const currentHand = gameData.currentHand === "split"
            ? gameData.splitHand
            : gameData.playerHand;
        currentHand.push(newCard);
        if (gameData.currentHand === "split") {
            gameData.splitTotal = this.calculateHandValue(gameData.splitHand);
        }
        else {
            gameData.playerTotal = this.calculateHandValue(gameData.playerHand);
        }
        gameData.canDoubleDown = false;
        gameData.canSurrender = false;
        gameData.actionHistory.push({
            hand: gameData.currentHand,
            action: "hit",
            cards: [newCard],
            timestamp: Date.now(),
        });
        const currentTotal = gameData.currentHand === "split"
            ? gameData.splitTotal
            : gameData.playerTotal;
        if (currentTotal > 21) {
            if (gameData.isSplit && gameData.currentHand === "main") {
                gameData.currentHand = "split";
                gameData.gamePhase = "split_turn";
                gameData.canDoubleDown = gameData.splitHand.length === 2;
                state.currentData = gameData;
                return {
                    isWin: false,
                    multiplier: 0,
                    winAmount: 0,
                    gameData: this.getGameDataForResponse(gameData),
                    outcome: {
                        action: "hit",
                        hand: "main",
                        bust: true,
                        status: "continue_split",
                    },
                };
            }
            else if (gameData.isSplit && gameData.currentHand === "split") {
                return this.dealerPlay(gameData, state);
            }
            else {
                return this.finishGame(gameData, state, "lose");
            }
        }
        state.currentData = gameData;
        return {
            isWin: false,
            multiplier: 0,
            winAmount: 0,
            gameData: this.getGameDataForResponse(gameData),
            outcome: {
                action: "hit",
                hand: gameData.currentHand,
                total: currentTotal,
                status: "continue",
            },
        };
    }
    async handleStand(gameData, state) {
        gameData.actionHistory.push({
            hand: gameData.currentHand,
            action: "stand",
            timestamp: Date.now(),
        });
        if (gameData.isSplit && gameData.currentHand === "main") {
            gameData.currentHand = "split";
            gameData.gamePhase = "split_turn";
            gameData.canDoubleDown = gameData.splitHand.length === 2;
            gameData.canSurrender = false;
            state.currentData = gameData;
            return {
                isWin: false,
                multiplier: 0,
                winAmount: 0,
                gameData: this.getGameDataForResponse(gameData),
                outcome: { action: "stand", hand: "main", status: "continue_split" },
            };
        }
        return this.dealerPlay(gameData, state);
    }
    async handleDouble(gameData, state) {
        if (!gameData.canDoubleDown) {
            throw new Error("Cannot double down");
        }
        gameData.betAmount *= 2;
        const newCard = gameData.deck.shift();
        const currentHand = gameData.currentHand === "split"
            ? gameData.splitHand
            : gameData.playerHand;
        currentHand.push(newCard);
        if (gameData.currentHand === "split") {
            gameData.splitTotal = this.calculateHandValue(gameData.splitHand);
        }
        else {
            gameData.playerTotal = this.calculateHandValue(gameData.playerHand);
        }
        gameData.actionHistory.push({
            hand: gameData.currentHand,
            action: "double",
            cards: [newCard],
            timestamp: Date.now(),
        });
        const currentTotal = gameData.currentHand === "split"
            ? gameData.splitTotal
            : gameData.playerTotal;
        if (currentTotal > 21) {
            if (gameData.isSplit && gameData.currentHand === "main") {
                gameData.currentHand = "split";
                gameData.gamePhase = "split_turn";
                gameData.canDoubleDown = gameData.splitHand.length === 2;
                state.currentData = gameData;
                return {
                    isWin: false,
                    multiplier: 0,
                    winAmount: 0,
                    gameData: this.getGameDataForResponse(gameData),
                    outcome: {
                        action: "double",
                        hand: "main",
                        bust: true,
                        status: "continue_split",
                    },
                };
            }
            else if (gameData.isSplit && gameData.currentHand === "split") {
                return this.dealerPlay(gameData, state);
            }
            else {
                return this.finishGame(gameData, state, "lose");
            }
        }
        if (gameData.isSplit && gameData.currentHand === "main") {
            gameData.currentHand = "split";
            gameData.gamePhase = "split_turn";
            gameData.canDoubleDown = gameData.splitHand.length === 2;
            state.currentData = gameData;
            return {
                isWin: false,
                multiplier: 0,
                winAmount: 0,
                gameData: this.getGameDataForResponse(gameData),
                outcome: { action: "double", hand: "main", status: "continue_split" },
            };
        }
        return this.dealerPlay(gameData, state);
    }
    async handleSplit(gameData, state) {
        if (!gameData.canSplit) {
            throw new Error("Cannot split");
        }
        if (gameData.isSplit) {
            throw new Error("Already split");
        }
        gameData.isSplit = true;
        gameData.splitHand = [gameData.playerHand.pop()];
        gameData.splitHand.push(gameData.deck.shift());
        gameData.playerHand.push(gameData.deck.shift());
        gameData.playerTotal = this.calculateHandValue(gameData.playerHand);
        gameData.splitTotal = this.calculateHandValue(gameData.splitHand);
        gameData.canSplit = false;
        gameData.canDoubleDown = true;
        gameData.canSurrender = false;
        gameData.currentHand = "main";
        gameData.gamePhase = "player_turn";
        gameData.actionHistory.push({
            hand: "main",
            action: "split",
            cards: gameData.playerHand,
            timestamp: Date.now(),
        });
        gameData.actionHistory.push({
            hand: "split",
            action: "split",
            cards: gameData.splitHand,
            timestamp: Date.now(),
        });
        state.currentData = gameData;
        return {
            isWin: false,
            multiplier: 0,
            winAmount: 0,
            gameData: this.getGameDataForResponse(gameData),
            outcome: { action: "split", status: "continue" },
        };
    }
    async handleSurrender(gameData, state) {
        if (!gameData.canSurrender) {
            throw new Error("Cannot surrender");
        }
        gameData.actionHistory.push({
            hand: gameData.currentHand,
            action: "surrender",
            timestamp: Date.now(),
        });
        return this.finishGame(gameData, state, "surrender");
    }
    async dealerPlay(gameData, state) {
        gameData.dealerHand.push(gameData.deck.shift());
        gameData.dealerTotal = this.calculateHandValue(gameData.dealerHand);
        gameData.actionHistory.push({
            hand: "dealer",
            action: "hit",
            cards: [gameData.dealerHand[gameData.dealerHand.length - 1]],
            timestamp: Date.now(),
        });
        // Dealer hits on soft 17
        while (gameData.dealerTotal < 17 ||
            (gameData.dealerTotal === 17 && this.isSoftTotal(gameData.dealerHand))) {
            const newCard = gameData.deck.shift();
            gameData.dealerHand.push(newCard);
            gameData.dealerTotal = this.calculateHandValue(gameData.dealerHand);
            gameData.actionHistory.push({
                hand: "dealer",
                action: "hit",
                cards: [newCard],
                timestamp: Date.now(),
            });
        }
        gameData.actionHistory.push({
            hand: "dealer",
            action: "stand",
            timestamp: Date.now(),
            result: `dealer total: ${gameData.dealerTotal}`,
        });
        if (gameData.isSplit) {
            return this.finishSplitGame(gameData, state);
        }
        if (gameData.dealerTotal > 21) {
            return this.finishGame(gameData, state, "win");
        }
        else if (gameData.playerTotal > gameData.dealerTotal) {
            return this.finishGame(gameData, state, "win");
        }
        else if (gameData.playerTotal < gameData.dealerTotal) {
            return this.finishGame(gameData, state, "lose");
        }
        else {
            return this.finishGame(gameData, state, "push");
        }
    }
    finishGame(gameData, state, outcome) {
        gameData.gamePhase = "finished";
        state.status = "completed";
        let multiplier = 0;
        let isWin = false;
        switch (outcome) {
            case "blackjack":
                multiplier = 2.5; // 3:2 payout
                isWin = true;
                break;
            case "win":
                multiplier = 2;
                isWin = true;
                break;
            case "push":
                multiplier = 1;
                isWin = false;
                break;
            case "surrender":
                multiplier = 0.5; // Get half bet back
                isWin = false;
                break;
            case "lose":
                multiplier = 0;
                isWin = false;
                break;
        }
        const winAmount = this.calculateWinnings(gameData.betAmount, multiplier);
        const result = {
            playerHand: gameData.playerHand,
            dealerHand: gameData.dealerHand,
            splitHand: gameData.splitHand,
            playerTotal: gameData.playerTotal,
            dealerTotal: gameData.dealerTotal,
            splitTotal: gameData.splitTotal,
            outcome,
            isWin,
            actionHistory: gameData.actionHistory,
        };
        state.history.push(result);
        return {
            isWin,
            multiplier,
            winAmount,
            gameData: result,
            outcome: {
                outcome,
                playerTotal: gameData.playerTotal,
                dealerTotal: gameData.dealerTotal,
            },
        };
    }
    finishSplitGame(gameData, state) {
        gameData.gamePhase = "finished";
        state.status = "completed";
        let mainOutcome;
        let splitOutcome;
        // Determine main hand outcome
        if (gameData.playerTotal > 21) {
            mainOutcome = "lose";
        }
        else if (gameData.dealerTotal > 21) {
            mainOutcome = "win";
        }
        else if (gameData.playerTotal > gameData.dealerTotal) {
            mainOutcome = "win";
        }
        else if (gameData.playerTotal < gameData.dealerTotal) {
            mainOutcome = "lose";
        }
        else {
            mainOutcome = "push";
        }
        // Determine split hand outcome
        if (gameData.splitTotal > 21) {
            splitOutcome = "lose";
        }
        else if (gameData.dealerTotal > 21) {
            splitOutcome = "win";
        }
        else if (gameData.splitTotal > gameData.dealerTotal) {
            splitOutcome = "win";
        }
        else if (gameData.splitTotal < gameData.dealerTotal) {
            splitOutcome = "lose";
        }
        else {
            splitOutcome = "push";
        }
        // Check for blackjacks
        if (this.isBlackjack(gameData.playerHand)) {
            mainOutcome = "blackjack";
        }
        if (this.isBlackjack(gameData.splitHand)) {
            splitOutcome = "blackjack";
        }
        const mainMultiplier = this.getMultiplierForOutcome(mainOutcome);
        const splitMultiplier = this.getMultiplierForOutcome(splitOutcome);
        const mainWinAmount = this.calculateWinnings(gameData.betAmount, mainMultiplier);
        const splitWinAmount = this.calculateWinnings(gameData.betAmount, splitMultiplier);
        const totalWinAmount = mainWinAmount + splitWinAmount;
        const isWin = mainOutcome === "win" || mainOutcome === "blackjack";
        const isSplitWin = splitOutcome === "win" || splitOutcome === "blackjack";
        const result = {
            playerHand: gameData.playerHand,
            dealerHand: gameData.dealerHand,
            splitHand: gameData.splitHand,
            playerTotal: gameData.playerTotal,
            dealerTotal: gameData.dealerTotal,
            splitTotal: gameData.splitTotal,
            outcome: mainOutcome,
            splitOutcome,
            isWin,
            isSplitWin,
            actionHistory: gameData.actionHistory,
        };
        state.history.push(result);
        return {
            isWin: isWin || isSplitWin,
            multiplier: (mainMultiplier + splitMultiplier) / 2, // Average for display
            winAmount: totalWinAmount,
            gameData: result,
            outcome: {
                mainOutcome,
                splitOutcome,
                playerTotal: gameData.playerTotal,
                splitTotal: gameData.splitTotal,
                dealerTotal: gameData.dealerTotal,
            },
        };
    }
    getMultiplierForOutcome(outcome) {
        switch (outcome) {
            case "blackjack":
                return 2.5;
            case "win":
                return 2;
            case "push":
                return 1;
            case "lose":
                return 0;
        }
    }
    getGameDataForResponse(gameData) {
        return {
            playerHand: gameData.playerHand,
            dealerHand: gameData.dealerHand,
            splitHand: gameData.splitHand,
            playerTotal: gameData.playerTotal,
            dealerTotal: gameData.dealerTotal,
            splitTotal: gameData.splitTotal,
            gamePhase: gameData.gamePhase,
            canDoubleDown: gameData.canDoubleDown,
            canSplit: gameData.canSplit,
            canSurrender: gameData.canSurrender,
            isSplit: gameData.isSplit,
            currentHand: gameData.currentHand,
            actionHistory: gameData.actionHistory,
        };
    }
}
exports.BlackjackProvider = BlackjackProvider;
