import { WalletKit, IWalletKit } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
import { WALLET_METADATA } from "@/constants";
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";
import { Account, createWalletClient, http, WalletClient } from "viem";
import { mainnet } from "viem/chains";

let walletKit: IWalletKit | null = null;
let privateKey: `0x${string}` = generatePrivateKey();

// Called when the app is initialized
export async function initializeWallet() {
  try {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    });

    // Initialize the walletkit
    walletKit = await WalletKit.init({
      core,
      metadata: WALLET_METADATA,
    });

    // Set the private key from the environment variable if it exists
    const envKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    if (envKey && envKey.startsWith("0x") && envKey.length === 66) {
      privateKey = envKey as `0x${string}`;
    }

    return walletKit;
  } catch (error) {
    console.error("Failed to initialize wallet:", error);
  }
}

// Returns the walletkit instance
export function getWalletKit(): IWalletKit {
  if (!walletKit) {
    throw new Error("WalletKit not initialized");
  }
  return walletKit;
}

// Returns the address from the private key
export function getAddress(): string {
  return privateKeyToAddress(privateKey);
}

// Returns the wallet account from the private key
export function getWalletAccount(): Account {
  return privateKeyToAccount(privateKey);
}

// Returns the wallet client which can be used to perform operations with the wallet
export function getWalletClient(): WalletClient {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: http(),
    chain: mainnet,
  });
}
