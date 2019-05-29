/* global AFRAME THREE */

// Sprite rendering
// We have a lot of 2D images that are each rendered separately in hubs.
// Our goal is to render them all at once.

// TODO: Write explainer for spritesheet generation
import spritesheet from "../assets/images/hud/spritesheet.json";
import { createImageTexture } from "../components/media-views.js";
import spritesheetPng from "../assets/images/hud/spritesheet.png";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import vert from "./sprites/sprite.vert";
import frag from "./sprites/sprite.frag";

function isVisible(o) {
  if (!o.visible) return false;
  if (!o.parent) return true;
  return isVisible(o.parent);
}

AFRAME.registerComponent("sprite", {
  schema: { name: { type: "string" } },
  tick() {
    if (!this.didRegisterWithSystem) {
      this.didRegisterWithSystem = true;
      this.el.sceneEl.systems["hubs-systems"].spriteSystem.add(this);
    }
  },
  remove(){
    this.el.sceneEl.systems["hubs-systems"].spriteSystem.remove(this);
  }
});

function normalizedFrame(name, spritesheet) {
  const size = spritesheet.meta.size;
  const frame = spritesheet.frames[name].frame;
  return {
    x: frame.x / size.w,
    y: frame.y / size.h,
    w: frame.w / size.w,
    h: frame.h / size.h
  };
}

export class SpriteSystem {
  constructor(scene) {
    this.spriteComponents = [];
    this.maxSprites = 3;
    Promise.all([createImageTexture(spritesheetPng), waitForDOMContentLoaded()]).then(([spritesheetTexture]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.addAttribute(
        "a_vertices",
        new THREE.BufferAttribute(new Float32Array(this.maxSprites * 3 * 4), 3, false)
      );
      geometry.addAttribute("a_uvs", new THREE.BufferAttribute(new Float32Array(this.maxSprites * 2 * 4), 2, false));
      const mvCols = new THREE.InterleavedBuffer(new Float32Array(this.maxSprites * 16 * 4), 16);
      geometry.addAttribute("mvCol0", new THREE.InterleavedBufferAttribute(mvCols, 4, 0, false));
      geometry.addAttribute("mvCol1", new THREE.InterleavedBufferAttribute(mvCols, 4, 4, false));
      geometry.addAttribute("mvCol2", new THREE.InterleavedBufferAttribute(mvCols, 4, 8, false));
      geometry.addAttribute("mvCol3", new THREE.InterleavedBufferAttribute(mvCols, 4, 12, false));
      const indices = new Array(3 * 2 * this.maxSprites);
      for (let i = 0; i < this.maxSprites; i++) {
        indices[i * 3 * 2 + 0] = i * 4 + 0;
        indices[i * 3 * 2 + 1] = i * 4 + 2;
        indices[i * 3 * 2 + 2] = i * 4 + 1;
        indices[i * 3 * 2 + 3] = i * 4 + 1;
        indices[i * 3 * 2 + 4] = i * 4 + 2;
        indices[i * 3 * 2 + 5] = i * 4 + 3;
      }
      geometry.setIndex(indices);
      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_spritesheet: { value: spritesheetTexture }
          //u_projection: { value: new Float32Array(new THREE.Matrix4().identity().elements) }
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        transparent: true
      });
      this.mesh = new THREE.Mesh(geometry, material);
      const el = document.createElement("a-entity");
      scene.appendChild(el);
      el.setObject3D("mesh", this.mesh);
      this.mesh.frustumCulled = false;
    });
  }

  tick(scene) {
    if (!this.mesh) return;
    for (let i = 0; i < this.spriteComponents.length; i++) {
      this.spriteComponents[i].el.object3D.updateMatrices();
      this.set(
        this.spriteComponents[i].data.name,
        i,
        this.spriteComponents[i].el.object3D.matrixWorld,
        isVisible(this.spriteComponents[i].el.object3D)
      );
    }
    this.mesh.geometry.attributes["a_uvs"].array.fill(0, 8 * this.spriteComponents.length);
    this.mesh.geometry.attributes["a_vertices"].array.fill(0, 12 * this.spriteComponents.length);
    this.mesh.geometry.attributes["mvCol0"].data.array.fill(0, 16 * 4 * this.spriteComponents.length);
  }

  set(spritename, i, mat4, visible) {
    if (i >= this.maxSprites) {
      console.warn("too many sprites");
      return;
    }
    const frame = normalizedFrame(spritename, spritesheet);
    if (visible) {
      this.mesh.geometry.attributes["a_uvs"].setXY(i * 4 + 0, frame.x, frame.y);
      this.mesh.geometry.attributes["a_uvs"].setXY(i * 4 + 1, frame.x + frame.w, frame.y);
      this.mesh.geometry.attributes["a_uvs"].setXY(i * 4 + 2, frame.x, frame.y + frame.h);
      this.mesh.geometry.attributes["a_uvs"].setXY(i * 4 + 3, frame.x + frame.w, frame.y + frame.h);
      this.mesh.geometry.attributes["a_uvs"].needsUpdate = true;
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 0, -0.5, 0.5, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 1, 0.5, 0.5, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 2, -0.5, -0.5, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 3, 0.5, -0.5, 0);
      this.mesh.geometry.attributes["a_vertices"].needsUpdate = true;
      this.mesh.geometry.attributes["mvCol0"].data.array.set(mat4.elements, i * 4 * 16 + 0);
      this.mesh.geometry.attributes["mvCol0"].data.array.set(mat4.elements, i * 4 * 16 + 1 * 16);
      this.mesh.geometry.attributes["mvCol0"].data.array.set(mat4.elements, i * 4 * 16 + 2 * 16);
      this.mesh.geometry.attributes["mvCol0"].data.array.set(mat4.elements, i * 4 * 16 + 3 * 16);
      this.mesh.geometry.attributes["mvCol0"].data.needsUpdate = true;
    } else {
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 0, 0, 0, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 1, 0, 0, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 2, 0, 0, 0);
      this.mesh.geometry.attributes["a_vertices"].setXYZ(i * 4 + 3, 0, 0, 0);
      this.mesh.geometry.attributes["a_vertices"].needsUpdate = true;
    }
    // .data is the interleaved buffer. so we don't set mvCol1/2/3 separately
  }

  add(sprite) {
    this.spriteComponents.push(sprite);
  }

  remove(sprite) {
    this.spriteComponents.splice(this.spriteComponents.indexOf(sprite), 1);
  }
}
