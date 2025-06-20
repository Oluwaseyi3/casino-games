"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
const mongoose_1 = require("mongoose");
const SessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    sessionData: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
exports.SessionModel = (0, mongoose_1.model)("Session", SessionSchema);
