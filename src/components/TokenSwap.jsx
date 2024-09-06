import React, { useState } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as RaydiumSdk from '@raydium-io/raydium-sdk';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

export function TokenSwap({ inputToken }) {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [outputToken, setOutputToken] = useState('');
    const [amount, setAmount] = useState('');

    // Function to swap tokens
    async function swapTokens() {
        try {
            // 1. Define the token mint addresses for input and output tokens
            const inputTokenMint = new PublicKey(inputToken);
            const outputTokenMint = new PublicKey(outputToken);

            // 2. Fetch the pool info from Raydium
            const poolKeys = await RaydiumSdk.Amm.fetchPoolKeys(connection, inputTokenMint, outputTokenMint);

            if (!poolKeys) {
                throw new Error('Pool not found!');
            }

            // 3. Calculate the swap amount based on the pool information
            const amountIn = parseFloat(amount);
            const amountOut = await RaydiumSdk.Amm.calculateAmountOut(
                connection,
                poolKeys,
                inputTokenMint,
                outputTokenMint,
                amountIn
            );

            if (!amountOut) {
                throw new Error('Failed to calculate swap amount!');
            }

            // 4. Prepare the transaction for the swap
            const transaction = new Transaction();

            const swapInstruction = await RaydiumSdk.Amm.makeSwapInstruction({
                connection,
                poolKeys,
                userSourceTokenAccount: wallet.publicKey, // User's source token account
                userDestinationTokenAccount: wallet.publicKey, // User's destination token account
                userTransferAuthority: wallet.publicKey, // The authority to transfer tokens
                amountIn: amountIn,
                amountOut: amountOut,
                user: wallet.publicKey,
            });

            transaction.add(swapInstruction);

            // 5. Send the transaction
            const signature = await wallet.sendTransaction(transaction, connection);

            await connection.confirmTransaction(signature, 'confirmed');

            console.log('Tokens Swapped');
            alert('Swap successful!');
        } catch (error) {
            console.error('Swap failed:', error);
            alert('Swap failed! Please check the console for more details.');
        }
    }

    return (
        <div>
            <div>
                <label>Input Token (Mint Address):</label>
                <input
                    type="text"
                    value={inputToken}
                    readOnly
                    placeholder="Input token address"
                />
            </div>
            <div>
                <label>Output Token (Mint Address):</label>
                <input
                    type="text"
                    value={outputToken}
                    onChange={(e) => setOutputToken(e.target.value)}
                    placeholder="Enter output token mint address"
                />
            </div>
            <div>
                <label>Amount to Swap:</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to swap"
                />
            </div>
            <button onClick={swapTokens}>Swap Tokens</button>
        </div>
    );
}