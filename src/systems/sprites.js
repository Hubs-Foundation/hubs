/* global AFRAME THREE */

// See doc/spritesheet-generation.md for information about this spritesheet
import spritesheet from "../assets/images/spritesheets/sprite-system-spritesheet.json";
import { createImageTexture } from "../utils/media-utils";
import spritesheetPng from "../assets/images/spritesheets/sprite-system-spritesheet.png";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import vert from "./sprites/sprite.vert";
import frag from "./sprites/sprite.frag";

const multiviewVertPrefix = [
  // GLSL 3.0 conversion
  "#version 300 es",
  "#define attribute in",
  "#define varying out",
  "#define texture2D texture",
  "#extension GL_OVR_multiview : require",
  "layout(num_views = 2) in;",
  "uniform mat4 modelViewMatrix;",
  "uniform mat4 modelViewMatrix2;",
  "#define modelViewMatrix (gl_ViewID_OVR==0u?modelViewMatrix:modelViewMatrix2)",
  "uniform mat4 projectionMatrix;",
  "uniform mat4 projectionMatrix2;",
  "#define projectionMatrix (gl_ViewID_OVR==0u?projectionMatrix:projectionMatrix2)",
  ""
].join("\n");
const nonmultiviewVertPrefix = ["uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", ""].join("\n");

const multiviewFragPrefix = [
  "#version 300 es",
  "#define varying in",
  "out highp vec4 pc_fragColor;",
  "#define gl_FragColor pc_fragColor",
  "#define texture2D texture",
  ""
].join("\n");

const nonmultiviewFragPrefix = "";

function isVisible(o) {
  if (!o.visible) return false;
  if (!o.parent) return true;
  return isVisible(o.parent);
}

AFRAME.registerComponent("sprite", {
  schema: { name: { type: "string" } },
  tick() {
    // TODO when we run out of sprites we currently just stop rendering them. We need to do something better.
    if (!(this.didRegisterWithSystem || this.didFailToRegister) && this.el.sceneEl.systems["post-physics"]) {
      const registered = this.el.sceneEl.systems["post-physics"].spriteSystem.add(this);
      this.didRegisterWithSystem = registered > 0;
      this.didFailToRegister = registered < 0;
    }
  },

  update() {
    if (this.didRegisterWithSystem) {
      this.el.sceneEl.systems["post-physics"].spriteSystem.updateUVs(this);
    }
  },

  remove() {
    if (this.didRegisterWithSystem) {
      this.el.sceneEl.systems["post-physics"].spriteSystem.remove(this);
    }
  }
});

const normalizedFrame = (function() {
  const memo = new Map();
  return function normalizedFrame(name, spritesheet, missingSprites) {
    let ret = memo.get(name);
    if (ret) {
      return ret;
    } else {
      if (!spritesheet.frames[name]) {
        if (missingSprites.indexOf(name) === -1) {
          missingSprites.push(name);
        }
        ret = { x: 0, y: 0, w: 0, h: 0 };
        memo.set(name, ret);
        return ret;
      }
      const size = spritesheet.meta.size;
      const frame = spritesheet.frames[name].frame;
      ret = {
        x: frame.x / size.w,
        y: frame.y / size.h,
        w: frame.w / size.w,
        h: frame.h / size.h
      };
      memo.set(name, ret);
      return ret;
    }
  };
})();

const raycastOnSprite = (function() {
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const vD = new THREE.Vector3();
  const point = new THREE.Vector3();
  const intersectionInfo = { distance: 0, point, object: null };

  return function raycast(raycaster, intersects) {
    vA.set(-0.5, 0.5, 0).applyMatrix4(this.matrixWorld);
    vB.set(0.5, 0.5, 0).applyMatrix4(this.matrixWorld);
    vC.set(-0.5, -0.5, 0).applyMatrix4(this.matrixWorld);
    let intersect = raycaster.ray.intersectTriangle(vA, vC, vB, false, point);
    if (intersect === null) {
      vD.set(0.5, -0.5, 0).applyMatrix4(this.matrixWorld);
      intersect = raycaster.ray.intersectTriangle(vB, vC, vD, false, point);
      if (intersect === null) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(point);
    if (distance < raycaster.near || distance > raycaster.far) return;

    intersectionInfo.distance = distance;
    intersectionInfo.point = point;
    intersectionInfo.object = this;
    intersects.push(intersectionInfo);
  };
})();

function getHoverableVisuals(el) {
  if (!el || !el.components) return null;
  if (el.components["hoverable-visuals"]) {
    return el.components["hoverable-visuals"];
  }
  return getHoverableVisuals(el.parentEl);
}

function enableSweepingEffect(comp) {
  const hoverableVisuals = getHoverableVisuals(comp.el);
  if (!hoverableVisuals) {
    return false;
  }

  const isPinned = hoverableVisuals.el.components.pinnable && hoverableVisuals.el.components.pinnable.data.pinned;
  const isSpawner = !!hoverableVisuals.el.components["super-spawner"];
  const isFrozen = hoverableVisuals.el.sceneEl.is("frozen");
  const hideDueToPinning = !isSpawner && isPinned && !isFrozen;
  return hoverableVisuals.data.enableSweepingEffect && !hideDueToPinning;
}

function createGeometry(maxSprites) {
  const geometry = new THREE.BufferGeometry();
  geometry.addAttribute("a_vertices", new THREE.BufferAttribute(new Float32Array(maxSprites * 3 * 4), 3, false));
  geometry.addAttribute(
    "a_hubs_EnableSweepingEffect",
    new THREE.BufferAttribute(new Float32Array(maxSprites * 4), 1, false)
  );
  geometry.addAttribute(
    "a_hubs_SweepParams",
    new THREE.BufferAttribute(new Float32Array(maxSprites * 4 * 2), 2, false)
  );
  geometry.addAttribute("a_uvs", new THREE.BufferAttribute(new Float32Array(maxSprites * 2 * 4), 2, false));
  const mvCols = new THREE.InterleavedBuffer(new Float32Array(maxSprites * 16 * 4), 16);
  geometry.addAttribute("mvCol0", new THREE.InterleavedBufferAttribute(mvCols, 4, 0, false));
  geometry.addAttribute("mvCol1", new THREE.InterleavedBufferAttribute(mvCols, 4, 4, false));
  geometry.addAttribute("mvCol2", new THREE.InterleavedBufferAttribute(mvCols, 4, 8, false));
  geometry.addAttribute("mvCol3", new THREE.InterleavedBufferAttribute(mvCols, 4, 12, false));
  const indices = new Array(3 * 2 * maxSprites);
  for (let i = 0; i < maxSprites; i++) {
    indices[i * 3 * 2 + 0] = i * 4 + 0;
    indices[i * 3 * 2 + 1] = i * 4 + 2;
    indices[i * 3 * 2 + 2] = i * 4 + 1;
    indices[i * 3 * 2 + 3] = i * 4 + 1;
    indices[i * 3 * 2 + 4] = i * 4 + 2;
    indices[i * 3 * 2 + 5] = i * 4 + 3;
  }
  geometry.setIndex(indices);
  return geometry;
}

const ZEROS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export class SpriteSystem {
  raycast(raycaster, intersects) {
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) continue;

      const o = this.indexWithSprite.get(i).el.object3D;
      if (isVisible(o)) {
        raycastOnSprite.call(o, raycaster, intersects);
      }
    }
    return intersects;
  }
  constructor(scene) {
    this.missingSprites = [];
    this.maxSprites = 512;
    this.slots = new Array(this.maxSprites);
    this.spriteWithIndex = new Map();
    this.indexWithSprite = new Map();
    this.stack = new Array(this.maxSprites);
    for (let i = 0; i < this.maxSprites; i++) {
      this.stack[i] = this.maxSprites - 1 - i;
    }

    const vertexShader = String.prototype.concat(
      scene.renderer.vr.multiview ? multiviewVertPrefix : nonmultiviewVertPrefix,
      vert
    );
    const fragmentShader = String.prototype.concat(
      scene.renderer.vr.multiview ? multiviewFragPrefix : nonmultiviewFragPrefix,
      frag
    );
    Promise.all([createImageTexture(spritesheetPng), waitForDOMContentLoaded()]).then(([spritesheetTexture]) => {
      const material = new THREE.RawShaderMaterial({
        uniforms: {
          u_spritesheet: { value: spritesheetTexture },
          hubs_Time: { value: 0 }
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true
      });
      this.mesh = new THREE.Mesh(createGeometry(this.maxSprites), material);
      const el = document.createElement("a-entity");
      el.classList.add("ui");
      scene.appendChild(el);
      el.setObject3D("mesh", this.mesh);
      this.mesh.frustumCulled = false;
      this.mesh.renderOrder = window.APP.RENDER_ORDER.HUD_ICONS;
      this.mesh.raycast = this.raycast.bind(this);
    });
  }

  tick(t) {
    if (!this.mesh) return;

    this.mesh.material.uniforms.hubs_Time.value = t;
    this.mesh.material.uniformsNeedUpdate = true;

    const mvCols = this.mesh.geometry.attributes["mvCol0"].data; // interleaved
    const aEnableSweepingEffect = this.mesh.geometry.attributes["a_hubs_EnableSweepingEffect"];
    const aSweepParams = this.mesh.geometry.attributes["a_hubs_SweepParams"];
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) continue;

      const sprite = this.indexWithSprite.get(i);
      if (isVisible(sprite.el.object3D)) {
        const enableSweepingEffectValue = enableSweepingEffect(sprite) ? 1 : 0;
        aEnableSweepingEffect.array[i * 4 + 0] = enableSweepingEffectValue;
        aEnableSweepingEffect.array[i * 4 + 1] = enableSweepingEffectValue;
        aEnableSweepingEffect.array[i * 4 + 2] = enableSweepingEffectValue;
        aEnableSweepingEffect.array[i * 4 + 3] = enableSweepingEffectValue;
        aEnableSweepingEffect.needsUpdate = true;
        if (enableSweepingEffectValue) {
          const hoverableVisuals = getHoverableVisuals(sprite.el);
          const s = hoverableVisuals.sweepParams[0];
          const t = hoverableVisuals.sweepParams[1];
          aSweepParams.setXY(4 * i + 0, s, t);
          aSweepParams.setXY(4 * i + 1, s, t);
          aSweepParams.setXY(4 * i + 2, s, t);
          aSweepParams.setXY(4 * i + 3, s, t);
          aSweepParams.needsUpdate = true;
        }

        sprite.el.object3D.updateMatrices();
        const mat4 = sprite.el.object3D.matrixWorld;
        mvCols.array.set(mat4.elements, i * 4 * 16 + 0);
        mvCols.array.set(mat4.elements, i * 4 * 16 + 1 * 16);
        mvCols.array.set(mat4.elements, i * 4 * 16 + 2 * 16);
        mvCols.array.set(mat4.elements, i * 4 * 16 + 3 * 16);
        mvCols.needsUpdate = true;
      } else {
        mvCols.array.set(ZEROS, i * 4 * 16 + 0);
        mvCols.array.set(ZEROS, i * 4 * 16 + 1 * 16);
        mvCols.array.set(ZEROS, i * 4 * 16 + 2 * 16);
        mvCols.array.set(ZEROS, i * 4 * 16 + 3 * 16);
        mvCols.needsUpdate = true;
      }
    }
  }

  updateUVs(sprite) {
    const flipY = this.mesh.material.uniforms.u_spritesheet.value.flipY;
    const i = this.spriteWithIndex.get(sprite);
    const frame = normalizedFrame(sprite.data.name, spritesheet, this.missingSprites);
    const aUvs = this.mesh.geometry.attributes["a_uvs"];

    aUvs.setXY(i * 4 + 0, frame.x, flipY ? 1 - frame.y : frame.y);
    aUvs.setXY(i * 4 + 1, frame.x + frame.w, flipY ? 1 - frame.y : frame.y);
    aUvs.setXY(i * 4 + 2, frame.x, flipY ? 1 - frame.y - frame.h : frame.y + frame.h);
    aUvs.setXY(i * 4 + 3, frame.x + frame.w, flipY ? 1 - frame.y - frame.h : frame.y + frame.h);
    aUvs.needsUpdate = true;
  }

  add(sprite) {
    if (!this.mesh) {
      return 0;
    }
    const i = this.stack.pop();
    if (i === undefined) {
      console.error("Too many sprites");
      return -1;
    }
    this.slots[i] = true;
    this.spriteWithIndex.set(sprite, i);
    this.indexWithSprite.set(i, sprite);

    this.updateUVs(sprite);

    const aVertices = this.mesh.geometry.attributes["a_vertices"];
    aVertices.setXYZ(i * 4 + 0, -0.5, 0.5, 0);
    aVertices.setXYZ(i * 4 + 1, 0.5, 0.5, 0);
    aVertices.setXYZ(i * 4 + 2, -0.5, -0.5, 0);
    aVertices.setXYZ(i * 4 + 3, 0.5, -0.5, 0);
    aVertices.needsUpdate = true;
    return 1;
  }

  remove(sprite) {
    const i = this.spriteWithIndex.get(sprite);
    this.spriteWithIndex.delete(sprite);
    this.indexWithSprite.delete(i);
    this.slots[i] = false;
    this.stack.push(i);

    const mvCols = this.mesh.geometry.attributes["mvCol0"].data; // interleaved
    mvCols.array.set(ZEROS, i * 4 * 16 + 0);
    mvCols.array.set(ZEROS, i * 4 * 16 + 1 * 16);
    mvCols.array.set(ZEROS, i * 4 * 16 + 2 * 16);
    mvCols.array.set(ZEROS, i * 4 * 16 + 3 * 16);
    mvCols.needsUpdate = true;
  }
}
