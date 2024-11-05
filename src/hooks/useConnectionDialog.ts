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
import { DialogType } from "../types";

export function useConnectionDialog(
  type: DialogType,
  onOpenChange: (open: boolean) => void
) {
  const { data, addSession } = useWalletStore();
  const walletKit = getWalletKit();

  const handleProposal = useCallback(async () => {
    try {
      const address = getAddress();
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

      const session = await walletKit.approveSession({
        id: data.proposal?.id as number,
        namespaces: approvedNamespaces,
      });

      addSession(session);
      onOpenChange(false);
    } catch (error) {
      console.error("Error approving session:", error);
      await handleReject();
    }
  }, [data.proposal, walletKit, addSession, onOpenChange]);

  const handleRequest = useCallback(async () => {
    try {
      const client = getWalletClient();
      const requestParamsMessage =
        data.requestEvent?.params?.request?.params[0];
      const message = hexToString(requestParamsMessage);

      const signature = await client.signMessage({
        message,
        account: getWalletAccount(),
      });

      await walletKit.respondSessionRequest({
        topic: data.requestEvent?.topic as string,
        response: {
          id: data.requestEvent?.id as number,
          result: signature,
          jsonrpc: "2.0",
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error responding to session request:", error);
    }
  }, [data.requestEvent, walletKit, onOpenChange]);

  const handleReject = useCallback(async () => {
    try {
      if (type === "proposal") {
        await walletKit.rejectSession({
          id: data.proposal?.id as number,
          reason: getSdkError("USER_REJECTED"),
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting session:", error);
    }
  }, [type, data.proposal, walletKit, onOpenChange]);

  const getMessage = useCallback(() => {
    if (type === "request" && data.requestEvent) {
      return hexToString(data.requestEvent?.params?.request?.params[0]);
    }
    return "";
  }, [type, data.requestEvent]);

  return {
    handleAccept: type === "proposal" ? handleProposal : handleRequest,
    handleReject,
    getMessage,
  };
}
