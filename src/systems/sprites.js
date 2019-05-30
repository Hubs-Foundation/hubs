/* global AFRAME THREE */

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
    if (!this.didRegisterWithSystem && this.el.sceneEl.systems["post-physics"]) {
      this.didRegisterWithSystem = true;
      this.el.sceneEl.systems["post-physics"].spriteSystem.add(this);
    }
  },
  remove() {
    this.el.sceneEl.systems["post-physics"].spriteSystem.remove(this);
  }
});

function normalizedFrame(name, spritesheet, missingSprites) {
  if (!spritesheet.frames[name]) {
    if (missingSprites.indexOf(name) === -1) {
      missingSprites.push(name);
    }
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const size = spritesheet.meta.size;
  const frame = spritesheet.frames[name].frame;
  return {
    x: frame.x / size.w,
    y: frame.y / size.h,
    w: frame.w / size.w,
    h: frame.h / size.h
  };
}

const raycastOnSprite = (function() {
  const intersectPoint = new THREE.Vector3();
  const worldScale = new THREE.Vector3();
  const mvPosition = new THREE.Vector3();

  const alignedPosition = new THREE.Vector2();
  const rotatedPosition = new THREE.Vector2();
  const viewWorldMatrix = new THREE.Matrix4();

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();

  const CENTER = new THREE.Vector2(0.5, 0.5);

  function transformVertex(vertexPosition, mvPosition, center, scale, sin, cos) {
    // compute position in camera space
    alignedPosition
      .subVectors(vertexPosition, center)
      .addScalar(0.5)
      .multiply(scale);

    // to check if rotation is not zero
    if (sin !== undefined) {
      rotatedPosition.x = cos * alignedPosition.x - sin * alignedPosition.y;
      rotatedPosition.y = sin * alignedPosition.x + cos * alignedPosition.y;
    } else {
      rotatedPosition.copy(alignedPosition);
    }

    vertexPosition.copy(mvPosition);
    vertexPosition.x += rotatedPosition.x;
    vertexPosition.y += rotatedPosition.y;

    // transform to world space
    vertexPosition.applyMatrix4(viewWorldMatrix);
  }

  return function raycast(raycaster, intersects) {
    worldScale.setFromMatrixScale(this.matrixWorld);
    this.modelViewMatrix.multiplyMatrices(AFRAME.scenes[0].camera.matrixWorldInverse, this.matrixWorld);
    viewWorldMatrix.getInverse(this.modelViewMatrix).premultiply(this.matrixWorld);
    mvPosition.setFromMatrixPosition(this.modelViewMatrix);

    //    var rotation = this.material.rotation;
    //    var sin, cos;
    //    if (rotation !== 0) {
    //      cos = Math.cos(rotation);
    //      sin = Math.sin(rotation);
    //    }

    transformVertex(vA.set(-0.5, 0.5, 0), mvPosition, CENTER, worldScale); //, sin, cos);
    transformVertex(vB.set(0.5, 0.5, 0), mvPosition, CENTER, worldScale); //, sin, cos);
    transformVertex(vC.set(-0.5, -0.5, 0), mvPosition, CENTER, worldScale); //, sin, cos);

    uvA.set(0, 0);
    uvB.set(1, 0);
    uvC.set(1, 1);

    // check first triangle
    let intersect = raycaster.ray.intersectTriangle(vA, vC, vB, false, intersectPoint);

    if (intersect === null) {
      // check second triangle
      transformVertex(vA.set(0.5, -0.5, 0), mvPosition, CENTER, worldScale); //, sin, cos);
      uvA.set(0, 1);

      intersect = raycaster.ray.intersectTriangle(vB, vC, vA, false, intersectPoint);
      if (intersect === null) {
        return;
      }
    }

    const distance = raycaster.ray.origin.distanceTo(intersectPoint);

    if (distance < raycaster.near || distance > raycaster.far) return;

    intersects.push({
      distance: distance,
      point: intersectPoint.clone(),
      uv: THREE.Triangle.getUV(intersectPoint, vA, vB, vC, uvA, uvB, uvC, new THREE.Vector2()),
      face: null,
      object: this
    });
  };
})();

export class SpriteSystem {
  raycast(raycaster, intersects) {
    for (let i = 0; i < this.spriteComponents.length; i++) {
      const o = this.spriteComponents[i].el.object3D;
      if (isVisible(o)) {
        raycastOnSprite.call(o, raycaster, intersects);
      }
    }
    return intersects;
  }
  constructor(scene) {
    this.missingSprites = [];
    this.spriteComponents = [];
    this.maxSprites = 100;
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
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        transparent: true
      });
      this.mesh = new THREE.Mesh(geometry, material);
      const el = document.createElement("a-entity");
      el.classList.add("ui");
      scene.appendChild(el);
      el.setObject3D("mesh", this.mesh);
      this.mesh.frustumCulled = false;
      this.mesh.renderOrder = window.APP.RENDER_ORDER.HUD_ICONS;
      this.mesh.raycast = this.raycast.bind(this);
    });
  }

  tick() {
    if (!this.mesh) return; // "await" async initialization (and pay for it forever after that)

    for (let i = 0; i < this.spriteComponents.length; i++) {
      this.spriteComponents[i].el.object3D.matrixNeedsUpdate = true;
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
    const frame = normalizedFrame(spritename, spritesheet, this.missingSprites);
    if (visible) {
      const aUvs = this.mesh.geometry.attributes["a_uvs"];
      aUvs.setXY(i * 4 + 0, frame.x, frame.y);
      aUvs.setXY(i * 4 + 1, frame.x + frame.w, frame.y);
      aUvs.setXY(i * 4 + 2, frame.x, frame.y + frame.h);
      aUvs.setXY(i * 4 + 3, frame.x + frame.w, frame.y + frame.h);
      aUvs.needsUpdate = true;

      const aVertices = this.mesh.geometry.attributes["a_vertices"];
      aVertices.setXYZ(i * 4 + 0, -0.5, 0.5, 0);
      aVertices.setXYZ(i * 4 + 1, 0.5, 0.5, 0);
      aVertices.setXYZ(i * 4 + 2, -0.5, -0.5, 0);
      aVertices.setXYZ(i * 4 + 3, 0.5, -0.5, 0);
      aVertices.needsUpdate = true;

      const mvCols = this.mesh.geometry.attributes["mvCol0"].data; // interleaved
      mvCols.array.set(mat4.elements, i * 4 * 16 + 0);
      mvCols.array.set(mat4.elements, i * 4 * 16 + 1 * 16);
      mvCols.array.set(mat4.elements, i * 4 * 16 + 2 * 16);
      mvCols.array.set(mat4.elements, i * 4 * 16 + 3 * 16);
      mvCols.needsUpdate = true;
    } else {
      const aVertices = this.mesh.geometry.attributes["a_vertices"];
      aVertices.setXYZ(i * 4 + 0, 0, 0, 0);
      aVertices.setXYZ(i * 4 + 1, 0, 0, 0);
      aVertices.setXYZ(i * 4 + 2, 0, 0, 0);
      aVertices.setXYZ(i * 4 + 3, 0, 0, 0);
      aVertices.needsUpdate = true;
    }
  }

  add(sprite) {
    this.spriteComponents.push(sprite);
  }

  remove(sprite) {
    this.spriteComponents.splice(this.spriteComponents.indexOf(sprite), 1);
  }
}
