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
  sessions: SessionTypes.Struct[];
  addSession: (session: SessionTypes.Struct) => void;
  removeSession: (publicKey: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  data: {},
  setData: (data) => set({ data }),
  sessions: [],
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  removeSession: (publicKey) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.peer?.publicKey !== publicKey),
    })),
}));
