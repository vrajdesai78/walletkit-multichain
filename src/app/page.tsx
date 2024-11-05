"use client";

import { useEffect, useState } from "react";
import { WalletKit } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
// import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";

export default function Home() {
  const [uri, setUri] = useState<string>("");

  useEffect(() => {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    });
    const initializeWalletKit = async () => {
      const walletKit = await WalletKit.init({
        core,
        metadata: {
          name: "Vraj Wallet",
          description: "Demo of Vraj's Wallet",
          url: "https://reown.com/walletkit",
          icons: [],
        },
      });

      walletKit.on("session_proposal", (proposal) => {
        console.log("Session proposal:", proposal);
      });
    };

    initializeWalletKit();
  }, []);

  // const handleApproveSession = async () => {
  //   if (!sessionProposal || !client) return;

  //   try {
  //     const { id, params } = sessionProposal;
  //     const approvedNamespaces = buildApprovedNamespaces({
  //       proposal: params,
  //       supportedNamespaces: {
  //         eip155: {
  //           chains: ["eip155:1", "eip155:137"],
  //           methods: ["eth_sendTransaction", "personal_sign"],
  //           events: ["accountsChanged", "chainChanged"],
  //           accounts: [
  //             "eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  //             "eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb",
  //           ],
  //         },
  //       },
  //     });

  //     const session = await client.approveSession({
  //       id,
  //       namespaces: approvedNamespaces,
  //     });

  //     setSessionProposal(null);
  //     console.log("Session approved:", session);
  //   } catch (error) {
  //     console.error("Failed to approve session:", error);
  //   }
  // };

  // const handleRejectSession = async () => {
  //   if (!sessionProposal || !client) return;

  //   try {
  //     await client.rejectSession({
  //       id: sessionProposal.id,
  //       reason: getSdkError("USER_REJECTED"),
  //     });
  //     setSessionProposal(null);
  //   } catch (error) {
  //     console.error("Failed to reject session:", error);
  //   }
  // };

  const handleConnect = async () => {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    });
    const walletKit = await WalletKit.init({
      core,
      metadata: {
        name: "Vraj Wallet",
        description: "Demo of Vraj's Wallet",
        url: "https://reown.com/walletkit",
        icons: ["https://reown.com/walletkit/icon.png"],
      },
    });
    await walletKit.pair({ uri });
  };

  return (
    <div className='flex flex-col items-center justify-center h-screen gap-4'>
      <h1 className='text-2xl font-bold'>MiniWallet</h1>
      <input
        className='border border-gray-300 rounded-md p-2 min-w-[300px] bg-slate-800'
        type='text'
        placeholder='Enter Wallet Connect URI'
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button onClick={handleConnect}>Connect</button>
    </div>
  );
}
