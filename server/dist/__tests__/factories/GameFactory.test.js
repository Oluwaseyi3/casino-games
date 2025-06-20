"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameFactory_1 = __importDefault(require("../../factories/GameFactory"));
const BlackjackProvider_1 = require("../../providers/BlackjackProvider");
const DiceProvider_1 = require("../../providers/DiceProvider");
const SlotsProvider_1 = require("../../providers/SlotsProvider");
const ShipCaptainCrewProvider_1 = require("../../providers/ShipCaptainCrewProvider");
describe("GameFactory", () => {
    describe("getProvider", () => {
        it("should return correct provider for each game type", () => {
            const blackjackProvider = GameFactory_1.default.getProvider("blackjack");
            const diceProvider = GameFactory_1.default.getProvider("dice");
            const slotsProvider = GameFactory_1.default.getProvider("slots");
            const shipCaptainCrewProvider = GameFactory_1.default.getProvider("shipcaptaincrew");
            expect(blackjackProvider).toBeInstanceOf(BlackjackProvider_1.BlackjackProvider);
            expect(diceProvider).toBeInstanceOf(DiceProvider_1.DiceProvider);
            expect(slotsProvider).toBeInstanceOf(SlotsProvider_1.SlotsProvider);
            expect(shipCaptainCrewProvider).toBeInstanceOf(ShipCaptainCrewProvider_1.ShipCaptainCrewProvider);
            expect(blackjackProvider.gameType).toBe("blackjack");
            expect(diceProvider.gameType).toBe("dice");
            expect(slotsProvider.gameType).toBe("slots");
            expect(shipCaptainCrewProvider.gameType).toBe("shipcaptaincrew");
        });
        it("should throw error for invalid game type", () => {
            expect(() => {
                GameFactory_1.default.getProvider("invalid_game");
            }).toThrow("Game provider not found for type: invalid_game");
        });
        it("should return same instance on multiple calls", () => {
            const provider1 = GameFactory_1.default.getProvider("blackjack");
            const provider2 = GameFactory_1.default.getProvider("blackjack");
            expect(provider1).toBe(provider2);
        });
    });
    describe("getSupportedGames", () => {
        it("should return all supported game types", () => {
            const supportedGames = GameFactory_1.default.getSupportedGames();
            expect(supportedGames).toContain("blackjack");
            expect(supportedGames).toContain("dice");
            expect(supportedGames).toContain("slots");
            expect(supportedGames).toContain("shipcaptaincrew");
            expect(supportedGames).toHaveLength(4);
        });
        it("should return array of valid game types", () => {
            const supportedGames = GameFactory_1.default.getSupportedGames();
            supportedGames.forEach((gameType) => {
                expect(["blackjack", "dice", "slots", "shipcaptaincrew"]).toContain(gameType);
            });
        });
    });
    describe("validateGameType", () => {
        it("should return true for valid game types", () => {
            expect(GameFactory_1.default.validateGameType("blackjack")).toBe(true);
            expect(GameFactory_1.default.validateGameType("dice")).toBe(true);
            expect(GameFactory_1.default.validateGameType("slots")).toBe(true);
            expect(GameFactory_1.default.validateGameType("shipcaptaincrew")).toBe(true);
        });
        it("should return false for invalid game types", () => {
            expect(GameFactory_1.default.validateGameType("poker")).toBe(false);
            expect(GameFactory_1.default.validateGameType("roulette")).toBe(false);
            expect(GameFactory_1.default.validateGameType("invalid")).toBe(false);
            expect(GameFactory_1.default.validateGameType("")).toBe(false);
            expect(GameFactory_1.default.validateGameType("BLACKJACK")).toBe(false); // Case sensitive
        });
        it("should handle edge cases", () => {
            expect(GameFactory_1.default.validateGameType(null)).toBe(false);
            expect(GameFactory_1.default.validateGameType(undefined)).toBe(false);
            expect(GameFactory_1.default.validateGameType(123)).toBe(false);
            expect(GameFactory_1.default.validateGameType({})).toBe(false);
        });
    });
    describe("getGameConfig", () => {
        it("should return correct config for each game type", () => {
            const blackjackConfig = GameFactory_1.default.getGameConfig("blackjack");
            const diceConfig = GameFactory_1.default.getGameConfig("dice");
            const slotsConfig = GameFactory_1.default.getGameConfig("slots");
            const shipCaptainCrewConfig = GameFactory_1.default.getGameConfig("shipcaptaincrew");
            // Test blackjack config
            expect(blackjackConfig.minBet).toBe(0.01);
            expect(blackjackConfig.maxBet).toBe(100);
            expect(blackjackConfig.baseMultiplier).toBe(2);
            expect(blackjackConfig.houseEdge).toBe(0.005);
            // Test dice config
            expect(diceConfig.minBet).toBe(0.001);
            expect(diceConfig.maxBet).toBe(100);
            expect(diceConfig.baseMultiplier).toBe(1);
            expect(diceConfig.houseEdge).toBe(0.01);
            // Test slots config
            expect(slotsConfig.minBet).toBe(0.01);
            expect(slotsConfig.maxBet).toBe(50);
            expect(slotsConfig.baseMultiplier).toBe(1);
            expect(slotsConfig.houseEdge).toBe(0.03); // Updated for 97% RTP
            // Test shipcaptaincrew config
            expect(shipCaptainCrewConfig.minBet).toBe(0.01);
            expect(shipCaptainCrewConfig.maxBet).toBe(100);
            expect(shipCaptainCrewConfig.baseMultiplier).toBe(1);
            expect(shipCaptainCrewConfig.houseEdge).toBe(0.05);
        });
        it("should throw error for invalid game type", () => {
            expect(() => {
                GameFactory_1.default.getGameConfig("invalid_game");
            }).toThrow("Game provider not found for type: invalid_game");
        });
        it("should return config with all required properties", () => {
            const supportedGames = GameFactory_1.default.getSupportedGames();
            supportedGames.forEach((gameType) => {
                const config = GameFactory_1.default.getGameConfig(gameType);
                expect(config).toHaveProperty("minBet");
                expect(config).toHaveProperty("maxBet");
                expect(config).toHaveProperty("baseMultiplier");
                expect(config).toHaveProperty("houseEdge");
                expect(typeof config.minBet).toBe("number");
                expect(typeof config.maxBet).toBe("number");
                expect(typeof config.baseMultiplier).toBe("number");
                expect(typeof config.houseEdge).toBe("number");
                expect(config.minBet).toBeGreaterThan(0);
                expect(config.maxBet).toBeGreaterThan(config.minBet);
                expect(config.baseMultiplier).toBeGreaterThan(0);
                expect(config.houseEdge).toBeGreaterThanOrEqual(0);
                expect(config.houseEdge).toBeLessThan(1);
            });
        });
    });
    describe("registerProvider", () => {
        it("should be able to register a new provider", () => {
            // Create a mock provider
            const mockProvider = {
                gameType: "test_game",
                config: {
                    minBet: 0.1,
                    maxBet: 10,
                    baseMultiplier: 1.5,
                    houseEdge: 0.02,
                },
                validateBet: jest.fn(),
                calculateWinnings: jest.fn(),
                initializeGame: jest.fn(),
                playGame: jest.fn(),
            };
            // Register the provider
            GameFactory_1.default.registerProvider(mockProvider);
            // Verify it was registered
            expect(GameFactory_1.default.validateGameType("test_game")).toBe(true);
            expect(GameFactory_1.default.getSupportedGames()).toContain("test_game");
            const retrievedProvider = GameFactory_1.default.getProvider("test_game");
            expect(retrievedProvider).toBe(mockProvider);
            const retrievedConfig = GameFactory_1.default.getGameConfig("test_game");
            expect(retrievedConfig).toEqual(mockProvider.config);
        });
        it("should overwrite existing provider when registering with same game type", () => {
            const originalProvider = GameFactory_1.default.getProvider("dice");
            // Create new provider with same game type
            const newProvider = {
                gameType: "dice",
                config: {
                    minBet: 1,
                    maxBet: 50,
                    baseMultiplier: 2,
                    houseEdge: 0.05,
                },
                validateBet: jest.fn(),
                calculateWinnings: jest.fn(),
                initializeGame: jest.fn(),
                playGame: jest.fn(),
            };
            GameFactory_1.default.registerProvider(newProvider);
            const retrievedProvider = GameFactory_1.default.getProvider("dice");
            expect(retrievedProvider).toBe(newProvider);
            expect(retrievedProvider).not.toBe(originalProvider);
            // Cleanup - restore original provider
            GameFactory_1.default.registerProvider(new DiceProvider_1.DiceProvider());
        });
    });
    describe("Integration", () => {
        it("should have all providers properly initialized on startup", () => {
            const supportedGames = GameFactory_1.default.getSupportedGames();
            // Should have exactly the expected games
            expect(supportedGames).toHaveLength(5);
            expect(supportedGames).toEqual(expect.arrayContaining(["blackjack", "dice", "slots", "shipcaptaincrew", "test_game"]));
            // Each provider should be properly configured
            supportedGames.forEach((gameType) => {
                const provider = GameFactory_1.default.getProvider(gameType);
                const config = GameFactory_1.default.getGameConfig(gameType);
                // Provider should have all required methods
                expect(typeof provider.validateBet).toBe("function");
                expect(typeof provider.calculateWinnings).toBe("function");
                expect(typeof provider.initializeGame).toBe("function");
                expect(typeof provider.playGame).toBe("function");
                // Provider's gameType should match
                expect(provider.gameType).toBe(gameType);
                // Provider's config should match retrieved config
                expect(provider.config).toEqual(config);
            });
        });
        it("should provide consistent interface across all providers", () => {
            const supportedGames = GameFactory_1.default.getSupportedGames();
            supportedGames
                .filter((games) => games !== "test_game")
                .forEach((gameType) => {
                const provider = GameFactory_1.default.getProvider(gameType);
                // Test bet validation
                expect(provider.validateBet(provider.config.minBet)).toBe(true);
                expect(provider.validateBet(provider.config.maxBet)).toBe(true);
                expect(provider.validateBet(provider.config.minBet - 0.001)).toBe(false);
                expect(provider.validateBet(provider.config.maxBet + 0.001)).toBe(false);
                // Test winnings calculation
                expect(provider.calculateWinnings(10, 2)).toBe(20);
                expect(provider.calculateWinnings(5, 0)).toBe(0);
                // Test game initialization
                const gameState = provider.initializeGame(1, "test_seed", "client_seed", 12345);
                expect(gameState.gameType).toBe(gameType);
                expect(gameState.status).toMatch(/created|in_progress/);
                expect(gameState.currentData).toBeDefined();
                expect(gameState.history).toEqual([]);
            });
        });
        it("should handle concurrent access correctly", () => {
            // Simulate multiple concurrent requests for providers
            const promises = [];
            const gameTypes = ["blackjack", "dice", "slots", "shipcaptaincrew"];
            for (let i = 0; i < 100; i++) {
                const gameType = gameTypes[i % gameTypes.length];
                promises.push(Promise.resolve(GameFactory_1.default.getProvider(gameType)));
            }
            return Promise.all(promises).then((providers) => {
                // All providers should be valid
                providers.forEach((provider, index) => {
                    const expectedGameType = gameTypes[index % gameTypes.length];
                    expect(provider.gameType).toBe(expectedGameType);
                });
                // Providers of same type should be identical instances
                const blackjackProviders = providers.filter((p) => p.gameType === "blackjack");
                const firstBlackjackProvider = blackjackProviders[0];
                blackjackProviders.forEach((provider) => {
                    expect(provider).toBe(firstBlackjackProvider);
                });
            });
        });
    });
    describe("Error Handling", () => {
        it("should fail to initialise for invalid providers", () => {
            const invalidProviders = [
                null,
                undefined,
                {},
                { gameType: "invalid" }, // Missing required methods
                { config: {} }, // Missing gameType
            ];
            invalidProviders.forEach((invalidProvider) => {
                expect(() => {
                    GameFactory_1.default.registerProvider(invalidProvider);
                }).toThrow(); // Should not crash the factory
            });
        });
        it("should maintain state integrity after errors", () => {
            const originalSupportedGames = GameFactory_1.default.getSupportedGames();
            try {
                GameFactory_1.default.registerProvider(null);
            }
            catch (error) {
                // Should not affect existing providers
            }
            const currentSupportedGames = GameFactory_1.default.getSupportedGames();
            expect(currentSupportedGames).toEqual(originalSupportedGames);
            // Original providers should still work
            currentSupportedGames.forEach((gameType) => {
                expect(() => GameFactory_1.default.getProvider(gameType)).not.toThrow();
            });
        });
    });
});
