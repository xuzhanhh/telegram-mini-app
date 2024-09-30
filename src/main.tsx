import React from "react";
import ReactDOM from "react-dom/client";
import VConsole from "vconsole";

// Redux
import { Provider } from "react-redux";
import { store } from "./redux/store";

// TonConnect UI
import { TonConnectUIProvider } from "@tonconnect/ui-react";

// Rainbow Kit
import "./polyfills";

import { createWalletConnectModal } from "./configs/walletConnect";

// Telegram Mini App SDK
import WebApp from "@twa-dev/sdk";

// App + Styles
import App from "./App";
import "./index.css";

console.log("main");
// Hide the main button
WebApp.MainButton.hide();
// // Expand the Telegram Mini App to full screen
WebApp.expand();
// // Initialize the Telegram Mini App SDK
WebApp.ready();
// // Enable the closing confirmation
WebApp.enableClosingConfirmation();

const vConsole = new VConsole();
// // Create the WalletConnect modal
try {
  createWalletConnectModal();
} catch (e) {
  console.log(e);
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

console.log("render");
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <TonConnectUIProvider manifestUrl="https://softstack.github.io/telegram-mini-app/tonconnect-manifest.json">
        <App />
      </TonConnectUIProvider>
    </Provider>
  </React.StrictMode>
);
