/* global AFRAME THREE */

// See doc/spritesheet-generation.md for information about this spritesheet
import spritesheetAction from "../assets/images/spritesheets/sprite-system-action-spritesheet.json";
import spritesheetNotice from "../assets/images/spritesheets/sprite-system-notice-spritesheet.json";
import { createImageTexture } from "../utils/media-utils";
import spritesheetActionPng from "../assets/images/spritesheets/sprite-system-action-spritesheet.png";
import spritesheetNoticePng from "../assets/images/spritesheets/sprite-system-notice-spritesheet.png";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import vertexShader from "./sprites/sprite.vert";
import fragmentShader from "./sprites/sprite.frag";
import { getThemeColorShifter } from "../utils/theme-sprites";
import { disposeTexture } from "../utils/material-utils";

const MAX_SPRITES = 1024;
const SHEET_TYPES = ["action", "notice"];
const PNGS = {
  action: spritesheetActionPng,
  notice: spritesheetNoticePng
};
const ZEROS = new Array(16 * 4).fill(0);

const getSheetType = sprite => (spritesheetAction.frames[sprite.data.name] ? "action" : "notice");

const isVisible = o => {
  if (!o.visible) return false;
  if (!o.parent) return true;
  return isVisible(o.parent);
};

AFRAME.registerComponent("sprite", {
  schema: { name: { type: "string" } },
  tick() {
    // TODO when we run out of sprites we currently just stop rendering them. We need to do something better.
    if (!(this.didRegisterWithSystem || this.didFailToRegister) && this.el.sceneEl.systems["hubs-systems"]) {
      const registered = this.el.sceneEl.systems["hubs-systems"].spriteSystem.add(this);
      this.didRegisterWithSystem = registered > 0;
      this.didFailToRegister = registered < 0;
    }
  },

  update() {
    if (this.didRegisterWithSystem) {
      this.el.sceneEl.systems["hubs-systems"].spriteSystem.updateUVs(this);
    }
  },

  remove() {
    if (this.didRegisterWithSystem) {
      this.el.sceneEl.systems["hubs-systems"].spriteSystem.remove(this);
    }
  }
});

const normalizedFrame = (function() {
  const memo = new Map();
  return function normalizedFrame(name, spritesheet) {
    let ret = memo.get(name);
    if (ret) {
      return ret;
    } else {
      if (!spritesheet.frames[name]) {
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
    this.updateMatrices();
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

const getHoverableVisuals = el => {
  if (!el || !el.components) return null;
  if (el.components["hoverable-visuals"]) {
    return el.components["hoverable-visuals"];
  }
  return getHoverableVisuals(el.parentEl);
};

const enableSweepingEffect = comp => {
  const hoverableVisuals = getHoverableVisuals(comp.el);
  if (!hoverableVisuals) {
    return false;
  }

  const isPinned = hoverableVisuals.el.components.pinnable && hoverableVisuals.el.components.pinnable.data.pinned;
  const isSpawner = !!hoverableVisuals.el.components["super-spawner"];
  const isFrozen = hoverableVisuals.el.sceneEl.is("frozen");
  const hideDueToPinning = !isSpawner && isPinned && !isFrozen;
  return hoverableVisuals.data.enableSweepingEffect && !hideDueToPinning;
};

const createGeometry = maxSprites => {
  // TODO: Consider to use InstancedBufferGeometry which would be more efficient and performant
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(maxSprites * 3 * 4);
  for (let i = 0; i < maxSprites; i++) {
    positions[i * 3 * 4 + 0] = -0.5;
    positions[i * 3 * 4 + 1] = 0.5;
    positions[i * 3 * 4 + 2] = 0.0;
    positions[i * 3 * 4 + 3] = 0.5;
    positions[i * 3 * 4 + 4] = 0.5;
    positions[i * 3 * 4 + 5] = 0.0;
    positions[i * 3 * 4 + 6] = -0.5;
    positions[i * 3 * 4 + 7] = -0.5;
    positions[i * 3 * 4 + 8] = 0.0;
    positions[i * 3 * 4 + 9] = 0.5;
    positions[i * 3 * 4 + 10] = -0.5;
    positions[i * 3 * 4 + 11] = 0.0;
  }
  // We need to use "position" as the attribute name here. It was previously "a_vertices". It seems three.js
  // might assume that geometries have a "position" attribute in some cases,
  // like in https://github.com/mrdoob/three.js/pull/18044
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3, false));

  geometry.setAttribute(
    "a_hubs_EnableSweepingEffect",
    new THREE.BufferAttribute(new Float32Array(maxSprites * 4), 1, false)
  );

  geometry.setAttribute(
    "a_hubs_SweepParams",
    new THREE.BufferAttribute(new Float32Array(maxSprites * 4 * 2), 2, false)
  );

  geometry.setAttribute("a_uvs", new THREE.BufferAttribute(new Float32Array(maxSprites * 2 * 4), 2, false));
  geometry.setAttribute("a_mv", new THREE.BufferAttribute(new Float32Array(maxSprites * 16 * 4), 16, false));

  const indices = new Uint16Array(maxSprites * 3 * 2);
  for (let i = 0; i < maxSprites; i++) {
    indices[i * 3 * 2 + 0] = i * 4 + 0;
    indices[i * 3 * 2 + 1] = i * 4 + 2;
    indices[i * 3 * 2 + 2] = i * 4 + 1;
    indices[i * 3 * 2 + 3] = i * 4 + 1;
    indices[i * 3 * 2 + 4] = i * 4 + 2;
    indices[i * 3 * 2 + 5] = i * 4 + 3;
  }
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  geometry.drawRange.count = 0;

  return geometry;
};

const createMaterial = spritesheetTexture => {
  return new THREE.RawShaderMaterial({
    uniforms: {
      u_spritesheet: { value: spritesheetTexture },
      hubs_Time: { value: 0 }
    },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true
  });
};

export class SpriteSystem {
  raycast(raycaster, intersects) {
    for (const sheetType of SHEET_TYPES) {
      const sprites = this.sprites[sheetType];
      for (const sprite of sprites) {
        const o = sprite.el.object3D;
        if (isVisible(o)) {
          raycastOnSprite.call(o, raycaster, intersects);
        }
      }
    }
    return intersects;
  }

  constructor(scene) {
    this.sprites = { action: [], notice: [] };
    this.indicesFromSprites = { action: new WeakMap(), notice: new WeakMap() };
    this.meshes = { action: null, notice: null };

    waitForDOMContentLoaded().then(() => {
      for (const type in PNGS) {
        const spritesheetPng = PNGS[type];
        createImageTexture(spritesheetPng, getThemeColorShifter(type)).then(spritesheetTexture => {
          const geometry = createGeometry(MAX_SPRITES);
          const material = createMaterial(spritesheetTexture);
          const mesh = (this.meshes[type] = new THREE.Mesh(geometry, material));
          const el = document.createElement("a-entity");
          el.classList.add("ui");
          scene.appendChild(el);
          el.setObject3D("mesh", mesh);
          mesh.frustumCulled = false;
          mesh.renderOrder = window.APP.RENDER_ORDER.HUD_ICONS;
          mesh.raycast = this.raycast.bind(this);
        });
      }
    });

    APP.store.addEventListener("themechanged", () => {
      for (const type in PNGS) {
        const spritesheetPng = PNGS[type];
        // TODO: Fix me if possible
        // 1. If theme is changed before meshes are initialized, no effect to textures.
        // 2. If theme is changed before textures loading for the previous theme is completed
        // and textures loading for the new theme is completed earlier than the previous ones,
        // the previous ones are set.
        if (this.meshes[type]) {
          createImageTexture(spritesheetPng, getThemeColorShifter(type)).then(newTexture => {
            const oldTexture = this.meshes[type].material.uniforms.u_spritesheet.value;
            this.meshes[type].material.uniforms.u_spritesheet.value = newTexture;
            this.meshes[type].material.uniformsNeedUpdate = true;
            disposeTexture(oldTexture);
          });
        }
      }
    });
  }

  tick(t) {
    for (let i = 0, il = SHEET_TYPES.length; i < il; i++) {
      const sheetType = SHEET_TYPES[i];
      const mesh = this.meshes[sheetType];

      if (!mesh) continue;

      mesh.material.uniforms.hubs_Time.value = t;
      mesh.material.uniformsNeedUpdate = true;

      const geometry = mesh.geometry;
      const aMv = geometry.getAttribute("a_mv");
      const aEnableSweepingEffect = geometry.getAttribute("a_hubs_EnableSweepingEffect");
      const aSweepParams = geometry.getAttribute("a_hubs_SweepParams");
      const sprites = this.sprites[sheetType];

      let aEnableSweepingEffectNeedsUpdate = false;
      let aSweepParamsNeedsUpdate = false;

      for (let j = 0, jl = sprites.length; j < jl; j++) {
        const sprite = sprites[j];

        if (isVisible(sprite.el.object3D)) {
          const enableSweepingEffectValue = enableSweepingEffect(sprite) ? 1 : 0;
          aEnableSweepingEffect.array[j * 4 + 0] = enableSweepingEffectValue;
          aEnableSweepingEffect.array[j * 4 + 1] = enableSweepingEffectValue;
          aEnableSweepingEffect.array[j * 4 + 2] = enableSweepingEffectValue;
          aEnableSweepingEffect.array[j * 4 + 3] = enableSweepingEffectValue;
          aEnableSweepingEffectNeedsUpdate = true;

          if (enableSweepingEffectValue) {
            const hoverableVisuals = getHoverableVisuals(sprite.el);
            const s = hoverableVisuals.sweepParams[0];
            const t = hoverableVisuals.sweepParams[1];
            aSweepParams.setXY(j * 4 + 0, s, t);
            aSweepParams.setXY(j * 4 + 1, s, t);
            aSweepParams.setXY(j * 4 + 2, s, t);
            aSweepParams.setXY(j * 4 + 3, s, t);
            aSweepParamsNeedsUpdate = true;
          }

          // TODO: This tick should be invoked after updating the entire scene graph matrices.
          // If we do it, we may remove this .updateMatrices() call
          sprite.el.object3D.updateMatrices();
          const mat4 = sprite.el.object3D.matrixWorld;
          aMv.array.set(mat4.elements, j * 4 * 16);
          aMv.array.set(mat4.elements, (j * 4 + 1) * 16);
          aMv.array.set(mat4.elements, (j * 4 + 2) * 16);
          aMv.array.set(mat4.elements, (j * 4 + 3) * 16);
        } else {
          aMv.array.set(ZEROS, j * 4 * 16);
        }
      }

      aMv.needsUpdate = true;
      aMv.updateRange.count = sprites.length * 4 * 16;

      if (aEnableSweepingEffectNeedsUpdate) {
        aEnableSweepingEffect.needsUpdate = true;
        aEnableSweepingEffect.updateRange.count = sprites.length * 4;
      }

      if (aSweepParamsNeedsUpdate) {
        aSweepParams.needsUpdate = true;
        aSweepParams.updateRange.count = sprites.length * 4 * 2;
      }
    }
  }

  updateUVs(sprite) {
    const sheetType = getSheetType(sprite);
    const mesh = this.meshes[sheetType];

    // TODO: Is this guard necessary?
    if (!mesh) return;

    const indicesFromSprites = this.indicesFromSprites[sheetType];

    // TODO: Is this guard necessary?
    if (!indicesFromSprites.has(sprite)) return;

    const index = indicesFromSprites.get(sprite);
    const flipY = mesh.material.uniforms.u_spritesheet.value.flipY;
    const frame = normalizedFrame(sprite.data.name, sheetType === "action" ? spritesheetAction : spritesheetNotice);
    const aUvs = mesh.geometry.getAttribute("a_uvs");
    aUvs.setXY(index * 4 + 0, frame.x, flipY ? 1 - frame.y : frame.y);
    aUvs.setXY(index * 4 + 1, frame.x + frame.w, flipY ? 1 - frame.y : frame.y);
    aUvs.setXY(index * 4 + 2, frame.x, flipY ? 1 - frame.y - frame.h : frame.y + frame.h);
    aUvs.setXY(index * 4 + 3, frame.x + frame.w, flipY ? 1 - frame.y - frame.h : frame.y + frame.h);
    aUvs.needsUpdate = true;
    aUvs.updateRange.count = this.sprites[sheetType].length * 4 * 2;
  }

  add(sprite) {
    const sheetType = getSheetType(sprite);
    const mesh = this.meshes[sheetType];

    if (!mesh) return 0;

    const sprites = this.sprites[sheetType];
    const indicesFromSprites = this.indicesFromSprites[sheetType];

    // TODO: Is this guard necessary?
    if (indicesFromSprites.has(sprite)) {
      console.error("This sprite is already added");
      return -1;
    }

    if (sprites.length >= MAX_SPRITES) {
      console.error("Too many sprites");
      return -1;
    }

    const index = sprites.push(sprite) - 1;
    indicesFromSprites.set(sprite, index);
    this.updateUVs(sprite);

    const geometry = mesh.geometry;
    geometry.drawRange.count = sprites.length * 3 * 2;

    return 1;
  }

  remove(sprite) {
    const sheetType = getSheetType(sprite);
    const mesh = this.meshes[sheetType];

    // TODO: Is this guard necessary?
    if (!mesh) return;

    const sprites = this.sprites[sheetType];
    const indicesFromSprites = this.indicesFromSprites[sheetType];

    // TODO: Is this guard necessary?
    if (!indicesFromSprites.has(sprite)) {
      console.error("This sprite is not found");
      return;
    }

    const index = indicesFromSprites.get(sprite);
    indicesFromSprites.delete(sprite);

    const lastSprite = sprites.pop();

    if (sprite !== lastSprite) {
      // Move the last sprite to the place at the removed sprite index
      sprites[index] = lastSprite;
      indicesFromSprites.set(lastSprite, index);
      this.updateUVs(lastSprite);
    }

    const geometry = mesh.geometry;
    geometry.drawRange.count = sprites.length * 3 * 2;
  }
}
