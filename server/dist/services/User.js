"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../models/User");
class User {
    constructor() {
        this.model = User_1.UserModel;
    }
    async get(id) {
        try {
            return await this.model.findById(id);
        }
        catch (error) {
            throw new Error(`Failed to get user: ${error}`);
        }
    }
    async getByWalletAddress(walletAddress) {
        try {
            return await this.model.findOne({ walletAddress });
        }
        catch (error) {
            throw new Error(`Failed to get user by wallet address: ${error}`);
        }
    }
    async getByTelegramId(telegramId) {
        try {
            return await this.model.findOne({ telegramId });
        }
        catch (error) {
            throw new Error(`Failed to get user by telegram ID: ${error}`);
        }
    }
    async create(userData) {
        try {
            const user = new this.model(userData);
            return await user.save();
        }
        catch (error) {
            throw new Error(`Failed to create user: ${error}`);
        }
    }
}
exports.default = new User();
