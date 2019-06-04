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
      geometry.addAttribute(
        "a_hubs_EnableSweepingEffect",
        new THREE.BufferAttribute(new Float32Array(this.maxSprites * 4), 1, false)
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
          u_spritesheet: { value: spritesheetTexture },
          hubs_IsFrozen: { value: false },
          hubs_SweepParams: { value: [0, 0] },
          hubs_InteractorOnePos: { value: [0, 0, 0] },
          hubs_InteractorTwoPos: { value: [0, 0, 0] },
          hubs_HighlightInteractorOne: { value: false },
          hubs_HighlightInteractorTwo: { value: false },
          hubs_Time: { value: 0 }
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

  tick(t, dt) {
    if (!this.mesh) return; // "await" async initialization (and pay for it forever after that)

    for (let i = 0; i < this.spriteComponents.length; i++) {
      //this.spriteComponents[i].el.object3D.matrixNeedsUpdate = true;
      this.spriteComponents[i].el.object3D.updateMatrices();
      this.set(
        this.spriteComponents[i].data.name,
        i,
        this.spriteComponents[i].el.object3D.matrixWorld,
        isVisible(this.spriteComponents[i].el.object3D),
        window.enableAll || enableSweepingEffect(this.spriteComponents[i])
      );
    }
    const aUvs = this.mesh.geometry.attributes["a_uvs"];
    const aVertices = this.mesh.geometry.attributes["a_vertices"];
    const mvCols = this.mesh.geometry.attributes["mvCol0"].data;
    const aEnableSweepingEffect = this.mesh.geometry.attributes["a_hubs_EnableSweepingEffect"];

    aUvs.array.fill(0, 8 * this.spriteComponents.length);
    aVertices.array.fill(0, 12 * this.spriteComponents.length);
    mvCols.array.fill(0, 16 * 4 * this.spriteComponents.length);
    aEnableSweepingEffect.array.fill(0, 4*this.spriteComponents.length);

    aUvs.needsUpdate = true;
    aVertices.needsUpdate = true;
    mvCols.needsUpdate = true;
    aEnableSweepingEffect.needsUpdate = true;

    this.mesh.material.uniforms.hubs_IsFrozen.value = true;
    this.mesh.material.uniforms.hubs_SweepParams.value = [-0.5, 0.5];
    this.mesh.material.uniforms.hubs_InteractorOnePos.value = [0, 0, 0];
    this.mesh.material.uniforms.hubs_InteractorTwoPos.value = [0, 0, 0];
    this.mesh.material.uniforms.hubs_HighlightInteractorOne.value = false;
    this.mesh.material.uniforms.hubs_HighlightInteractorTwo.value = false;
    this.mesh.material.uniforms.hubs_Time.value = t % 10000;
    this.mesh.material.uniformsNeedUpdate = true;

    /*
    const isPinned = el.components.pinnable && this.el.components.pinnable.data.pinned;
    const isSpawner = !!el.components["super-spawner"];
    const hideDueToPinning = !isSpawner && isPinned && !isFrozen;

    const isFrozen = AFRAME.scenes[0].is("frozen");
    let interactorOne, interactorTwo;
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (interaction.state.leftHand.hovered === el || interaction.state.leftHand.held === this.el) {
      interactorOne = interaction.options.leftHand.entity.object3D;
    }
    if (interaction.state.rightRemote.hovered === el || interaction.state.rightRemote.held === this.el) {
      interactorTwo = interaction.options.rightRemote.entity.object3D;
    }
    if (interaction.state.rightHand.hovered === el || interaction.state.rightHand.held === this.el) {
      interactorTwo = interaction.options.rightHand.entity.object3D;
    }

    if (interactorOne) {
      interactorOne.matrixWorld.toArray(interactorOneTransform);
    }
    if (interactorTwo) {
      interactorTwo.matrixWorld.toArray(interactorTwoTransform);
    }

    if (interactorOne || interactorTwo || isFrozen) {
      const worldY = el.object3D.matrixWorld.elements[13];
      const scaledRadius = el.object3D.scale.y * this.boundingSphere.radius;
      sweepParams[0] = worldY - scaledRadius;
      sweepParams[1] = worldY + scaledRadius;
    }

    const uniform = this.mesh.material.uniforms;
      uniform.hubs_EnableSweepingEffect.value = enableSweepingEffect && !hideDueToPinning;
      uniform.hubs_IsFrozen.value = isFrozen;
      uniform.hubs_SweepParams.value = sweepParams;

      uniform.hubs_HighlightInteractorOne.value = !!interactorOne && !hideDueToPinning;
      uniform.hubs_InteractorOnePos.value[0] = interactorOneTransform[12];
      uniform.hubs_InteractorOnePos.value[1] = interactorOneTransform[13];
      uniform.hubs_InteractorOnePos.value[2] = interactorOneTransform[14];

      uniform.hubs_HighlightInteractorTwo.value = !!interactorTwo && !hideDueToPinning;
      uniform.hubs_InteractorTwoPos.value[0] = interactorTwoTransform[12];
      uniform.hubs_InteractorTwoPos.value[1] = interactorTwoTransform[13];
      uniform.hubs_InteractorTwoPos.value[2] = interactorTwoTransform[14];

      if (interactorOne || interactorTwo || isFrozen) {
        uniform.hubs_Time.value = t;
      }
      */
  }

  set(spritename, i, mat4, visible, enableHoverEffect) {
    if (i >= this.maxSprites) {
      console.warn("too many sprites");
      return;
    }
    const frame = normalizedFrame(spritename, spritesheet, this.missingSprites);
    if (visible) {
      const aEnableSweepingEffect = this.mesh.geometry.attributes["a_hubs_EnableSweepingEffect"];
      const enableSweepingEffectValue = enableHoverEffect ? 1 : 0;
      aEnableSweepingEffect.array[i*4 + 0] = enableSweepingEffectValue;
      aEnableSweepingEffect.array[i*4 + 1] = enableSweepingEffectValue;
      aEnableSweepingEffect.array[i*4 + 2] = enableSweepingEffectValue;
      aEnableSweepingEffect.array[i*4 + 3] = enableSweepingEffectValue;
      aEnableSweepingEffect.needsUpdate = true;

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

function setUniforms(
  uniforms,
  el,
  time,
  sweepParams,
  boundingSphere,
  interactorOneTransform,
  interactorTwoTransform,
  enableSweepingEffect
) {
  if (!uniforms || !this.uniforms.length) return;
}
