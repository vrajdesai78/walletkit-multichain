"use client";

import { WalletKit, IWalletKit } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
import { WALLET_METADATA } from "@/constants";
import {
  generatePrivateKey,
  privateKeyToAccount,
  privateKeyToAddress,
} from "viem/accounts";
import {
  Account,
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  decodeFunctionResult,
  erc20Abi,
  formatUnits,
  http,
  WalletClient,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { encodedTransaction, Transaction } from "@/types";

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

export async function getBalance(): Promise<string> {
  const publicClient = createPublicClient({
    transport: http(),
    chain: sepolia,
  });

  const balance = await publicClient.getBalance({
    address: getAddress() as `0x${string}`,
  });

  return formatUnits(balance, 18);
}

// Returns the wallet account from the private key
export function getWalletAccount(): Account {
  return privateKeyToAccount(privateKey);
}

export function decodeTransaction(
  transaction: encodedTransaction
): Transaction {
  const functionCall = decodeFunctionData({
    abi: erc20Abi,
    data: transaction.data as `0x${string}`,
  });

  return {
    to: functionCall.args[0] as `0x${string}`,
    amount: functionCall.args[1] as bigint,
  };
}

export const estimateGas = async (transaction: encodedTransaction) => {
  const publicClient = createPublicClient({
    transport: http(),
    chain: sepolia,
  });
  const gas = await publicClient.estimateGas({
    to: transaction.to as `0x${string}`,
    data: transaction.data as `0x${string}`,
    account: getWalletAccount(),
  });
  return gas;
};

export const getUsdcBalance = async () => {
  const publicClient = createPublicClient({
    transport: http(),
    chain: sepolia,
  });

  const usdcBalance = await publicClient.readContract({
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [getAddress() as `0x${string}`],
  });

  return Number(formatUnits(usdcBalance, 6)).toFixed(2);
};

// Returns the wallet client which can be used to perform operations with the wallet
export function getWalletClient(): WalletClient {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: http(),
    chain: sepolia,
  });
}
