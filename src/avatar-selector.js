import ReactDOM from "react-dom";
import React from "react";
import queryString from "query-string";

import "./assets/stylesheets/avatar-selector.scss";
import "./vendor/GLTFLoader";

import "./components/animation-mixer";
import "./components/audio-feedback";
import "./components/loop-animation";
import "./elements/a-progressive-asset";
import "./gltf-component-mappings";
import { avatars } from "./assets/avatars/avatars.json";
import { avatarIds } from "./utils/identity";

import { App } from "./App";
import AvatarSelector from "./react-components/avatar-selector";

window.APP = new App();
const hash = queryString.parse(location.hash);
const isMobile = AFRAME.utils.device.isMobile();
if (hash.quality) {
  window.APP.quality = hash.quality;
} else {
  window.APP.quality = isMobile ? "low" : "high";
}

const avatar = hash.avatar;

function postAvatarToParent(newAvatar) {
  window.parent.postMessage({avatar: newAvatar}, location.origin);
}

function mountUI() {
  const selector = ReactDOM.render(
    <AvatarSelector {...{ avatars, avatar, onChange: postAvatarToParent }} />,
    document.getElementById("selector-root")
  );

  window.addEventListener('hashchange', () => {
    const hash = queryString.parse(location.hash);
    selector.setState({avatar: hash.avatar});
  });
}
document.addEventListener("DOMContentLoaded", mountUI);
