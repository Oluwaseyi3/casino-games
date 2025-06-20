"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const moment_1 = __importDefault(require("moment"));
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const auth_1 = require("../services/api/auth/auth");
const User_1 = __importDefault(require("../services/User"));
const User_2 = require("../models/User");
let authRouter = express_1.default.Router();
/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags:
 *     - "Auth"
 *     produces:
 *       - application/json
 *     consumes:
 *       - application/json
 *     description: list blockchain
 *     responses:
 *       200:
 *         description: get list blockchain.
 */
authRouter.get("/profile", auth_1.authenticatetoken, async (req, res) => {
    try {
        const userId = req.user?._id;
        const foundUserDetails = await User_1.default.get(userId);
        //check if foundUserDetails has a password
        if (!foundUserDetails) {
            res.status(200).json({ data: "Unable to find user of specific Id" });
            return;
        }
        const data = foundUserDetails.toObject();
        data.token = req.token;
        res.status(200).json({
            success: true,
            data: data,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error });
    }
});
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *     - "Auth"
 *     requestBody:
 *       description: description
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *               - publicAddress
 *               - message
 *               - referrerId
 *             properties:
 *                signature:
 *                  type: string
 *                publicAddress:
 *                  type: string
 *                message:
 *                  type: string
 *                referrerId:
 *                  type: string
 *     description: user verify login with wallet
 *     responses:
 *       200:
 *         description: login with address success.
 *       422:
 *         description: Invalid request.
 */
authRouter.post("/login", auth_1.authenticateAPIKey, async (req, res) => {
    try {
        const { signature, publicAddress, message } = req.body;
        const schema = joi_1.default.object({
            signature: joi_1.default.string().required(),
            publicAddress: joi_1.default.string().required(),
            message: joi_1.default.string().required(),
        });
        let { error } = schema.validate({
            signature,
            publicAddress,
            message,
        });
        if (error !== undefined) {
            res.status(422).json({
                message: "Invalid request",
                data: req.query,
                error,
                success: false,
            });
            return;
        }
        if ((0, moment_1.default)().diff(moment_1.default.unix(Number(message) / 1000), "seconds") >= 60) {
            res.status(500).json({
                message: "Message expired.",
                success: false,
            });
            return;
        }
        const messageBytes = new TextEncoder().encode(message);
        const result = tweetnacl_1.default.sign.detached.verify(messageBytes, bs58_1.default.decode(signature), new web3_js_1.PublicKey(publicAddress).toBytes());
        if (!result) {
            res.status(500).json({
                message: "Invalid signature.",
                success: false,
            });
            return;
        }
        var user = await User_1.default.getByWalletAddress(publicAddress);
        let responseMessage = "Login Successful";
        if (!user) {
            responseMessage = "Signup successful.";
            user = await User_1.default.create({
                walletAddress: publicAddress,
            });
        }
        if (user.token != null) {
            res.status(201).json({
                success: true,
                message: responseMessage,
                id: user?.id,
                publicAddress: publicAddress,
                authToken: user.token,
                firstTime: responseMessage === "Signup successful.",
            });
            return;
        }
        else {
            user.generatetoken(async (err, token) => {
                await User_2.UserModel.updateOne({ _id: user?._id }, { $set: { token: token } });
                res.status(201).json({
                    success: true,
                    message: responseMessage,
                    id: user?.id,
                    publicAddress: publicAddress,
                    authToken: token,
                    firstTime: responseMessage === "Signup successful.",
                });
                return;
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: error.toString() });
    }
});
authRouter.post("/logout", auth_1.authenticatetoken, async (req, res) => {
    try {
        if (req.user) {
            await User_2.UserModel.updateOne({ _id: req.user._id }, {
                $unset: {
                    token: 1,
                },
            }, {
                new: true,
            });
            res
                .clearCookie("x_auth")
                .status(200)
                .send({ message: "Logged out user" });
        }
    }
    catch (error) {
        res.status(400).send({ message: "Couldnt log out" });
    }
});
exports.default = authRouter;
