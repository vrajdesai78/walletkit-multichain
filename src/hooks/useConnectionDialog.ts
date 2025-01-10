import { useCallback } from "react";
import { useWalletStore } from "@/store/wallet";
import {
  estimateGas,
  getAddress,
  getWalletAccount,
  getWalletClient,
  getWalletKit,
  signPolkadotMessage,
  signPolkadotTransaction,
  signSolanaMessage,
  signSolanaTransaction,
} from "@/utils/helper";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { ProposalTypes } from "@walletconnect/types";
import { hexToString } from "viem";
import { DialogType, encodedTransaction } from "@/types";
import toast from "react-hot-toast";
import {
  SUPPORTED_CHAINS,
  SUPPORTED_EVENTS,
  SUPPORTED_METHODS,
} from "@/constants";
import { sepolia, baseSepolia } from "viem/chains";
import { QueryClient } from "@tanstack/react-query";

export function useConnectionDialog(
  type: DialogType,
  onOpenChange: (open: boolean) => void
) {
  const { data, setActiveSessions } = useWalletStore();
  const walletKit = getWalletKit();

  const getMessage = useCallback(() => {
    if (
      type === "request" &&
      data.requestEvent &&
      data.requestEvent.params?.request?.method === "personal_sign"
    ) {
      return hexToString(data.requestEvent?.params?.request?.params[0]);
    }
    if (
      type === "request" &&
      data.requestEvent &&
      data.requestEvent.params?.request?.method === "solana_signMessage"
    ) {
      const message = data.requestEvent?.params?.request?.params?.message;
      return message;
    }
    return "";
  }, [type, data.requestEvent]);

  // Called when the user approves the connection proposal
  const handleApproveProposal = useCallback(async () => {
    try {
      const evmAddress = getAddress("evm");
      const solanaAddress = getAddress("solana");
      const polkadotAddress = getAddress("polkadot");
      const approvedNamespaces = buildApprovedNamespaces({
        proposal: data.proposal?.params as ProposalTypes.Struct,
        supportedNamespaces: {
          eip155: {
            chains: SUPPORTED_CHAINS,
            methods: SUPPORTED_METHODS,
            events: SUPPORTED_EVENTS,
            accounts: [
              `eip155:${sepolia.id}:${evmAddress}`,
              `eip155:${baseSepolia.id}:${evmAddress}`,
            ],
          },
          solana: {
            chains: ["solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"],
            methods: [
              "solana_signTransaction",
              "solana_signMessage",
              "solana_signAndSendTransaction",
              "solana_signAllTransactions",
            ],
            events: SUPPORTED_EVENTS,
            accounts: [
              `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1:${solanaAddress}`,
            ],
          },
          polkadot: {
            chains: ["polkadot:e143f23803ac50e8f6f8e62695d1ce9e"],
            methods: ["polkadot_signTransaction", "polkadot_signMessage"],
            events: SUPPORTED_EVENTS,
            accounts: [
              `polkadot:e143f23803ac50e8f6f8e62695d1ce9e:${polkadotAddress}`,
            ],
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
      const method = data.requestEvent?.params?.request?.method;

      switch (method) {
        case "personal_sign": {
          const message = getMessage();
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
          toast.success("Message signed successfully!");
          break;
        }

        case "eth_sendTransaction": {
          const transaction = data.requestEvent?.params?.request
            ?.params[0] as encodedTransaction;
          const gas = await estimateGas(transaction);
          const txn = await client.sendTransaction({
            to: transaction.to as `0x${string}`,
            data: transaction.data as `0x${string}`,
            account: getWalletAccount(),
            gas: gas,
            chain: sepolia,
          });
          await walletKit.respondSessionRequest({
            topic: data.requestEvent?.topic as string,
            response: {
              id: data.requestEvent?.id as number,
              result: txn,
              jsonrpc: "2.0",
            },
          });
          toast.success("Transaction sent successfully!", { duration: 5000 });
          const queryClient = new QueryClient();
          queryClient.invalidateQueries({ queryKey: ["balances"] });
          break;
        }

        case "solana_signMessage": {
          const message = getMessage();
          const signature = await signSolanaMessage(message as string);
          await walletKit.respondSessionRequest({
            topic: data.requestEvent?.topic as string,
            response: {
              id: data.requestEvent?.id as number,
              result: { signature },
              jsonrpc: "2.0",
            },
          });
          toast.success("Solana message signed successfully!");
          break;
        }

        case "solana_signTransaction": {
          const transaction = await signSolanaTransaction(
            data.requestEvent?.params?.request?.params?.transaction
          );
          await walletKit.respondSessionRequest({
            topic: data.requestEvent?.topic as string,
            response: {
              id: data.requestEvent?.id as number,
              result: { signature: transaction.signature },
              jsonrpc: "2.0",
            },
          });
          toast.success("Solana transaction signed successfully!");
          break;
        }

        case "polkadot_signTransaction": {
          const signature = await signPolkadotTransaction(
            data?.requestEvent?.params?.request?.params?.transactionPayload
          );
          await walletKit.respondSessionRequest({
            topic: data.requestEvent?.topic as string,
            response: {
              id: data.requestEvent?.id as number,
              result: { signature: signature.signature },
              jsonrpc: "2.0",
            },
          });
          toast.success("Polkadot transaction signed successfully!");
          break;
        }

        case "polkadot_signMessage": {
          const signature = await signPolkadotMessage(
            data?.requestEvent?.params?.request?.params?.message
          );
          await walletKit.respondSessionRequest({
            topic: data.requestEvent?.topic as string,
            response: {
              id: data.requestEvent?.id as number,
              result: { signature: signature.signature },
              jsonrpc: "2.0",
            },
          });
          toast.success("Polkadot message signed successfully!");
          break;
        }

        default: {
          toast.error(`Unsupported method: ${method}`);
          console.error(`Unsupported method: ${method}`);
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error responding to session request:", error);
      toast.error("Error processing request");
    }
  }, [data.requestEvent, walletKit, onOpenChange]);

  // Called when the user rejects the connection proposal
  const handleRejectProposal = useCallback(async () => {
    try {
      // Reject the session proposal with the user rejected reason
      await walletKit.rejectSession({
        id: data.proposal?.id as number,
        reason: getSdkError("USER_REJECTED"),
      });
      toast.success("Session rejected");
      onOpenChange(false);
    } catch (error) {
      console.error("Error rejecting session:", error);
      toast.error("Error rejecting session");
    }
  }, [data.proposal, walletKit, onOpenChange]);

  const handleRejectRequest = useCallback(async () => {
    try {
      const response = {
        id: data.requestEvent?.id as number,
        jsonrpc: "2.0",
        error: {
          code: 5000,
          message: "User rejected.",
        },
      };

      await walletKit.respondSessionRequest({
        topic: data.requestEvent?.topic as string,
        response,
      });
      onOpenChange(false);
      toast.success("Request rejected");
    } catch (error) {
      console.error("Error rejecting a request:", error);
      toast.error("Error rejecting a request");
    }
  }, [data.requestEvent, walletKit, onOpenChange]);

  return {
    handleApproveProposal,
    handleApproveSignRequest,
    handleRejectProposal,
    handleRejectRequest,
    getMessage,
  };
}
