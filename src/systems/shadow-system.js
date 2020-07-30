import resizeShadowCameraFrustum from "../utils/resizeShadowCameraFrustum";
import { traverseAnimationTargets } from "../utils/three-utils";

export class ShadowSystem {
  constructor(sceneEl) {
    this.needsUpdate = false;
    this.dynamicShadowsEnabled = window.APP.store.state.preferences.enableDynamicShadows;
    this.sceneEl = sceneEl;
    this.onEnvironmentSceneLoaded = this.onEnvironmentSceneLoaded.bind(this);
    this.sceneEl.addEventListener("environment-scene-loaded", this.onEnvironmentSceneLoaded);
  }

  onEnvironmentSceneLoaded({ detail: environmentObject3D }) {
    this.environmentObject3D = environmentObject3D;
    this.needsUpdate = true;
    this.sceneEl.renderer.shadowMap.autoUpdate = this.dynamicShadowsEnabled;
  }

  tick() {
    const environmentObject3D = this.environmentObject3D;

    if (!this.needsUpdate || (window.APP && window.APP.quality === "low") || !environmentObject3D) {
      return;
    }

    if (!this.dynamicShadowsEnabled) {
      traverseAnimationTargets(environmentObject3D, environmentObject3D.animations, animatedNode => {
        animatedNode.traverse(child => {
          child.castShadow = false;
          child.receiveShadow = false;
        });
      });
    }

    environmentObject3D.updateMatrixWorld(true, true);

    environmentObject3D.traverse(object3D => {
      if (object3D.isDirectionalLight) {
        resizeShadowCameraFrustum(object3D, environmentObject3D);
      }
    });

    this.sceneEl.renderer.shadowMap.needsUpdate = true;
    this.needsUpdate = false;
  }
}
