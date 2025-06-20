"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameFactory = void 0;
const BlackjackProvider_1 = require("../providers/BlackjackProvider");
const DiceProvider_1 = require("../providers/DiceProvider");
const SlotsProvider_1 = require("../providers/SlotsProvider");
const ShipCaptainCrewProvider_1 = require("../providers/ShipCaptainCrewProvider");
class GameFactory {
    static registerProvider(provider) {
        if (!provider || !provider.gameType || !provider.config) {
            throw new Error("Invalid game provider");
        }
        GameFactory.providers.set(provider.gameType, provider);
    }
    static getProvider(gameType) {
        const provider = GameFactory.providers.get(gameType);
        if (!provider) {
            throw new Error(`Game provider not found for type: ${gameType}`);
        }
        return provider;
    }
    static getSupportedGames() {
        return Array.from(GameFactory.providers.keys());
    }
    static validateGameType(gameType) {
        return GameFactory.providers.has(gameType);
    }
    static getGameConfig(gameType) {
        const provider = GameFactory.getProvider(gameType);
        return provider.config;
    }
}
exports.GameFactory = GameFactory;
GameFactory.providers = new Map();
(() => {
    GameFactory.registerProvider(new BlackjackProvider_1.BlackjackProvider());
    GameFactory.registerProvider(new DiceProvider_1.DiceProvider());
    GameFactory.registerProvider(new SlotsProvider_1.SlotsProvider());
    GameFactory.registerProvider(new ShipCaptainCrewProvider_1.ShipCaptainCrewProvider());
})();
exports.default = GameFactory;
