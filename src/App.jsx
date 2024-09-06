import './App.css';
import { useState } from 'react';
import { TokenLaunchpad } from './components/TokenLaunchpad';
import { TokenSwap } from './components/TokenSwap';

// wallet adapter imports
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const [createdToken, setCreatedToken] = useState(null);

  // Callback function to handle token creation
  const handleTokenCreation = (tokenMintAddress) => {
    setCreatedToken(tokenMintAddress); // Set the created token's mint address
  };

  return (
    <div style={{ width: "100vw" }}>
      <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 20
            }}>
              <WalletMultiButton />
              <WalletDisconnectButton />
            </div>
            {/* Conditionally render TokenLaunchpad or TokenSwap */}
            {!createdToken ? (
              <TokenLaunchpad onTokenCreated={handleTokenCreation} />
            ) : (
              <TokenSwap inputToken={createdToken} />
            )}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;
