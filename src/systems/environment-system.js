import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import qsTruthy from "../utils/qs_truthy";

// This disabled lighting contribution from the environment map for things that have a lightmap
// TODO do this in a less hacky way, maybe make it configurable
THREE.ShaderChunk.lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.replace(
  "iblIrradiance += getLightProbeIndirectIrradiance( geometry, maxMipLevel );",
  `#ifndef USE_LIGHTMAP
     iblIrradiance += getLightProbeIndirectIrradiance( geometry, maxMipLevel );
   #endif`
);

const toneMappingOptions = {
  None: "NoToneMapping",
  Linear: "LinearToneMapping",
  Reinhard: "ReinhardToneMapping",
  Cineon: "CineonToneMapping",
  ACESFilmic: "ACESFilmicToneMapping"
};

const defaultEnvSettings = {
  toneMapping: toneMappingOptions.Linear,
  toneMappingExposure: 1,
  physicallyCorrectLights: true,
  envMapTexture: null,
  backgroundTexture: null,
  backgroundColor: new THREE.Color("#000000")
};

export class EnvironmentSystem {
  constructor(sceneEl) {
    this.scene = sceneEl.object3D;
    this.renderer = sceneEl.renderer;

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);

    this.applyEnvSettings(defaultEnvSettings);

    if (qsTruthy("envSettingsDebug")) {
      this.setupDebugView();
    }
  }

  setupDebugView() {
    const debugSettings = { ...defaultEnvSettings };

    const updateDebug = () => {
      this.applyEnvSettings(debugSettings);
    };

    const gui = new GUI();
    gui
      .add(debugSettings, "toneMapping", Object.values(toneMappingOptions))
      .onChange(updateDebug)
      .listen();
    gui
      .add(debugSettings, "toneMappingExposure", 0, 4, 0.01)
      .onChange(updateDebug)
      .listen();
    gui
      .add(debugSettings, "physicallyCorrectLights", true)
      .onChange(updateDebug)
      .listen();
    gui.open();

    this.debugGui = gui;
    this.debugSettings = debugSettings;
    this.debugMode = true;

    window.$E = this;
  }

  updateEnvironment(envEl) {
    const envSettingsEl = envEl.querySelector("[environment-settings]");
    const skyboxEl = envEl.querySelector("[skybox]");
    const envSettings = {
      ...defaultEnvSettings,
      skybox: skyboxEl?.components["skybox"]
    };

    if (envSettingsEl) {
      Object.assign(envSettings, envSettingsEl.components["environment-settings"].data);
    }

    this.applyEnvSettings(envSettings);
  }

  applyEnvSettings(settings) {
    if (this.debugSettings) {
      Object.assign(this.debugSettings, settings);
    }

    let materialsNeedUpdate = false;

    if (this.debugMode) console.log("Applying environment settings", settings);

    if (this.renderer.physicallyCorrectLights !== settings.physicallyCorrectLights) {
      this.renderer.physicallyCorrectLights = settings.physicallyCorrectLights;
      materialsNeedUpdate = true;
    }

    const newToneMapping = THREE[settings.toneMapping];
    if (this.renderer.toneMapping !== newToneMapping) {
      this.renderer.toneMapping = newToneMapping;
      materialsNeedUpdate = true;
    }

    this.renderer.toneMappingExposure = settings.toneMappingExposure;

    this.scene.remove(window.lp);

    if (settings.backgroundTexture) {
      settings.backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = settings.backgroundTexture;
    } else {
      this.scene.background = settings.backgroundColor;
    }

    if (settings.envMapTexture) {
      if (this.prevEnvMapTextureUUID !== settings.envMapTexture.uuid) {
        this.prevEnvMapTextureUUID = settings.envMapTexture.uuid;
        this.scene.environment = this.pmremGenerator.fromEquirectangular(settings.envMapTexture).texture;
      }
    } else if (settings.skybox) {
      if (this.prevEnvMapTextureUUID !== settings.skybox.uuid) {
        this.prevEnvMapTextureUUID = settings.skybox.uuid;
        this.scene.environment = settings.skybox.sky.generateEnvironmentMap(this.renderer);
      }
    } else {
      this.scene.environment = null;
      this.prevEnvMapTextureUUID = null;
    }

    if (materialsNeedUpdate) {
      if (this.debugMode) console.log("materials need updating");
      this.scene.traverse(o => {
        if (o.material) o.material.needsUpdate = true;
      });
    }
  }
}

AFRAME.registerComponent("environment-settings", {
  schema: {
    toneMapping: { default: defaultEnvSettings.toneMapping, oneOf: Object.values(toneMappingOptions) },
    toneMappingExposure: { default: defaultEnvSettings.toneMappingExposure },
    backgroundColor: { type: "color", default: defaultEnvSettings.background }
  }
});
