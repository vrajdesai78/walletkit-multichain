import { WalletKit, IWalletKit, } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
export let walletkit: IWalletKit;

export async function createWalletKit() {
  const core = new Core({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com",
  });
  walletkit = await WalletKit.init({
    core,
    metadata: {
      name: "MiniWallet",
      description: "MiniWallet to demo WalletKit",
      url: "https://walletconnect.com/",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });

  try {
    const clientId =
      await walletkit.engine.signClient.core.crypto.getClientId();
    console.log("WalletConnect ClientID: ", clientId);
    localStorage.setItem("WALLETCONNECT_CLIENT_ID", clientId);
  } catch (error) {
    console.error(
      "Failed to set WalletConnect clientId in localStorage: ",
      error
    );
  }
}
