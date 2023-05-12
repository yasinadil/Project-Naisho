import React from "react";
import logo from "../Assets/logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { trustWallet } from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createClient, WagmiConfig } from "wagmi";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { mainnet } from "wagmi/chains";

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ProviderAPI }),
    publicProvider(),
  ]
);

const { wallets } = getDefaultWallets({
  appName: "Project Naisho 内緒",
  chains,
});

const demoAppInfo = {
  appName: "Project Naisho 内緒",
};

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: "Other",
    wallets: [trustWallet({ chains })],
  },
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

function Navbar() {
  return (
    <div className="desktop:py-6 laptop:py-6 mobile:py-2 bg-transparent navbarP">
      <div className="flex justify-between">
        <a href="/">
          <img className="" src={logo} alt="logo" style={{ width: "10rem" }} />
        </a>
        <div className="my-auto">
          <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider
              appInfo={demoAppInfo}
              chains={chains}
              theme={darkTheme({
                accentColor: "#20248E",
                accentColorForeground: "white",
                borderRadius: "small",
                fontStack: "system",
                overlayBlur: "small",
              })}
            >
              <ConnectButton className="" label="Connect Wallet" />
            </RainbowKitProvider>
          </WagmiConfig>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
