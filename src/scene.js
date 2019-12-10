import "./webxr-bypass-hacks";
import "./utils/theme";
import "./utils/configs";
console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

import "./assets/stylesheets/scene.scss";

import "aframe";
import "./utils/logging";
import "./utils/threejs-world-update";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "three/examples/js/loaders/GLTFLoader";

import "./components/scene-components";
import "./components/debug";
import "./systems/nav";

import { fetchReticulumAuthenticated } from "./utils/phoenix-utils";

import ReactDOM from "react-dom";
import React from "react";
import SceneUI from "./react-components/scene-ui";
import { disableiOSZoom } from "./utils/disable-ios-zoom";

import "./gltf-component-mappings";

import { App } from "./App";

window.APP = new App();

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();

window.APP.quality = qs.get("quality") || isMobile ? "low" : "high";

import "./components/event-repeater";

import registerTelemetry from "./telemetry";

disableiOSZoom();

function mountUI(scene, props = {}) {
  ReactDOM.render(
    <SceneUI
      {...{
        scene,
        ...props
      }}
    />,
    document.getElementById("ui-root")
  );
}

const onReady = async () => {
  const scene = document.querySelector("a-scene");
  window.APP.scene = scene;

  const sceneId = qs.get("scene_id") || document.location.pathname.substring(1).split("/")[1];
  console.log(`Scene ID: ${sceneId}`);

  // Disable shadows on low quality
  scene.setAttribute("shadow", { enabled: window.APP.quality !== "low" });

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
      camera.object3D.position.copy(previewCamera.position);
      camera.object3D.rotation.copy(previewCamera.rotation);
      camera.object3D.matrixNeedsUpdate = true;
    }

    camera.setAttribute("scene-preview-camera", "");
  });

  const res = await fetchReticulumAuthenticated(`/api/v1/scenes/${sceneId}`);
  const sceneInfo = res.scenes[0];

  // Delisted/Removed
  if (!sceneInfo) {
    remountUI({ unavailable: true });
    return;
  }

  if (sceneInfo.allow_promotion) {
    registerTelemetry(`/scene/${sceneId}`, `Hubs Scene: ${sceneInfo.title}`);
  } else {
    registerTelemetry("/scene", "Hubs Non-Promotable Scene Page");
  }

  const modelUrl = sceneInfo.model_url;
  console.log(`Scene Model URL: ${modelUrl}`);

  gltfEl.setAttribute("gltf-model-plus", { src: modelUrl, useCache: false, inflate: true });
  gltfEl.addEventListener("model-loaded", () => sceneModelEntity.emit("scene-loaded"));
  sceneModelEntity.appendChild(gltfEl);
  sceneRoot.appendChild(sceneModelEntity);

  const parentScene =
    sceneInfo.parent_scene_id &&
    (await fetchReticulumAuthenticated(`/api/v1/scenes/${sceneInfo.parent_scene_id}`)).scenes[0];

  remountUI({
    sceneName: sceneInfo.name,
    sceneDescription: sceneInfo.description,
    sceneAttributions: sceneInfo.attributions,
    sceneScreenshotURL: sceneInfo.screenshot_url,
    sceneId: sceneInfo.scene_id,
    sceneProjectId: sceneInfo.project_id,
    sceneAllowRemixing: sceneInfo.allow_remixing,
    isOwner: sceneInfo.account_id && sceneInfo.account_id === window.APP.store.credentialsAccountId,
    parentScene: parentScene
  });
};

document.addEventListener("DOMContentLoaded", onReady);
