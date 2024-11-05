"use client";

import { initializeWallet } from "@/utils/helper";
import { useCallback, useEffect, useState } from "react";

export const WalletWrapper = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);

  const onInitialize = useCallback(async () => {
    await initializeWallet();
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  return initialized ? children : <div>Loading...</div>;
};
