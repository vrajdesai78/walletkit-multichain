"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWalletStore } from "@/store/wallet";
import { DialogType } from "@/types";
import { privateKey, walletClient } from "@/utils/helpers";
import { walletkit } from "@/utils/WalletConnectUtils";
import { ProposalTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { hexToString } from "viem";
import { privateKeyToAddress } from "viem/accounts";

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DialogType;
}

export default function ConnectionDialog({
  open,
  onOpenChange,
  type,
}: ApproveDialogProps) {
  const { data, addSession, removeSession } = useWalletStore();

  const onSessionProposal = async () => {
    try {
      const address = privateKeyToAddress(privateKey);

      // ------- namespaces builder util ------------ //
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: data.proposal?.params as ProposalTypes.Struct,
        supportedNamespaces: {
          eip155: {
            chains: ["eip155:1", "eip155:137"],
            methods: ["eth_sendTransaction", "personal_sign"],
            events: ["accountsChanged", "chainChanged"],
            accounts: [`eip155:1:${address}`, `eip155:137:${address}`],
          },
        },
      });
      // ------- end namespaces builder util ------------ //
      const session = await walletkit.approveSession({
        id: data.proposal?.id as number,
        namespaces: approvedNamespaces,
      });

      console.log("Session approved: ", session);
      addSession(session);
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving session: ", error);
      await walletkit.rejectSession({
        id: data.proposal?.id as number,
        reason: getSdkError("USER_REJECTED"),
      });
    }
  };

  const onRejectSession = async () => {
    await walletkit.rejectSession({
      id: data.proposal?.id as number,
      reason: getSdkError("USER_REJECTED"),
    });
  };

  const onSessionRequest = async () => {
    try {
      const client = walletClient();
      const requestParamsMessage =
        data.requestEvent?.params?.request?.params[0];

      const message = hexToString(requestParamsMessage);

      console.log("Message: ", message);

      const sign = await client.signMessage({ message });

      console.log("Signature ", sign);

      await walletkit.respondSessionRequest({
        topic: data.requestEvent?.topic as string,
        response: {
          id: data.requestEvent?.id as number,
          result: sign,
          jsonrpc: "2.0",
        },
      });
      onOpenChange(false);
      console.log("Session request responded");
    } catch (error) {
      console.error("Error responding to session request: ", error);
    }
  };

  const onRejectSessionRequest = async () => {
    console.log("Rejected session request");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {type === "proposal" ? "Approve Connection" : "Sign Message"}
          </DialogTitle>
          <DialogDescription>
            {type === "proposal"
              ? "Do you want to approve this connection request?"
              : `Sign the message: ${
                  data?.requestEvent &&
                  hexToString(data?.requestEvent?.params?.request?.params[0])
                }`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex gap-2'>
          <Button
            variant='destructive'
            type='button'
            onClick={() => {
              type === "proposal"
                ? onRejectSession()
                : onRejectSessionRequest();
            }}
          >
            Reject
          </Button>
          <Button
            type='submit'
            onClick={() => {
              type === "proposal" ? onSessionProposal() : onSessionRequest();
            }}
          >
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
