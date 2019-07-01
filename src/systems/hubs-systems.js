import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { RenderManagerSystem } from "./render-manager-system";

import vertexShader from "./highlight/highlight.vert";
import fragmentShader from "./highlight/highlight.frag";

class HoverVisualsSystem {
  constructor(scene) {
    const geometry = new THREE.BufferGeometry();

    this.meshes = [];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          hubs_Time: { value: 0 },
          hubs_SweepParams: { value: [0, 0] }
        }
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.matrixIsModified = true;
      mesh.visible = false;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  updateMesh(mesh, interactor, time) {
    let meshToHighlight;
    const { hovered, held } = interactor;
    if (
      (hovered && hovered.object3D && hovered.components["hoverable-visuals"]) ||
      (held && held.object3D && held.components["hoverable-visuals"])
    ) {
      (hovered || held).object3D.traverseVisible(o => {
        if (!o.isMesh) return;
        meshToHighlight = o;
      });
    }

    if (meshToHighlight) {
      mesh.visible = true;
      mesh.geometry = meshToHighlight.geometry;
      mesh.matrixWorld.copy(meshToHighlight.matrixWorld);

      const worldY = mesh.matrixWorld.elements[13];
      if (!meshToHighlight.geometry.boundingSphere) meshToHighlight.geometry.computeBoundingSphere();
      const scaledRadius = hovered.object3D.scale.y * meshToHighlight.geometry.boundingSphere.radius;
      mesh.material.uniforms.hubs_SweepParams.value[0] = worldY - scaledRadius;
      mesh.material.uniforms.hubs_SweepParams.value[1] = worldY + scaledRadius;
    } else {
      mesh.visible = false;
    }

    mesh.material.uniforms.hubs_Time.value = time;
  }

  tick(time) {
    const interaction = AFRAME.scenes[0].systems.interaction;
    this.updateMesh(this.meshes[0], interaction.state.rightRemote, time);
    this.updateMesh(this.meshes[1], interaction.state.rightHand, time);
    this.updateMesh(this.meshes[2], interaction.state.leftHand, time);
  }
}

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
    this.constraintsSystem = new ConstraintsSystem();
    this.twoPointStretchingSystem = new TwoPointStretchingSystem();
    this.singleActionButtonSystem = new SingleActionButtonSystem();
    this.holdableButtonSystem = new HoldableButtonSystem();
    this.hoverButtonSystem = new HoverButtonSystem();
    this.hoverMenuSystem = new HoverMenuSystem();
    this.superSpawnerSystem = new SuperSpawnerSystem();
    this.hapticFeedbackSystem = new HapticFeedbackSystem();
    this.soundEffectsSystem = new SoundEffectsSystem();
    this.renderManagerSystem = new RenderManagerSystem(this.el.sceneEl.object3D, this.el.sceneEl.renderer);
    this.hoverVisualsSystem = new HoverVisualsSystem(this.el.sceneEl.object3D);
  },

  tick(t) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2();
    systems.interaction.tick2(this.soundEffectsSystem);
    this.superSpawnerSystem.tick();
    this.cursorTargettingSystem.tick(t);
    this.constraintsSystem.tick();
    this.twoPointStretchingSystem.tick();
    this.singleActionButtonSystem.tick();
    this.holdableButtonSystem.tick();
    this.hoverButtonSystem.tick();
    this.hoverMenuSystem.tick();
    this.hapticFeedbackSystem.tick(this.twoPointStretchingSystem, this.singleActionButtonSystem.didInteractThisFrame);
    this.soundEffectsSystem.tick();
    this.renderManagerSystem.tick(t);
    this.hoverVisualsSystem.tick(t);
  },

  remove() {
    this.cursorTargettingSystem.remove();
  }
});
