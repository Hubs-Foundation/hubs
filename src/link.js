import "./assets/stylesheets/link.scss";
import "aframe";
import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import LinkRoot from "./react-components/link-root";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import Store from "./storage/store";

registerTelemetry("/link", "Hubs Device Link");
const isMobileVR = AFRAME.utils.device.isMobileVR();

const socket = connectToReticulum();
const store = new Store();
store.init();

const linkChannel = new LinkChannel(store);

linkChannel.setSocket(socket);

ReactDOM.render(
  <LinkRoot store={store} linkChannel={linkChannel} showHeadsetLinkOption={isMobileVR} />,
  document.getElementById("link-root")
);
