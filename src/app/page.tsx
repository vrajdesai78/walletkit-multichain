"use client";

import { useCallback, useEffect, useState } from "react";
import { SignClientTypes } from "@walletconnect/types";
import { ConnectionDialog } from "@/components/ConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { getWalletKit } from "@/utils/helper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WalletDetails } from "@/components/WalletDetails";
import { SessionDetails } from "@/components/SessionDetails";
import { toast } from "react-hot-toast";

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
      console.log("proposal", proposal?.params);
      setDialogState((prev) => ({ ...prev, proposalOpen: true }));
      setData({ proposal });
    },
    []
  );

  const onSessionRequest = useCallback(
    async (request: SignClientTypes.EventArguments["session_request"]) => {
      try {
        const { method } = request.params.request;
        const methodConfig: Record<string, { txnType?: "send" }> = {
          eth_sendTransaction: { txnType: "send" },
          solana_signTransaction: { txnType: "send" },
          polkadot_signTransaction: { txnType: "send" },
          personal_sign: {},
          polkadot_signMessage: {},
          solana_signMessage: {},
        };

        if (method in methodConfig) {
          setDialogState((prev) => ({ ...prev, requestOpen: true }));
          setData({
            requestEvent: request,
            ...(methodConfig[method].txnType && {
              txnType: methodConfig[method].txnType,
            }),
          });
        } else {
          toast.error("Unsupported method");
        }
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  useEffect(() => {
    if (!walletkit) return;

    const handleSessionDelete = () => {
      setActiveSessions(walletkit.getActiveSessions());
    };

    setActiveSessions(walletkit.getActiveSessions());
    walletkit.on("session_proposal", onSessionProposal);
    walletkit.on("session_request", onSessionRequest);
    walletkit.on("session_delete", handleSessionDelete);

    return () => {
      walletkit.off("session_proposal", onSessionProposal);
      walletkit.off("session_request", onSessionRequest);
      walletkit.off("session_delete", handleSessionDelete);
    };
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
          type={data?.txnType === "send" ? "sendTransaction" : "request"}
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
