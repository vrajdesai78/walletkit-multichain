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
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { formatBalance, u8aToHex } from "@polkadot/util";
import { useChainStore } from "@/store/chain";
import { sepolia, baseSepolia } from "viem/chains";
import type { AccountInfo } from "@polkadot/types/interfaces";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { SignerPayloadJSON } from "@polkadot/types/types";
import { TypeRegistry } from "@polkadot/types";

let walletKit: IWalletKit | null = null;
let privateKey: `0x${string}` = generatePrivateKey();

// Add new constants
const CHAIN_RPC = {
  "solana-devnet": "https://api.devnet.solana.com",
  "polkadot-westend": "wss://westend-rpc.polkadot.io",
} as const;

const USDC_ADDRESSES = {
  sepolia: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "solana-devnet": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
} as const;

// Create reusable functions for common operations
const getSeedPhrase = (): string => {
  const seedPhrase = process.env.NEXT_PUBLIC_SEED_PHRASE;
  if (!seedPhrase) {
    console.error("Seed phrase not found");
    throw new Error("Seed phrase not found");
  }
  return seedPhrase;
};

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
    console.error("WalletKit not initialized");
  }
  return walletKit as IWalletKit;
}

export function getSolanaKeypair(): Keypair {
  const seedPhrase = process.env.NEXT_PUBLIC_SEED_PHRASE!;
  if (!seedPhrase) {
    console.error("Seed phrase not found");
  }
  const seed = Uint8Array.from(Buffer.from(seedPhrase.replace(/ /g, ""))).slice(
    0,
    32
  );
  return Keypair.fromSeed(seed);
}

// Modify getAddress to use getSeedPhrase
export function getAddress(type: "evm" | "solana" | "polkadot"): string {
  const seedPhrase = getSeedPhrase();

  switch (type) {
    case "solana":
      return getSolanaKeypair().publicKey.toBase58();
    case "polkadot":
      return new Keyring({ type: "sr25519" }).addFromMnemonic(seedPhrase)
        .address;
    default:
      return mnemonicToAccount(seedPhrase).address;
  }
}

// Create reusable client creators
const createEvmPublicClient = (chain: "sepolia" | "base-sepolia") =>
  createPublicClient({
    transport: http(),
    chain: chain === "sepolia" ? sepolia : baseSepolia,
  });

// Modify getBalance to use the new client creator
export async function getBalance(): Promise<string> {
  const chain = useChainStore.getState().chain;

  try {
    switch (chain) {
      case "sepolia":
      case "base-sepolia": {
        const publicClient = createEvmPublicClient(chain);
        const balance = await publicClient.getBalance({
          address: getAddress("evm") as `0x${string}`,
        });
        return formatUnits(balance, 18);
      }

      case "solana-devnet": {
        const connection = new Connection(CHAIN_RPC["solana-devnet"]);
        const solBalance = await connection.getBalance(
          new PublicKey(getAddress("solana"))
        );
        return (solBalance / LAMPORTS_PER_SOL).toString();
      }

      case "polkadot-westend":
        let api: ApiPromise | null = null;
        try {
          const wsProvider = new WsProvider(CHAIN_RPC["polkadot-westend"]);
          api = await ApiPromise.create({ provider: wsProvider });
          const accountInfo = (await api.query.system.account(
            getAddress("polkadot")
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

// Modify getUsdcBalance to use constants and client creators
export const getUsdcBalance = async () => {
  const chain = useChainStore.getState().chain;

  try {
    switch (chain) {
      case "sepolia":
      case "base-sepolia": {
        const publicClient = createEvmPublicClient(chain);
        const usdcBalance = await publicClient.readContract({
          address: USDC_ADDRESSES[chain],
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [getAddress("evm") as `0x${string}`],
        });
        return Number(formatUnits(usdcBalance, 6)).toFixed(2);
      }

      case "solana-devnet": {
        const connection = new Connection(CHAIN_RPC["solana-devnet"]);
        const usdcMint = new PublicKey(USDC_ADDRESSES[chain]);
        const address = getAddress("solana");
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

export async function signSolanaMessage(message: string): Promise<string> {
  const seedPhrase = process.env.NEXT_PUBLIC_SEED_PHRASE!;
  if (!seedPhrase) {
    console.error("Seed phrase not found");
  }

  const keypair = getSolanaKeypair();

  console.log("keypair", keypair.publicKey.toBase58());

  // Sign the message
  const signature = nacl.sign.detached(bs58.decode(message), keypair.secretKey);

  return bs58.encode(signature);
}

export async function signSolanaTransaction(
  transactionBase58: string
): Promise<{
  transaction: string;
  signature: string;
}> {
  try {
    const keypair = getSolanaKeypair();

    // Deserialize the transaction - handle both base58 and base64 formats
    let transactionBytes: Uint8Array;
    try {
      transactionBytes = bs58.decode(transactionBase58);
    } catch {
      transactionBytes = Buffer.from(transactionBase58, "base64");
    }

    // Deserialize as a VersionedTransaction
    const deserializedTx = VersionedTransaction.deserialize(transactionBytes);

    // Sign the transaction
    deserializedTx.sign([keypair]);

    // Get the signature and serialize the transaction to base64
    const signature = bs58.encode(deserializedTx.signatures[0]);
    const serializedTx = Buffer.from(deserializedTx.serialize()).toString(
      "base64"
    );

    return {
      transaction: serializedTx,
      signature: signature,
    };
  } catch (error) {
    console.error("Error signing Solana transaction:", error);
    throw error;
  }
}

export const getPolkadotKeypair = () => {
  const seedPhrase = process.env.NEXT_PUBLIC_SEED_PHRASE!;
  if (!seedPhrase) {
    console.error("Seed phrase not found");
  }
  const keyring = new Keyring({ type: "sr25519" });
  const pair = keyring.addFromMnemonic(seedPhrase);
  return pair;
};

export const signPolkadotMessage = async (message: string) => {
  const keypair = getPolkadotKeypair();

  return {
    signature: u8aToHex(keypair.sign(message)),
  };
};

export const signPolkadotTransaction = async (
  transaction: SignerPayloadJSON
) => {
  const keypair = getPolkadotKeypair();
  const registry = new TypeRegistry();
  const txPayload = registry.createType("ExtrinsicPayload", transaction, {
    version: transaction.version,
  });

  const { signature } = txPayload.sign(keypair);
  return { signature };
};
