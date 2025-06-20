"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
require("jest-extended");
// Load test environment variables
dotenv_1.default.config({ path: '.env.test' });
// MongoDB Memory Server or test database setup
const MONGO_TEST_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/solana-cash-machine-test';
beforeAll(async () => {
    // Connect to test database
    await mongoose_1.default.connect(MONGO_TEST_URI);
});
beforeEach(async () => {
    // Clean up all collections before each test
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
afterAll(async () => {
    // Close database connection after all tests
    await mongoose_1.default.connection.close();
});
// Increase timeout for database operations
jest.setTimeout(30000);
