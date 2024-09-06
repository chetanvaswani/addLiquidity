import React, { useState } from 'react';
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
    MINT_SIZE, TOKEN_2022_PROGRAM_ID, createMintToInstruction, 
    createAssociatedTokenAccountInstruction, getMintLen, 
    createInitializeMintInstruction, getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { TokenSwap } from './TokenSwap';  // Import the TokenSwap component

export function TokenLaunchpad({ onTokenCreated }) {  // Add onTokenCreated as a prop
    const { connection } = useConnection();
    const wallet = useWallet();

    const [inputToken, setInputToken] = useState('');
    const [isTokenCreated, setIsTokenCreated] = useState(false);

    async function createToken() {
        try {
            const mintKeypair = Keypair.generate();
            const metadata = {
                mint: mintKeypair.publicKey,
                name: 'KIRA',
                symbol: 'KIR',
                uri: 'https://cdn.100xdevs.com/metadata.json',
                additionalMetadata: [],
            };

            const mintLen = MINT_SIZE;
            const metadataLen = pack(metadata).length;
            const totalLen = mintLen + metadataLen;

            const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

            // Create and initialize mint account
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
            );

            // Add metadata account initialization
            const [metadataAccount] = await PublicKey.findProgramAddress(
                [Buffer.from('metadata'), TOKEN_2022_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
                TOKEN_2022_PROGRAM_ID
            );

            transaction.add(
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: metadataAccount,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
            );

            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);

            await wallet.sendTransaction(transaction, connection);

            console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);

            // Create associated token account
            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );

            console.log(associatedToken.toBase58());

            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
            );

            await wallet.sendTransaction(transaction2, connection);

            // Mint tokens to the associated token account
            const transaction3 = new Transaction().add(
                createMintToInstruction(mintKeypair.publicKey, associatedToken, wallet.publicKey, 1000000000, [], TOKEN_2022_PROGRAM_ID)
            );

            await wallet.sendTransaction(transaction3, connection);

            console.log("Minted!");

            // Set inputToken state to the newly created token mint address
            const mintAddress = mintKeypair.publicKey.toBase58();
            setInputToken(mintAddress);
            setIsTokenCreated(true);

            // Call onTokenCreated callback to notify parent component
            if (onTokenCreated) {
                onTokenCreated(mintAddress);
            }
        } catch (error) {
            console.error('Token creation failed:', error);
            alert('Token creation failed! Please check the console for more details.');
        }
    }

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }}>
            <h1>Solana Token Launchpad</h1>
            <input className='inputText' type='text' placeholder='Name'></input> <br />
            <input className='inputText' type='text' placeholder='Symbol'></input> <br />
            <input className='inputText' type='text' placeholder='Image URL'></input> <br />
            <input className='inputText' type='text' placeholder='Initial Supply'></input> <br />
            <button onClick={createToken} className='btn'>Create a token</button>

            {isTokenCreated && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Token Created Successfully!</h2>
                    <p>Mint Address: {inputToken}</p>
                    <h3>Swap your token:</h3>
                    <TokenSwap inputToken={inputToken} />
                </div>
            )}
        </div>
    );
}
