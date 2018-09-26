console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

import "./assets/stylesheets/scene.scss";

import "aframe";
import "./utils/logging";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "three/examples/js/loaders/GLTFLoader";

import "./components/ambient-light";
import "./components/animation-mixer";
import "./components/audio-feedback";
import "./components/css-class";
import "./components/debug";
import "./components/directional-light";
import "./components/duck";
import "./components/gltf-model-plus";
import "./components/heightfield";
import "./components/hemisphere-light";
import "./components/hide-when-quality";
import "./components/layers";
import "./components/loop-animation";
import "./components/media-loader";
import "./components/point-light";
import "./components/quack";
import "./components/scene-shadow";
import "./components/scene-preview-camera";
import "./components/skybox";
import "./components/spawn-controller";
import "./components/spot-light";
import "./components/sticky-object";
import "./components/super-spawner";
import "./components/water";
import "./systems/nav";

import { getReticulumFetchUrl } from "./utils/phoenix-utils";

import ReactDOM from "react-dom";
import React from "react";
import SceneUI from "./react-components/scene-ui";
import { disableiOSZoom } from "./utils/disable-ios-zoom";

import "./gltf-component-mappings";

import { App } from "./App";

window.APP = new App();
window.APP.RENDER_ORDER = {
  HUD_BACKGROUND: 1,
  HUD_ICONS: 2,
  CURSOR: 3
};
const store = window.APP.store;

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile();

window.APP.quality = qs.get("quality") || isMobile ? "low" : "high";

import "aframe-physics-system";
import "aframe-physics-extras";
import "./components/event-repeater";
import "./components/controls-shape-offset";

import registerTelemetry from "./telemetry";

registerTelemetry();

disableiOSZoom();
store.init();

function mountUI(scene, props = {}) {
  ReactDOM.render(
    <SceneUI
      {...{
        scene,
        store,
        ...props
      }}
    />,
    document.getElementById("ui-root")
  );
}

const onReady = async () => {
  const scene = document.querySelector("a-scene");
  window.APP.scene = scene;
  document.querySelector("canvas").classList.add("brightened");

  const sceneId = qs.get("scene_id") || document.location.pathname.substring(1).split("/")[0];
  console.log(`Scene ID: ${sceneId}`);

  let uiProps = { sceneId: sceneId };

  mountUI(scene);

  const remountUI = props => {
    uiProps = { ...uiProps, ...props };
    mountUI(scene, uiProps);
  };

  const sceneRoot = document.querySelector("#scene-root");
  const sceneModelEntity = document.createElement("a-entity");
  const gltfEl = document.createElement("a-entity");
  const camera = document.getElementById("camera");

  sceneModelEntity.addEventListener("scene-loaded", () => {
    remountUI({ sceneLoaded: true });
    const previewCamera = gltfEl.object3D.getObjectByName("scene-preview-camera");

    if (previewCamera) {
      camera.object3D.applyMatrix(previewCamera.matrixWorld);
    }

    camera.setAttribute("scene-preview-camera", "");
  });

  sceneRoot.appendChild(sceneModelEntity);

  const res = await fetch(getReticulumFetchUrl(`/api/v1/scenes/${sceneId}`)).then(r => r.json());
  const sceneInfo = res.scenes[0];

  const modelUrl = sceneInfo.model_url;
  console.log(`Scene Model URL: ${modelUrl}`);

  gltfEl.setAttribute("gltf-model-plus", { src: modelUrl, useCache: false, inflate: true });
  gltfEl.addEventListener("model-loaded", () => sceneModelEntity.emit("scene-loaded"));
  sceneModelEntity.appendChild(gltfEl);

  remountUI({
    sceneName: sceneInfo.name,
    sceneDescription: sceneInfo.description,
    sceneAttribution: sceneInfo.attribution
  });
};

document.addEventListener("DOMContentLoaded", onReady);
