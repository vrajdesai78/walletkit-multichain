export const SUPPORTED_CHAINS = ["eip155:11155111", "eip155:84532"];
export const SUPPORTED_METHODS = [
  "eth_sendTransaction",
  "personal_sign",
  "solana_signTransaction",
  "solana_signMessage",
  "polkadot_signTransaction",
  "polkadot_signMessage",
];
export const SUPPORTED_EVENTS = [
  "accountsChanged",
  "chainChanged",
  "accountChanged",
];

export const WALLET_METADATA = {
  name: "CoolWallet",
  description: "CoolWallet to showcase power of WalletKit",
  url: "https://reown.com/",
  icons: ["https://assets.reown.com/reown-profile-pic.png"],
};
