import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import qsTruthy from "../utils/qs_truthy";

import { LUTCubeLoader } from "three/examples/jsm/loaders/LUTCubeLoader";
import blenderLutPath from "../assets/blender-lut.cube";

const toneMappingOptions = {
  None: "NoToneMapping",
  Linear: "LinearToneMapping",
  Reinhard: "ReinhardToneMapping",
  Cineon: "CineonToneMapping",
  ACESFilmic: "ACESFilmicToneMapping",
  CustomToneMapping: "CustomToneMapping",
  LUTToneMapping: "LUTToneMapping"
};

const outputEncodingOptions = {
  LinearEncoding: "LinearEncoding",
  sRGBEncoding: "sRGBEncoding",
  GammaEncoding: "GammaEncoding",
  GBEEncoding: "GBEEncoding",
  LogLuvEncoding: "LogLuvEncoding",
  GBM7Encoding: "GBM7Encoding",
  RGBM16Encoding: "RGBM16Encoding",
  GBDEncoding: "GBDEncoding",
  BasicDepthPacking: "BasicDepthPacking",
  GBADepthPacking: "GBADepthPackig"
};

const defaultEnvSettings = {
  toneMapping: toneMappingOptions.Linear,
  outputEncoding: outputEncodingOptions.sRGBEncoding,
  toneMappingExposure: 1,
  physicallyCorrectLights: true,
  envMapTexture: null,
  backgroundTexture: null,
  backgroundColor: new THREE.Color("#000000"),

  fogType: null,
  fogColor: new THREE.Color("#ffffff"),
  fogDensity: 0.00025,
  fogFar: 1000,
  fogNear: 1
};

let blenderLUTPromise; // lazy loaded

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
      .add(debugSettings, "outputEncoding", Object.values(outputEncodingOptions))
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
    const navmeshEl = envEl.querySelector("[nav-mesh]");

    const envSettings = {
      ...defaultEnvSettings,
      skybox: skyboxEl?.components["skybox"]
    };

    if (envSettingsEl) {
      Object.assign(envSettings, envSettingsEl.components["environment-settings"].data);
    }

    const navMesh = navmeshEl?.object3D.getObjectByProperty("isMesh", true);
    if (navMesh) {
      AFRAME.scenes[0].systems.nav.loadMesh(navMesh, navmeshEl.components["nav-mesh"].data.zone);
    }

    // TODO animated objects should not be static
    envEl.object3D.traverse(o => {
      if (o.isMesh) {
        o.reflectionProbeMode = "static";
      }
    });

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

      // TODO clean up async behavior
      if (newToneMapping === THREE.LUTToneMapping) {
        if (!blenderLUTPromise) {
          blenderLUTPromise = new Promise(function(resolve, reject) {
            new LUTCubeLoader().load(blenderLutPath, ({ texture3D }) => resolve(texture3D), null, reject);
          });
        }

        blenderLUTPromise
          .then(t => {
            this.renderer.tonemappingLUT = t;
          })
          .catch(function(e) {
            console.error("Error loading Blender LUT", e);
            blenderLUTPromise = null;
          });
      } else {
        this.renderer.tonemappingLUT = null;
      }
    }

    this.renderer.toneMappingExposure = settings.toneMappingExposure;

    const newOutputEncoding = THREE[settings.outputEncoding];
    if (this.renderer.outputEncoding !== newOutputEncoding) {
      this.renderer.outputEncoding = newOutputEncoding;
      materialsNeedUpdate = true;
    }

    this.scene.remove(window.lp);

    if (settings.backgroundTexture) {
      // Assume texture is always an equirect for now
      settings.backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = settings.backgroundTexture;
    } else {
      this.scene.background = settings.backgroundColor;
    }

    if (settings.envMapTexture) {
      if (this.prevEnvMapTextureUUID !== settings.envMapTexture.uuid) {
        this.prevEnvMapTextureUUID = settings.envMapTexture.uuid;
        // TODO PMREMGenerator should be fixed to not assume this
        settings.envMapTexture.flipY = true;
        // Assume texture is always an equirect for now
        settings.envMapTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = settings.envMapTexture;
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

    if (this.scene.fog?.name !== settings.fogType) {
      if (settings.fogType === "linear") {
        this.scene.fog = new THREE.Fog(settings.fogColor, settings.fogNear, settings.fogFar);
      } else if (settings.fogType === "exponential") {
        this.scene.fog = new THREE.FogExp2(settings.fogColor, settings.fogDensity);
      } else {
        this.scene.fog = null;
      }
      materialsNeedUpdate = true;
    } else if (settings.fogType) {
      this.scene.fog.color.copy(settings.fogColor);
      if (settings.fogType === "linear") {
        this.scene.fog.near = settings.fogNear;
        this.scene.fog.far = settings.fogFar;
      } else if (settings.fogType === "exponential") {
        this.scene.fog.density = settings.fogDensity;
      }
    }

    if (materialsNeedUpdate) {
      if (this.debugMode) console.log("materials need updating");
      this.scene.traverse(o => {
        if (o.material) o.material.needsUpdate = true;
      });
    }
  }
}

AFRAME.registerComponent("nav-mesh", {
  schema: {
    zone: { default: "character" }
  }
});

AFRAME.registerComponent("environment-settings", {
  schema: {
    toneMapping: { default: defaultEnvSettings.toneMapping, oneOf: Object.values(toneMappingOptions) },
    toneMappingExposure: { default: defaultEnvSettings.toneMappingExposure },
    backgroundColor: { type: "color", default: defaultEnvSettings.background },

    fogType: { type: "string", default: defaultEnvSettings.fogType },
    fogColor: { type: "color", default: defaultEnvSettings.fogColor },
    fogDensity: { type: "number", default: defaultEnvSettings.fogDensity },
    fogNear: { type: "number", default: defaultEnvSettings.forNear },
    fogFar: { type: "number", default: defaultEnvSettings.fogFar }
  }
});

AFRAME.registerComponent("reflection-probe", {
  schema: {
    size: { default: 1 },
    envMapTexture: { type: "map" }
  },

  init: function() {
    this.el.object3D.updateMatrices();

    const box = new THREE.Box3()
      .setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3().setScalar(this.data.size * 2))
      .applyMatrix4(this.el.object3D.matrixWorld);

    this.el.setObject3D("probe", new THREE.ReflectionProbe(box, this.data.envMapTexture));

    if (this.el.sceneEl.systems["hubs-systems"].environmentSystem.debugMode) {
      const debugBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(),
        new THREE.Vector3().setScalar(this.data.size * 2)
      );
      this.el.setObject3D(
        "helper",
        new THREE.Box3Helper(debugBox, new THREE.Color(Math.random(), Math.random(), Math.random()))
      );
    }
  }
});
