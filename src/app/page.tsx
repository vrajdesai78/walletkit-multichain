"use client";

import { useCallback, useEffect, useState } from "react";
import { walletkit } from "@/utils/WalletConnectUtils";
import { SignClientTypes } from "@walletconnect/types";
import ConnectionDialog from "@/components/ConnectionDialog";
import { useWalletStore } from "@/store/wallet";
import { getSdkError } from "@walletconnect/utils";

export default function Home() {
  const [uri, setUri] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const { setData, sessions, removeSession } = useWalletStore();
  const [proposalOpen, setProposalOpen] = useState<boolean>(false);

  const onSessionProposal = useCallback(
    async (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      setOpen(true);
      setData({ proposal });
    },
    []
  );

  const onSessionRequest = useCallback(
    async (request: SignClientTypes.EventArguments["session_request"]) => {
      setProposalOpen(true);
      setData({ requestEvent: request });
    },
    []
  );

  useEffect(() => {
    if (walletkit) {
      walletkit.on("session_proposal", onSessionProposal);
      walletkit.on("session_request", onSessionRequest);
    }
  }, [onSessionProposal, walletkit, onSessionRequest]);

  const handleConnect = async () => {
    await walletkit.pair({ uri });
  };

  const removeSessionHandler = (publicKey: string) => {
    walletkit.disconnectSession({
      topic: sessions.find((s) => s.peer?.publicKey === publicKey)
        ?.topic as string,
      reason: getSdkError("USER_DISCONNECTED"),
    });
    removeSession(publicKey);
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen gap-4'>
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
      <h1 className='text-2xl font-bold'>MiniWallet</h1>
      <input
        className='border border-gray-500 rounded-md p-2 min-w-[300px] bg-slate-300'
        type='text'
        placeholder='Enter Wallet Connect URI'
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button
        className='border border-gray-500 rounded-md p-2 min-w-[300px] bg-slate-300'
        onClick={handleConnect}
      >
        Connect
      </button>
      {sessions.map((session) => (
        <div
          key={session.peer?.publicKey}
          className='flex items-center justify-between gap-2'
        >
          {session.peer?.metadata?.name}
          <button
            className='border border-gray-500 rounded-md p-2 min-w-[300px] bg-slate-300'
            onClick={() => removeSessionHandler(session.peer?.publicKey)}
          >
            Disconnect
          </button>
        </div>
      ))}
    </div>
  );
}
