"use client";

import { WalletKit, IWalletKit } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
import { WALLET_METADATA } from "@/constants";
import {
  generatePrivateKey,
  mnemonicToAccount,
  privateKeyToAccount,
} from "viem/accounts";
import {
  Account,
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  WalletClient,
} from "viem";
import { encodedTransaction, Transaction } from "@/types";
import { Keypair } from "@solana/web3.js";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { formatBalance } from "@polkadot/util";
import { useChainStore } from "@/store/chain";
import { sepolia, baseSepolia } from "viem/chains";
import type { AccountInfo } from "@polkadot/types/interfaces";

let walletKit: IWalletKit | null = null;
let privateKey: `0x${string}` = generatePrivateKey();

// Called when the app is initialized
export async function initializeWallet() {
  try {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    });

    // Initialize Polkadot WASM
    await cryptoWaitReady();

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

export function getAddress(): string {
  const chain = useChainStore.getState().chain;
  const seedPhrase = process.env.NEXT_PUBLIC_SEED_PHRASE!;

  if (chain === "solana-devnet") {
    if (!seedPhrase) {
      throw new Error("Seed phrase not found");
    }
    const seed = Uint8Array.from(
      Buffer.from(seedPhrase.replace(/ /g, ""))
    ).slice(0, 32);
    const keypair = Keypair.fromSeed(seed);
    return keypair.publicKey.toBase58();
  }
  if (chain === "polkadot-westend") {
    if (!seedPhrase) {
      throw new Error("Seed phrase not found");
    }
    const keyring = new Keyring({ type: "sr25519" });
    const pair = keyring.addFromMnemonic(seedPhrase);
    return pair.address;
  }
  const seeds = seedPhrase?.split(" ");
  if (!seeds) {
    throw new Error("Seed phrase not found");
  }
  const account = mnemonicToAccount(seedPhrase);
  return account.address;
}

export async function getBalance(): Promise<string> {
  const chain = useChainStore.getState().chain;

  try {
    switch (chain) {
      case "sepolia":
      case "base-sepolia":
        const publicClient = createPublicClient({
          transport: http(),
          chain: chain === "sepolia" ? sepolia : baseSepolia,
        });
        const balance = await publicClient.getBalance({
          address: getAddress() as `0x${string}`,
        });
        return formatUnits(balance, 18);

      case "solana-devnet":
        const connection = new Connection("https://api.devnet.solana.com");
        try {
          const address = getAddress();
          const solBalance = await connection.getBalance(
            new PublicKey(address)
          );
          return (solBalance / LAMPORTS_PER_SOL).toString();
        } catch (solError) {
          console.error("Solana balance error:", solError);
          throw solError;
        }

      case "polkadot-westend":
        let api: ApiPromise | null = null;
        try {
          const wsProvider = new WsProvider("wss://westend-rpc.polkadot.io");
          api = await ApiPromise.create({ provider: wsProvider });
          const accountInfo = (await api.query.system.account(
            getAddress()
          )) as AccountInfo;
          const {
            data: { free, reserved },
          } = accountInfo;
          const total = free.add(reserved);
          return formatBalance(total, {
            withUnit: false,
            forceUnit: "-",
            decimals: api.registry.chainDecimals[0],
          });
        } finally {
          if (api) {
            await api.disconnect();
          }
        }

      default:
        return "0";
    }
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
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
  const chain = useChainStore.getState().chain;

  try {
    switch (chain) {
      case "sepolia":
      case "base-sepolia": {
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
      }

      case "solana-devnet": {
        const connection = new Connection("https://api.devnet.solana.com");
        const usdcMint = new PublicKey(
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
        ); // Devnet USDC mint
        const address = getAddress();
        const tokenAccount = await connection.getTokenAccountsByOwner(
          new PublicKey(address),
          {
            mint: usdcMint,
          }
        );

        if (tokenAccount.value.length === 0) return "0.00";

        const balance = await connection.getTokenAccountBalance(
          tokenAccount.value[0].pubkey
        );
        return Number(balance.value.uiAmount).toFixed(2);
      }

      case "polkadot-westend": {
        return "0.00";
      }

      default:
        return "0.00";
    }
  } catch (error) {
    console.error("Error fetching USDC balance:", error);
    return "0.00";
  }
};

// Returns the wallet client which can be used to perform operations with the wallet
export function getWalletClient(): WalletClient {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    transport: http(),
    chain: sepolia,
  });
}
