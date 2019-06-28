import { CursorTargettingSystem } from "./cursor-targetting-system";
import { ConstraintsSystem } from "./constraints-system";
import { TwoPointStretchingSystem } from "./two-point-stretching-system";
import { SingleActionButtonSystem, HoldableButtonSystem, HoverButtonSystem } from "./button-systems";
import { HoverMenuSystem } from "./hover-menu-system";
import { SuperSpawnerSystem } from "./super-spawner-system";
import { HapticFeedbackSystem } from "./haptic-feedback-system";
import { SoundEffectsSystem } from "./sound-effects-system";
import { RenderManagerSystem } from "./render-manager-system";

export const vertexShader = `#version 300 es
precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

in vec3 position;

void main() {
  gl_Position = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)) - vec4(0,0,0.00002, 0);
}
`;

export const fragmentShader = `#version 300 es
precision highp float;
precision highp int;

out vec4 outColor;

void main() {
  outColor = vec4(0.5,0.5,1, 0.5);
}
`;

class HoverVisualsSystem {
  constructor(scene) {
    // const geometry = new THREE.BufferGeometry();
    const geometry = new THREE.BoxBufferGeometry();
    const material = new THREE.RawShaderMaterial({ vertexShader, fragmentShader });
    // const material = new THREE.MeshStandardMaterial();
    material.transparent = true;
    material.depthFunc = THREE.LessEqualDepth;
    material.depthWrite = false;
    // material.depthTest = false;
    // material.color.set(0, 0, 0);
    console.log(material);

    this.meshes = [];
    for (let i = 0; i < 50; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      // this.mesh.matrixWorld = new THREE.Matrix4();
      mesh.matrixIsModified = true;
      // this.mesh.visible = false;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
    this.curMesh = 0;
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const hovered = interaction.state.rightRemote.hovered;
    this.curMesh = 0;
    if (hovered && hovered.object3D && hovered.components["hoverable-visuals"]) {
      hovered.object3D.traverse(o => {
        if (!o.isMesh) return;
        const mesh = this.meshes[this.curMesh++ % this.meshes.length];
        const hoveredMesh = o; //= hovered.object3DMap.mesh.children[1].children[1].children[0];
        // hoveredMesh.visible = false;
        // console.log(this.mesh, hovered, hoveredMesh, hovered.object3D);
        mesh.geometry = hoveredMesh.geometry;
        mesh.matrixWorld.copy(hoveredMesh.matrixWorld);
      });
    }
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
