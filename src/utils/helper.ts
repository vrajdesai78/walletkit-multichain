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

export async function initializeWallet() {
  const core = new Core({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com",
  });

  walletKit = await WalletKit.init({
    core,
    metadata: WALLET_METADATA,
  });

  const envKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
  if (envKey && envKey.startsWith("0x") && envKey.length === 66) {
    privateKey = envKey as `0x${string}`;
  }

  await setClientId();
  return walletKit;
}

async function setClientId() {
  try {
    const clientId =
      await walletKit?.engine.signClient.core.crypto.getClientId();
    if (clientId) {
      localStorage.setItem("WALLETCONNECT_CLIENT_ID", clientId);
    }
  } catch (error) {
    console.error("Failed to set WalletConnect clientId:", error);
  }
}

export function getWalletKit(): IWalletKit {
  if (!walletKit) {
    throw new Error("WalletKit not initialized");
  }
  return walletKit;
}

export function getAddress(): string {
  return privateKeyToAddress(privateKey);
}

export function getWalletAccount(): Account {
  return privateKeyToAccount(privateKey);
}

export function getWalletClient(): WalletClient {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: http(),
    chain: mainnet,
  });
}
