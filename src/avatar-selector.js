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
import "./gltf-component-mappings";
import { avatars } from "./assets/avatars/avatars";

import registerTelemetry from "./telemetry";
import { App } from "./App";
import AvatarSelector from "./react-components/avatar-selector";

addLocaleData([...en]);

registerTelemetry();

function getHashArg(arg) {
  return new URLSearchParams(location.hash.replace(/^#/, "?")).get(arg);
}

window.APP = new App();
window.APP.quality = getHashArg("quality") || AFRAME.utils.device.isMobile() ? "low" : "high";

function postAvatarIdToParent(newAvatarId) {
  window.parent.postMessage({ avatarId: newAvatarId }, location.origin);
}

function mountUI() {
  const avatarId = getHashArg("avatar_id");
  ReactDOM.render(
    <IntlProvider locale={lang} messages={messages}>
      <AvatarSelector {...{ avatars, avatarId, onChange: postAvatarIdToParent }} />
    </IntlProvider>,
    document.getElementById("selector-root")
  );
}

window.addEventListener("hashchange", mountUI);
document.addEventListener("DOMContentLoaded", mountUI);
