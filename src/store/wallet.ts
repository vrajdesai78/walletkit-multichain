import { SessionTypes, SignClientTypes } from "@walletconnect/types";
import { create } from "zustand";

interface ModalData {
  proposal?: SignClientTypes.EventArguments["session_proposal"];
  requestEvent?: SignClientTypes.EventArguments["session_request"];
  requestSession?: SessionTypes.Struct;
  loadingMessage?: string;
  authRequest?: SignClientTypes.EventArguments["session_authenticate"];
}

export interface WalletState {
  data: ModalData;
  setData: (data: ModalData) => void;
  activeSessions: Record<string, SessionTypes.Struct>;
  setActiveSessions: (sessions: Record<string, SessionTypes.Struct>) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  data: {},
  setData: (data) => set({ data }),
  activeSessions: {},
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),
}));
