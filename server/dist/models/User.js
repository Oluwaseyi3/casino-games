"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = require("jsonwebtoken");
const constants_1 = require("../config/constants");
const UserSchema = new mongoose_1.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    telegramId: {
        type: Number,
        sparse: true,
        index: true,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
        default: null,
    },
}, { timestamps: true });
UserSchema.statics.findByToken = async function (token, cb) {
    var user = this;
    try {
        const { id } = (0, jsonwebtoken_1.verify)(token, constants_1.LOGIN_SECRET);
        const foundUser = await user.findOne({ _id: id, token: token });
        cb(null, foundUser);
    }
    catch (err) {
        cb(err, null);
    }
};
UserSchema.methods.generatetoken = function (cb) {
    const user = this;
    var token = (0, jsonwebtoken_1.sign)({ id: user._id.toString() }, constants_1.LOGIN_SECRET);
    cb(null, token);
};
UserSchema.methods.deletetoken = async function () {
    var user = this;
    user.token = undefined;
    await user.save();
};
exports.UserModel = (0, mongoose_1.model)("User", UserSchema);
