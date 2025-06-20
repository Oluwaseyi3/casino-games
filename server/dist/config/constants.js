"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANAGER_WALLET_ADDRESS = exports.MANAGER_KEYPAIR = exports.MANAGER_WALLET_PRIVATE_KEY = exports.SERVER_API_KEY = exports.LOGIN_SECRET = exports.SOL_DECIMALS = exports.SOL_MINT = exports.PAYOUT_TOKEN = exports.STAKING_TOKEN = exports.provider = exports.wallet = exports.rpcConnection = exports.SOLANA_WS_URL = exports.SOLANA_RPC_URL = exports.cluster = exports.REDIS_URL = exports.MONGO_URI = void 0;
const dotenv_1 = require("dotenv");
const anchor_1 = require("@coral-xyz/anchor");
const nodewallet_1 = __importDefault(require("@coral-xyz/anchor/dist/cjs/nodewallet"));
const web3_js_1 = require("@solana/web3.js");
const bytes_1 = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
(0, dotenv_1.config)();
exports.MONGO_URI = process.env.MONGO_TEST_URI || "";
exports.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
exports.cluster = "devnet";
exports.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
exports.SOLANA_WS_URL = process.env.SOLANA_WS_URL || "wss://api.mainnet-beta.solana.com";
exports.rpcConnection = new web3_js_1.Connection(exports.SOLANA_RPC_URL, "confirmed");
exports.wallet = new nodewallet_1.default(new web3_js_1.Keypair()); //note this is not used
exports.provider = new anchor_1.AnchorProvider(exports.rpcConnection, exports.wallet, {
    commitment: "finalized",
});
exports.STAKING_TOKEN = {
    name: "Cash Token",
    symbol: "CASH",
    decimals: 9,
    mint: "A7DRJdbf6zwjY3wwmecUpiGHqvzcWjcLsJWGe52rj7WL", // Replace with actual mint address
};
exports.PAYOUT_TOKEN = {
    name: "Cash Token",
    symbol: "CASH",
    decimals: 9,
    mint: "A7DRJdbf6zwjY3wwmecUpiGHqvzcWjcLsJWGe52rj7WL", // Replace with actual mint address
};
exports.SOL_MINT = "So11111111111111111111111111111111111111112";
exports.SOL_DECIMALS = 9;
exports.LOGIN_SECRET = process.env.LOGIN_SECRET || "login-secret";
exports.SERVER_API_KEY = process.env.SERVER_API_KEY || "server-key";
exports.MANAGER_WALLET_PRIVATE_KEY = process.env.MANAGER_WALLET_PRIVATE_KEY || "manager-wallet-private-key";
exports.MANAGER_KEYPAIR = web3_js_1.Keypair.fromSecretKey(new Uint8Array(bytes_1.bs58.decode(exports.MANAGER_WALLET_PRIVATE_KEY)));
exports.MANAGER_WALLET_ADDRESS = exports.MANAGER_KEYPAIR.publicKey.toString();
console.log(exports.REDIS_URL, exports.MONGO_URI);
