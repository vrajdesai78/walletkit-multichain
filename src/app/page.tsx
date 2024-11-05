"use client";

import { useCallback, useEffect, useState } from "react";
import { SignClientTypes } from "@walletconnect/types";
import { ConnectionDialog } from "@/components/ConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { getSdkError } from "@walletconnect/utils";
import { getWalletKit } from "@/utils/helper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  // State management for WalletConnect URI and dialog controls
  const [uri, setUri] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [proposalOpen, setProposalOpen] = useState<boolean>(false);

  // Global wallet state management
  const { setData, activeSessions, setActiveSessions } = useWalletStore();

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
      setProposalOpen(true);
      setData({ requestEvent: request });
    },
    []
  );

  // Set up WalletConnect event listeners
  useEffect(() => {
    // Initialize active sessions
    setActiveSessions(walletkit.getActiveSessions());

    if (walletkit) {
      // Register event handlers for session lifecycle events
      walletkit.on("session_proposal", onSessionProposal);
      walletkit.on("session_request", onSessionRequest);
      walletkit.on("session_delete", () => {
        setActiveSessions(walletkit.getActiveSessions());
      });
    }
  }, [onSessionProposal, walletkit]);

  // Handler for initiating new connections
  const handleConnect = async () => {
    await walletkit.pair({ uri });
  };

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
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
          type='request'
        />

        {/* Header Section */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>CoolWallet</h1>
          <p className='text-gray-600'>
            Connect and manage your wallet sessions
          </p>
        </div>

        {/* Connection Input Section */}
        <div className='bg-white p-4 rounded-lg shadow-md mb-8'>
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
