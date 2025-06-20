"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameResultModel = void 0;
const mongoose_1 = require("mongoose");
const GameResultSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    gameType: {
        type: String,
        required: true,
        index: true,
    },
    result: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
}, { timestamps: true });
exports.GameResultModel = (0, mongoose_1.model)("GameResult", GameResultSchema);
