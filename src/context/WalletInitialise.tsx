"use client";

import { createWalletKit } from "@/utils/WalletConnectUtils";
import { useCallback, useEffect, useState } from "react";

export const WalletInitialise = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [initialized, setInitialized] = useState(false);

  const onInitialize = useCallback(async () => {
    await createWalletKit();
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  return initialized ? children : <div>Loading...</div>;
};
