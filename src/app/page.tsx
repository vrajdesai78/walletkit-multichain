"use client";

import { useCallback, useEffect, useState } from "react";
import { SignClientTypes } from "@walletconnect/types";
import { ConnectionDialog } from "@/components/ConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { decodeTransaction, getWalletKit } from "@/utils/helper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WalletDetails } from "@/components/WalletDetails";
import { SessionDetails } from "@/components/SessionDetails";

export default function Home() {
  const [dialogState, setDialogState] = useState({
    uri: "",
    proposalOpen: false,
    requestOpen: false,
  });

  const { data, setData, setActiveSessions } = useWalletStore();
  const walletkit = getWalletKit();

  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      setDialogState((prev) => ({ ...prev, proposalOpen: true }));
      setData({ proposal });
    },
    []
  );

  const onSessionRequest = useCallback(
    async (request: SignClientTypes.EventArguments["session_request"]) => {
      try {
        const { method, params } = request.params.request;
        if (method === "eth_sendTransaction") {
          const transaction = decodeTransaction(params[0]);
          setDialogState((prev) => ({ ...prev, requestOpen: true }));
          setData({ requestEvent: request, txnData: transaction });
        } else if (method === "personal_sign") {
          setDialogState((prev) => ({ ...prev, requestOpen: true }));
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
    setActiveSessions(walletkit.getActiveSessions());

    if (walletkit) {
      walletkit.on("session_proposal", onSessionProposal);
      walletkit.on("session_request", onSessionRequest);
      walletkit.on("session_delete", () => {
        setActiveSessions(walletkit.getActiveSessions());
      });

      return () => {
        walletkit.off("session_proposal", onSessionProposal);
        walletkit.off("session_request", onSessionRequest);
        walletkit.off("session_delete", () => {
          setActiveSessions(walletkit.getActiveSessions());
        });
      };
    }
  }, [onSessionProposal, onSessionRequest, walletkit]);

  const handleConnect = async () => {
    await walletkit.pair({ uri: dialogState.uri });
  };

  return (
    <div className='min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md mx-auto'>
        <ConnectionDialog
          open={dialogState.proposalOpen}
          onOpenChange={() =>
            setDialogState((prev) => ({ ...prev, proposalOpen: false }))
          }
          type='proposal'
        />
        <ConnectionDialog
          open={dialogState.requestOpen}
          onOpenChange={() =>
            setDialogState((prev) => ({ ...prev, requestOpen: false }))
          }
          type={data?.txnData ? "sendTransaction" : "request"}
        />

        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>Mini Wallet</h1>
        </div>

        <div className='text-center mb-6'>
          <WalletDetails />
          <div className='flex flex-col sm:flex-row gap-4 mt-4'>
            <Input
              className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              type='text'
              placeholder='Enter WalletConnect URI'
              value={dialogState.uri}
              onChange={(e) =>
                setDialogState((prev) => ({ ...prev, uri: e.target.value }))
              }
            />
            <Button
              className='w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              onClick={handleConnect}
            >
              Connect
            </Button>
          </div>
        </div>

        <SessionDetails />
      </div>
    </div>
  );
}
