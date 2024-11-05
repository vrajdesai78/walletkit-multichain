import { useCallback, useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { getWalletKit } from "@/utils/helper";
import { SignClientTypes } from "@walletconnect/types";

export function useWalletConnect() {
  const { setData } = useWalletStore();
  const walletKit = getWalletKit();

  const onSessionProposal = useCallback(
    (proposal: SignClientTypes.EventArguments["session_proposal"]) => {
      setData({ proposal });
    },
    [setData]
  );

  const onSessionRequest = useCallback(
    (request: SignClientTypes.EventArguments["session_request"]) => {
      setData({ requestEvent: request });
    },
    [setData]
  );

  useEffect(() => {
    if (walletKit) {
      walletKit.on("session_proposal", onSessionProposal);
      walletKit.on("session_request", onSessionRequest);

      return () => {
        walletKit.off("session_proposal", onSessionProposal);
        walletKit.off("session_request", onSessionRequest);
      };
    }
  }, [walletKit, onSessionProposal, onSessionRequest]);

  return { walletKit };
}
