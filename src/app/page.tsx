"use client";

import { useCallback, useEffect, useState } from "react";
import { SignClientTypes } from "@walletconnect/types";
import { ConnectionDialog } from "@/components/ConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { getSdkError } from "@walletconnect/utils";
import {
  decodeTransaction,
  getAddress,
  getBalance,
  getUsdcBalance,
  getWalletKit,
} from "@/utils/helper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import toast from "react-hot-toast";

export default function Home() {
  // State management for WalletConnect URI and dialog controls
  const [uri, setUri] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [proposalOpen, setProposalOpen] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [usdcBalance, setUsdcBalance] = useState<string>("0");

  // Global wallet state management
  const { data, setData, activeSessions, setActiveSessions } = useWalletStore();

  // Get instance of walletkit
  const walletkit = getWalletKit();

  // Handler for incoming session proposals
  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      setOpen(true);
      setData({ proposal });
    },
    []
  );

  // Handler for incoming session requests
  const onSessionRequest = useCallback(
    async (request: SignClientTypes.EventArguments["session_request"]) => {
      try {
        const { method, params } = request.params.request;
        if (method === "eth_sendTransaction") {
          const transaction = decodeTransaction(params[0]);
          setProposalOpen(true);
          setData({ requestEvent: request, txnData: transaction });
        } else if (method === "personal_sign") {
          setProposalOpen(true);
          setData({ requestEvent: request });
        } else {
          throw new Error("Unsupported method");
        }
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  useEffect(() => {
    // Initialize active sessions
    setActiveSessions(walletkit.getActiveSessions());

    if (balance === "0") {
      getBalance().then((bal) => {
        setBalance(bal);
      });
    }

    if (usdcBalance === "0") {
      getUsdcBalance().then((bal) => {
        setUsdcBalance(bal);
      });
    }

    if (walletkit) {
      // Register event handlers for session lifecycle events
      walletkit.on("session_proposal", onSessionProposal);
      walletkit.on("session_request", onSessionRequest);
      walletkit.on("session_delete", () => {
        setActiveSessions(walletkit.getActiveSessions());
      });

      // Cleanup function to remove event listeners
      return () => {
        walletkit.off("session_proposal", onSessionProposal);
        walletkit.off("session_request", onSessionRequest);
        walletkit.off("session_delete", () => {
          setActiveSessions(walletkit.getActiveSessions());
        });
      };
    }
  }, [onSessionProposal, onSessionRequest, walletkit]);

  // Handler for initiating new connections
  const handleConnect = async () => {
    await walletkit.pair({ uri });
  };

  return (
    <div className='min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md mx-auto'>
        {/* Connection Dialogs */}
        <ConnectionDialog
          open={open}
          onOpenChange={() => setOpen(false)}
          type='proposal'
        />
        <ConnectionDialog
          open={proposalOpen}
          onOpenChange={() => setProposalOpen(false)}
          type={data?.txnData ? "sendTransaction" : "request"}
        />

        {/* Header Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>CoolWallet</h1>
          <p className='text-gray-600'>
            Connect and manage your wallet sessions
          </p>
        </div>

        {/* Combined Wallet Balance and Connection Section */}
        <div className='text-center mb-6'>
          {/* Main Balance Card */}
          <div className='bg-white p-6 rounded-lg shadow-sm mb-6'>
            {/* Wallet Address Section */}
            <div className='flex items-center justify-center gap-2 mb-4 bg-slate-100 p-1 rounded-lg w-fit mx-auto'>
              <div className='text-sm text-gray-500 font-mono'>
                {getAddress().slice(0, 6)}...{getAddress().slice(-4)}
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='p-0 h-auto'
                onClick={() => {
                  navigator.clipboard.writeText(getAddress());
                  toast.success("Address copied to clipboard");
                }}
              >
                <CopyIcon className='h-4 w-4' />
              </Button>
            </div>

            {/* ETH Balance Section */}
            <div className='text-4xl font-bold text-gray-900 mb-4'>
              {Number(balance).toFixed(4)} ETH
            </div>

            {/* Token List Section */}
            <div className='divide-y divide-gray-100'>
              <p className='text-sm text-gray-500 mb-2'>Tokens</p>
              <div className='flex items-center justify-between py-3'>
                <div className='flex items-center gap-2'>
                  <Image
                    src='https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                    alt='USDC'
                    width={32}
                    height={32}
                    className='rounded-full'
                    loader={({ src }) => src}
                  />
                  <span className='font-medium text-gray-900'>USDC</span>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-gray-900'>
                    {usdcBalance} USDC
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Input
              className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              type='text'
              placeholder='Enter WalletConnect URI'
              value={uri}
              onChange={(e) => setUri(e.target.value)}
            />
            <Button
              className='w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              onClick={handleConnect}
            >
              Connect
            </Button>
          </div>
        </div>

        {/* Sessions Grid */}
        {Object.keys(activeSessions).length > 0 && (
          <div className='bg-white rounded-lg shadow-md p-4'>
            <h2 className='text-xl font-semibold mb-4'>Active Sessions</h2>
            <div className='grid grid-cols-1 gap-4'>
              {Object.values(activeSessions).map((session) => (
                <div
                  key={session.peer?.publicKey}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='font-medium text-gray-900'>
                        {session.peer?.metadata?.name || "Unknown App"}
                      </h3>
                      <p className='text-sm text-gray-500 mt-1'>
                        {session.peer?.metadata?.url || "No URL provided"}
                      </p>
                    </div>
                    <button
                      className='text-red-600 hover:text-red-700 px-4 py-2 rounded-md border border-red-200 hover:bg-red-50 transition-colors'
                      onClick={() => {
                        walletkit?.disconnectSession({
                          topic: session.topic,
                          reason: getSdkError("USER_DISCONNECTED"),
                        });
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Sessions Message */}
        {Object.keys(activeSessions).length === 0 && (
          <div className='text-center py-12 bg-white rounded-lg shadow-md'>
            <p className='text-gray-600'>No active sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
