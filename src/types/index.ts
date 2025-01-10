import { SessionTypes, SignClientTypes } from "@walletconnect/types";

export interface ModalData {
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

export type DialogType = "proposal" | "request" | "sendTransaction";

export type Transaction = {
  amount: bigint;
  to: string;
};

export type encodedTransaction = {
  to: string;
  from: string;
  data: string;
};

export type TChain =
  | "sepolia"
  | "base-sepolia"
  | "solana-devnet"
  | "polkadot-westend";
