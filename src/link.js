import "./utils/theme";
import "./utils/configs";
import "./react-components/styles/global.scss";
import "./assets/stylesheets/link.scss";
import "aframe";
import React from "react";
import { createRoot } from "react-dom/client";
import registerTelemetry from "./telemetry";
import LinkRoot from "./react-components/link-root";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { ThemeProvider } from "./react-components/styles/theme";
import { store } from "./utils/store-instance";

registerTelemetry("/link", "Hubs Device Link");

const linkChannel = new LinkChannel(store);

(async () => {
  const socket = await connectToReticulum();
  linkChannel.setSocket(socket);
})();

const container = document.getElementById("link-root");
const root = createRoot(container);
root.render(
  <ThemeProvider store={store}>
    <LinkRoot store={store} linkChannel={linkChannel} />
  </ThemeProvider>
);
