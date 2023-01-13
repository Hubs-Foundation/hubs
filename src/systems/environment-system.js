import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
import qsTruthy from "../utils/qs_truthy";

import { LUTCubeLoader } from "three/examples/jsm/loaders/LUTCubeLoader";
import blenderLutPath from "../assets/blender-lut.cube";
import { NoToneMapping } from "three";

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
  GBEEncoding: "GBEEncoding",
  GBM7Encoding: "GBM7Encoding",
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

  skybox: null,
  backgroundTexture: null,
  backgroundColor: new THREE.Color("#000000"),

  fogType: null,
  fogColor: new THREE.Color("#ffffff"),
  fogDensity: 0.00025,
  fogFar: 1000,
  fogNear: 1,

  enableHDRPipeline: false,
  enableBloom: false,
  bloom: {
    threshold: 1.0,
    intensity: 1.0,
    radius: 0.6,
    smoothing: 0.025
  }
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
      this.debugUpdateUI();
    };

    const gui = new GUI({ title: "Environment Settings" });
    const tonemappingController = gui
      .add(debugSettings, "toneMapping", Object.values(toneMappingOptions))
      .onChange(updateDebug)
      .listen();
    tonemappingController.enable(!debugSettings.enableHDRPipeline);
    gui.add(debugSettings, "toneMappingExposure", 0, 4, 0.01).onChange(updateDebug).listen();
    gui.add(debugSettings, "outputEncoding", Object.values(outputEncodingOptions)).onChange(updateDebug).listen();
    gui.add(debugSettings, "physicallyCorrectLights").onChange(updateDebug).listen();
    gui.add(debugSettings, "enableHDRPipeline").onChange(updateDebug).listen();
    const bloomController = gui.add(debugSettings, "enableBloom").onChange(updateDebug).listen();
    bloomController.enable(debugSettings.enableHDRPipeline);

    const bloomFolder = gui.addFolder("bloom");
    bloomFolder.show(debugSettings.enableHDRPipeline && debugSettings.enableBloom);
    bloomFolder.add(debugSettings.bloom, "intensity", 0, 10, 0.01).onChange(updateDebug).listen();
    bloomFolder.add(debugSettings.bloom, "threshold", 0, 10, 0.001).onChange(updateDebug).listen();
    bloomFolder.add(debugSettings.bloom, "radius", 0, 1, 0.001).onChange(updateDebug).listen();
    bloomFolder.add(debugSettings.bloom, "smoothing", 0, 1, 0.001).onChange(updateDebug).listen();
    // bloomFolder.add(bloom.blendMode, "blendFunction", BlendFunction);
    // bloomFolder.add(bloom.blendMode.opacity, "value", 0, 1).name("Opacity");

    gui.open();

    this.debugGui = gui;
    this.debugSettings = debugSettings;
    this.debugMode = true;
    this.debugUpdateUI = function () {
      bloomController.enable(debugSettings.enableHDRPipeline);
      tonemappingController.enable(!debugSettings.enableHDRPipeline);
      bloomFolder.show(debugSettings.enableHDRPipeline && debugSettings.enableBloom);
    };

    window.$E = this;
  }

  updateEnvironmentSettings(newSettings) {
    const envSettings = {
      ...defaultEnvSettings,
      ...newSettings
    };
    this.applyEnvSettings(envSettings);
  }

  updateEnvironment(envEl) {
    const envSettingsEl = envEl.querySelector("[environment-settings]");
    const skyboxEl = envEl.querySelector("[skybox]");
    const navmeshEl = envEl.querySelector("[nav-mesh]");

    const envSettings = {
      ...defaultEnvSettings,
      skybox: skyboxEl?.components["skybox"]?.sky
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
      const bloomSettings = this.debugSettings.bloom;
      Object.assign(this.debugSettings, settings);
      if (settings.bloom) {
        Object.assign(bloomSettings, settings.bloom);
        this.debugSettings.bloom = bloomSettings;
      }
      this.debugUpdateUI();
    }

    let materialsNeedUpdate = false;

    if (this.debugMode) console.log("Applying environment settings", settings);

    if (this.renderer.physicallyCorrectLights !== settings.physicallyCorrectLights) {
      this.renderer.physicallyCorrectLights = settings.physicallyCorrectLights;
      materialsNeedUpdate = true;
    }

    let newToneMapping = THREE[settings.toneMapping];
    if (APP.fx.composer) {
      if (settings.enableHDRPipeline) {
        newToneMapping = NoToneMapping;
        // TODO HDR pipeline currently hardcodes ACES tonemapping. Support customization.
        if (APP.fx.bloomAndTonemapPass) {
          APP.fx.bloomAndTonemapPass.enabled = settings.enableBloom;
          if (settings.enableBloom) {
            const bloom = APP.fx.bloomAndTonemapPass.effects[0];
            bloom.intensity = settings.bloom.intensity;
            bloom.luminanceMaterial.threshold = settings.bloom.threshold;
            bloom.mipmapBlurPass.radius = settings.bloom.radius;
            bloom.luminanceMaterial.smoothing = settings.bloom.smoothing;
          }
        }
        APP.fx.tonemapOnlyPass.enabled = !APP.fx.bloomAndTonemapPass?.enabled;
      } else {
        APP.fx.tonemapOnlyPass.enabled = false;
        if (APP.fx.bloomAndTonemapPass) APP.fx.bloomAndTonemapPass.enabled = false;
      }
    }
    const toneMappingChanged = this.renderer.toneMapping !== newToneMapping;
    if (toneMappingChanged) {
      this.renderer.toneMapping = newToneMapping;
      materialsNeedUpdate = true;

      // TODO clean up async behavior
      if (newToneMapping === THREE.LUTToneMapping) {
        if (!blenderLUTPromise) {
          blenderLUTPromise = new Promise(function (resolve, reject) {
            new LUTCubeLoader().load(blenderLutPath, ({ texture3D }) => resolve(texture3D), null, reject);
          });
        }

        blenderLUTPromise
          .then(t => {
            this.renderer.tonemappingLUT = t;
          })
          .catch(function (e) {
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
        this.scene.environment = settings.skybox.generateEnvironmentMap(this.renderer);
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
    fogNear: { type: "number", default: defaultEnvSettings.fogNear },
    fogFar: { type: "number", default: defaultEnvSettings.fogFar }
  }
});

AFRAME.registerComponent("reflection-probe", {
  schema: {
    size: { default: 1 },
    envMapTexture: { type: "map" }
  },

  init: function () {
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
