"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaService = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const pinoLogger_1 = require("./logger/pinoLogger");
class SolanaService {
    constructor(rpcUrl) {
        this.connection = new web3_js_1.Connection(rpcUrl, "confirmed");
        console.log(rpcUrl);
    }
    async verifyTokenTransfer(txHash, expectedTokenMint, expectedRecipient, expectedAmount) {
        try {
            const transaction = await this.connection.getTransaction(txHash, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
            });
            console.log(expectedRecipient, expectedAmount);
            console.log(transaction);
            if (!transaction) {
                pinoLogger_1.consoleLogger.info(`Transaction ${txHash} not found or not confirmed`);
                return false;
            }
            if (!transaction.meta?.postTokenBalances ||
                !transaction.meta?.preTokenBalances) {
                pinoLogger_1.consoleLogger.info(`Transaction ${txHash} does not contain token balance information`);
                return false;
            }
            const tokenMintPubkey = new web3_js_1.PublicKey(expectedTokenMint);
            const recipientPubkey = new web3_js_1.PublicKey(expectedRecipient);
            console.log();
            for (let i = 0; i < transaction.meta.postTokenBalances.length; i++) {
                const postBalance = transaction.meta.postTokenBalances[i];
                const preBalance = transaction.meta.preTokenBalances.find((balance) => balance.accountIndex === postBalance.accountIndex);
                if (postBalance?.mint === expectedTokenMint &&
                    postBalance?.owner === expectedRecipient) {
                    const balanceChange = (postBalance.uiTokenAmount?.uiAmount || 0) -
                        (preBalance?.uiTokenAmount?.uiAmount || 0);
                    if (balanceChange >= expectedAmount) {
                        pinoLogger_1.consoleLogger.info(`Token transfer verified: ${balanceChange} tokens sent to ${expectedRecipient}`);
                        return true;
                    }
                }
            }
            pinoLogger_1.consoleLogger.info(`Token transfer verification failed for transaction ${txHash}`);
            return false;
        }
        catch (error) {
            pinoLogger_1.consoleLogger.error(`Error verifying token transfer: ${error}`);
            return false;
        }
    }
    async initiateTokenPayout(amount, recipientAddress, tokenMintAddress, payerKeypair) {
        try {
            const tokenMint = new web3_js_1.PublicKey(tokenMintAddress);
            const recipient = new web3_js_1.PublicKey(recipientAddress);
            const payer = payerKeypair.publicKey;
            const payerTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint, payer, undefined, spl_token_1.TOKEN_2022_PROGRAM_ID);
            const recipientTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint, recipient, undefined, spl_token_1.TOKEN_2022_PROGRAM_ID);
            const tokenAccountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
            const transaction = new web3_js_1.Transaction();
            if (!tokenAccountInfo) {
                transaction.add((0, spl_token_1.createAssociatedTokenAccountInstruction)(payer, recipientTokenAccount, recipient, tokenMint, spl_token_1.TOKEN_2022_PROGRAM_ID));
            }
            const transferInstruction = (0, spl_token_1.createTransferInstruction)(payerTokenAccount, recipientTokenAccount, payer, amount, undefined, spl_token_1.TOKEN_2022_PROGRAM_ID);
            transaction.add(transferInstruction);
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [payerKeypair], { commitment: "confirmed" });
            pinoLogger_1.consoleLogger.info(`Token payout successful. Transaction signature: ${signature}`);
            return signature;
        }
        catch (error) {
            console.log(error);
            pinoLogger_1.consoleLogger.error(`Error initiating token payout: ${error}`);
            return null;
        }
    }
}
exports.SolanaService = SolanaService;
