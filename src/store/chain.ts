import { create } from "zustand";
import { TChain } from "@/types";

export interface ChainState {
  chain: TChain;
  setChain: (chain: TChain) => void;
}

export const useChainStore = create<ChainState>((set) => ({
  chain: "sepolia",
  setChain: (chain) => set({ chain }),
}));
