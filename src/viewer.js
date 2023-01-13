import "aframe";
import "./utils/aframe-overrides";
import "networked-aframe/src/index";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// A-Frame hardcodes THREE.Cache.enabled = true
// But we don't want to use THREE.Cache because
// web browser cache should work well.
// So we disable it here.
import * as THREE from "three";
THREE.Cache.enabled = false;
THREE.Object3D.DefaultMatrixAutoUpdate = false;

import "./utils/theme";
import "./utils/logging";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "./components/scene-components";
import "./components/avatar-audio-source";
import "./components/video-texture-target";
import "./components/mirror";
import "./components/stats-plus";
import "./systems/nav";
import "./systems/frame-scheduler";
import "./systems/hubs-systems";

import "./gltf-component-mappings";
import { App } from "./app";

import React from "react";
import ReactDOM from "react-dom";
import "./react-components/styles/global.scss";
import { ThemeProvider } from "./react-components/styles/theme";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import { addAnimationComponents } from "./utils/animation";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import "./utils/theme";

import { traverseMeshesAndAddShapes } from "./utils/physics-utils";
import { swapActiveScene } from "./bit-systems/scene-loading";

window.APP = new App();
[
  "networked",
  "scene-loading-system",
  "physics-system",
  "waypoint-system",
  "sprite-system",
  "audio-zones-system",
  "animation-mixer-system",
  "uv-scroll-system",
  "video-system",
  "shadows-system",
  "nav",
  "frame-scheduler",
  "hubs-systems",
  "scene-components",
  "avatar-audio-source",
  "video-texture-target",
  "mirror"
].forEach(system => APP.enabledSystems.add(system));
window.APP.store.state.preferences.showFPSCounter = true;
window.APP.store.state.preferences.enableDynamicShadows = true;

// TODO This should probably be a provider
const debug = {
  physics: false
};

function mountUI(props = {}) {
  ReactDOM.render(
    <WrappedIntlProvider>
      <ThemeProvider store={props.store}>
        <></>
      </ThemeProvider>
    </WrappedIntlProvider>,
    document.getElementById("ui-root")
  );
}

const remountUI = (function () {
  let props;
  return function remountUI(newProps) {
    props = { ...props, ...newProps };
    mountUI(props);
  };
})();

const resize = () => {
  const aScene = document.querySelector("a-scene");
  const hubsSystems = aScene.systems["hubs-systems"];
  const renderer = hubsSystems.el.renderer;
  const canvas = renderer.domElement;
  const width = canvas.parentElement.offsetWidth;
  const height = canvas.parentElement.offsetHeight;
  aScene.emit("rendererresize", { width, height }, false);

  const camera = aScene.camera;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

const loadScene = src => {
  const aScene = document.querySelector("a-scene");
  const hubsSystems = aScene.systems["hubs-systems"];
  const envSystem = hubsSystems.environmentSystem;
  const shadowSystem = hubsSystems.shadowSystem;

  const sceneEl = document.querySelector("#environment-scene");
  const modelEl = sceneEl.querySelector("#model-root");
  const sceneErrorHandler = () => {
    console.error("Couldn't load the scene");
  };
  modelEl.addEventListener(
    "model-loaded",
    () => {
      console.log("Model has loaded");

      // This will be run every time the environment is changed (including the first load.)
      remountUI({ environmentSceneLoaded: true });

      for (const modelEl of sceneEl.children) {
        addAnimationComponents(modelEl);
      }

      modelEl.removeEventListener("model-error", sceneErrorHandler);

      shadowSystem.updatePrefs();
      envSystem.updateEnvironment(modelEl);

      traverseMeshesAndAddShapes(modelEl);
    },
    { once: true }
  );
  modelEl.addEventListener("model-error", sceneErrorHandler);
  modelEl.setAttribute("gltf-model-plus", { src, useCache: false, inflate: true });

  //swapActiveScene(APP.world, "https://hubs.local:8080/assets/models/Hellboy3-2ad295c740c2bad99a9b..glb");
};

function onSceneLoaded() {
  const aScene = document.querySelector("a-scene");

  // Init systems
  const hubsSystems = aScene.systems["hubs-systems"];
  const envSystem = hubsSystems.environmentSystem;
  const renderer = hubsSystems.el.renderer;
  renderer.setClearColor(new THREE.Color(1.0, 1.0, 1.0));
  renderer.alpha = false;
  const physicsSystem = hubsSystems.physicsSystem;
  physicsSystem.setDebug(debug.physics);
  envSystem.setupDebugView();

  const scene = aScene.object3D;
  scene.background = new THREE.Color(0xffffff);

  const canvas = renderer.domElement;
  const camera = aScene.camera;
  // We should use our own input system for this
  const controls = new OrbitControls(camera, canvas);

  const light = new THREE.DirectionalLight(0xf7f6ef, 1);
  light.position.set(0, 10, 10);
  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xb1e3ff, 0xb1e3ff, 2.5));

  camera.position.set(-2, 2, 2);
  camera.matrixAutoUpdate = true;

  controls.enablePan = true;
  controls.target.set(0, 1, 0);
  controls.update();

  window.addEventListener("resize", resize);

  resize();
}

function onReady() {
  console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

  const inputEl = document.getElementById("model");
  inputEl.addEventListener("change", e => {
    const files = e.target.files;
    for (const file of files) {
      const reader = new FileReader();
      // listen for 'load' events on the FileReader
      reader.addEventListener(
        "load",
        function () {
          // change the preview's src to be the "result" of reading the uploaded file (below)
          loadScene(reader.result);
        },
        false
      );

      // if there's a file, tell the reader to read the data
      // which triggers the load event above
      if (file) {
        reader.readAsDataURL(file);
      }
    }
  });

  const scene = document.querySelector("a-scene");
  window.APP.scene = scene;

  disableiOSZoom();

  if (scene.hasLoaded) {
    onSceneLoaded();
  } else {
    scene.addEventListener("loaded", onSceneLoaded, { once: true });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onReady();
});

let lastDebugScene;
document.addEventListener("drop", e => {
  e.preventDefault();

  URL.revokeObjectURL(lastDebugScene);
  const url = URL.createObjectURL(e.dataTransfer.files[0]);
  loadScene(url);
  lastDebugScene = url;
  return;
});

document.addEventListener("dragover", e => e.preventDefault());
