import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

export const createWalletConnectModal = () => {
  // 1. Get projectId
  const projectId =
    import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
    "c288706f0aafdf214e8c6890fae4cdb9";

  // 2. Set chains
  const mainnet_config = {
    chainId: 1,
    name: "Ethereum",
    currency: "ETH",
    explorerUrl: "https://etherscan.io",
    rpcUrl: "https://cloudflare-eth.com",
  };

  // 3. Create a metadata object
  const metadata = {
    name: "TMA Proof of Concept",
    description: "Telegram Mini App Wallet Proof of Concept",
    url: "https://softstack.github.io/telegram-mini-app/", // origin must match your domain & subdomain
    icons: [""],
  };

  // 4. Create Ethers config
  const ethersConfig = defaultConfig({
    /*Required*/
    metadata,

    /*Optional*/
    enableEIP6963: true, // true by default
    enableInjected: true, // true by default
    enableCoinbase: true, // true by default
    rpcUrl: "...", // used for the Coinbase SDK
    defaultChainId: 1, // used for the Coinbase SDK
  });

  // 5. Create a Web3Modal instance
  createWeb3Modal({
    ethersConfig,
    chains: [mainnet_config],
    projectId,
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
    featuredWalletIds: [
      "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4", // Bitget Wallet project ID
    ],
  });
};
