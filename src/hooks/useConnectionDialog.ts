import { useCallback } from "react";
import { useWalletStore } from "@/store/wallet";
import {
  getAddress,
  getWalletAccount,
  getWalletClient,
  getWalletKit,
} from "@/utils/helper";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { ProposalTypes } from "@walletconnect/types";
import { hexToString } from "viem";
import { DialogType } from "@/types";
import toast from "react-hot-toast";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_EVENTS,
  SUPPORTED_METHODS,
} from "@/constants";

export function useConnectionDialog(
  type: DialogType,
  onOpenChange: (open: boolean) => void
) {
  const { data, setActiveSessions } = useWalletStore();
  const walletKit = getWalletKit();

  const getMessage = useCallback(() => {
    if (type === "request" && data.requestEvent) {
      return hexToString(data.requestEvent?.params?.request?.params[0]);
    }
    return "";
  }, [type, data.requestEvent]);

  // Called when the user approves the connection proposal
  const handleApproveProposal = useCallback(async () => {
    try {
      const address = getAddress();
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: data.proposal?.params as ProposalTypes.Struct,
        supportedNamespaces: {
          eip155: {
            chains: SUPPORTED_CHAINS,
            methods: SUPPORTED_METHODS,
            events: SUPPORTED_EVENTS,
            accounts: [`eip155:1:${address}`, `eip155:137:${address}`],
          },
        },
      });

      // Approve the session
      await walletKit.approveSession({
        id: data.proposal?.id as number,
        namespaces: approvedNamespaces,
      });
      // Update the active sessions after approval
      setActiveSessions(walletKit.getActiveSessions());
      toast.success("Session approved");
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving session:", error);
      await handleRejectProposal();
    }
  }, [data.proposal, walletKit, onOpenChange]);

  // Called when the user approves the sign request
  const handleApproveSignRequest = useCallback(async () => {
    try {
      const client = getWalletClient();

      // Get the message to sign
      const requestParamsMessage =
        data.requestEvent?.params?.request?.params[0];

      // Convert the message to a string
      const message = hexToString(requestParamsMessage);

      // Sign the message
      const signature = await client.signMessage({
        message,
        account: getWalletAccount(),
      });

      // Respond to the session request with the signature
      await walletKit.respondSessionRequest({
        topic: data.requestEvent?.topic as string,
        response: {
          id: data.requestEvent?.id as number,
          result: signature,
          jsonrpc: "2.0",
        },
      });
      onOpenChange(false);
      toast.success("Message signed successfully!");
    } catch (error) {
      console.error("Error responding to session request:", error);
      toast.error("Error signing message");
    }
  }, [data.requestEvent, walletKit, onOpenChange]);

  // Called when the user rejects the connection proposal
  const handleRejectProposal = useCallback(async () => {
    try {
      if (type === "proposal") {
        // Reject the session proposal with the user rejected reason
        await walletKit.rejectSession({
          id: data.proposal?.id as number,
          reason: getSdkError("USER_REJECTED"),
        });
        toast.success("Session rejected");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting session:", error);
      toast.error("Error rejecting session");
    }
  }, [type, data.proposal, walletKit, onOpenChange]);

  return {
    handleApproveProposal,
    handleApproveSignRequest,
    handleRejectProposal,
    getMessage,
  };
}
