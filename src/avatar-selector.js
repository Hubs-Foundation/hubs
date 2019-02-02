import "aframe";
import ReactDOM from "react-dom";
import React from "react";
import { IntlProvider, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "./utils/i18n";

import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "./assets/stylesheets/avatar-selector.scss";
import "three/examples/js/loaders/GLTFLoader";

import "./components/animation-mixer";
import "./components/audio-feedback";
import "./components/loop-animation";
import "./components/gamma-factor";
import "./components/scene-sound";
import "./components/environment-map";
import "./gltf-component-mappings";
import { avatars } from "./assets/avatars/avatars";

import registerTelemetry from "./telemetry";
import { App } from "./App";
import AvatarSelector from "./react-components/avatar-selector";

addLocaleData([...en]);

registerTelemetry("/avatars", "Hubs Avatar Picker");

function getHashArg(arg) {
  return new URLSearchParams(location.hash.replace(/^#/, "?")).get(arg);
}

window.APP = new App();
window.APP.quality = getHashArg("quality") || AFRAME.utils.device.isMobile() ? "low" : "high";

function postAvatarIdToParent(newAvatarId) {
  window.parent.postMessage({ avatarId: newAvatarId }, location.origin);
}

function mountUI(avatarId) {
  ReactDOM.render(
    <IntlProvider locale={lang} messages={messages}>
      <AvatarSelector {...{ avatars, avatarId, onChange: postAvatarIdToParent }} />
    </IntlProvider>,
    document.getElementById("selector-root")
  );
}

window.addEventListener("message", e => {
  if (e.source !== window.parent) {
    return;
  }

  const avatarId = e.data.avatarId;

  if (document.readyState === "complete") {
    mountUI(avatarId);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      mountUI(avatarId);
    });
  }
});
