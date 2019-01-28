import { paths } from "../systems/userinput/paths";
import { sets } from "../systems/userinput/sets";
import { getLastWorldPosition } from "../utils/three-utils";

// Color code from https://codepen.io/njmcode/pen/axoyD/
// Converts a #ffffff hex string into an [r,g,b] array

// Inverse of the above
const r2h = function(rgb) {
  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
};

const rgb2hsl = function(color) {
  const r = color[0] / 255;
  const g = color[1] / 255;
  const b = color[2] / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
};

const hue2rgb = function(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hsl2rgb = function(color) {
  let l = color[2];

  if (color[1] == 0) {
    l = Math.round(l * 255);
    return [l, l, l];
  } else {
    const s = color[1];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, color[0] + 1 / 3);
    const g = hue2rgb(p, q, color[0]);
    const b = hue2rgb(p, q, color[0] - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
};

const _interpolateHSL = function(color1, color2, factor) {
  if (arguments.length < 3) {
    factor = 0.5;
  }
  const hsl1 = rgb2hsl(color1);
  const hsl2 = rgb2hsl(color2);
  for (let i = 0; i < 3; i++) {
    hsl1[i] += factor * (hsl2[i] - hsl1[i]);
  }
  return hsl2rgb(hsl1);
};

function rotatingColor(t) {
  const STEP_LENGTH = 0.05;
  const color = _interpolateHSL(
    [47, 255, 200],
    [23, 64, 118],
    0.5 + 0.5 * Math.floor(Math.sin(t / 1000.0) / STEP_LENGTH) * STEP_LENGTH
  );
  return r2h(color);
}

/**
 * Manages targeting and physical cursor location. Has the following responsibilities:
 *
 * - Tracking which entities in the scene can be targeted by the cursor (`objects`).
 * - Performing a raycast per-frame or on-demand to identify which entity is being currently targeted.
 * - Updating the visual presentation and position of the `cursor` entity and `line` component per frame.
 * - Sending an event when an entity is targeted or un-targeted.
 */
AFRAME.registerComponent("cursor-controller", {
  schema: {
    cursor: { type: "selector" },
    camera: { type: "selector" },
    far: { default: 4 },
    near: { default: 0.06 },
    cursorColorHovered: { default: "#2F80ED" },
    cursorColorUnhovered: { default: "#FFFFFF" },
    rayObject: { type: "selector" },
    objects: { default: "" }
  },

  init: function() {
    this.enabled = true;

    this.data.cursor.addEventListener(
      "loaded",
      () => {
        this.data.cursor.object3DMap.mesh.renderOrder = window.APP.RENDER_ORDER.CURSOR;
      },
      { once: true }
    );

    // raycaster state
    this.setDirty = this.setDirty.bind(this);
    this.targets = [];
    this.raycaster = new THREE.Raycaster();
    this.raycaster.firstHitOnly = true; // flag specific to three-mesh-bvh
    this.dirty = true;
    this.distance = this.data.far;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: "white",
      opacity: 0.2,
      transparent: true,
      visible: false
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(2 * 3), 3));

    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.el.setObject3D("line", this.line);
  },

  update: function() {
    this.raycaster.far = this.data.far;
    this.raycaster.near = this.data.near;
    this.setDirty();
  },

  play: function() {
    this.observer = new MutationObserver(this.setDirty);
    this.observer.observe(this.el.sceneEl, { childList: true, attributes: true, subtree: true });
    this.el.sceneEl.addEventListener("object3dset", this.setDirty);
    this.el.sceneEl.addEventListener("object3dremove", this.setDirty);
  },

  pause: function() {
    this.observer.disconnect();
    this.el.sceneEl.removeEventListener("object3dset", this.setDirty);
    this.el.sceneEl.removeEventListener("object3dremove", this.setDirty);
  },

  setDirty: function() {
    this.dirty = true;
  },

  populateEntities: function(selector, target) {
    target.length = 0;
    const els = this.data.objects ? this.el.sceneEl.querySelectorAll(this.data.objects) : this.el.sceneEl.children;
    for (let i = 0; i < els.length; i++) {
      if (els[i].object3D) {
        target.push(els[i].object3D);
      }
    }
  },

  emitIntersectionEvents: function(prevIntersection, currIntersection) {
    // if we are now intersecting something, and previously we were intersecting nothing or something else
    if (currIntersection && (!prevIntersection || currIntersection.object.el !== prevIntersection.object.el)) {
      this.data.cursor.emit("raycaster-intersection", { el: currIntersection.object.el });
    }
    // if we were intersecting something, but now we are intersecting nothing or something else
    if (prevIntersection && (!currIntersection || currIntersection.object.el !== prevIntersection.object.el)) {
      this.data.cursor.emit("raycaster-intersection-cleared", { el: prevIntersection.object.el });
    }
  },

  tick: (() => {
    const rawIntersections = [];
    const cameraPos = new THREE.Vector3();

    return function(t) {
      if (this.dirty) {
        // app aware devices cares about this.targets so we must update it even if cursor is not enabled
        this.populateEntities(this.data.objects, this.targets);
        this.dirty = false;
      }

      const userinput = AFRAME.scenes[0].systems.userinput;
      const cursorPose = userinput.get(paths.actions.cursor.pose);
      const rightHandPose = userinput.get(paths.actions.rightHand.pose);

      this.data.cursor.object3D.visible = this.enabled && !!cursorPose;
      this.line.material.visible = !!(this.enabled && rightHandPose);

      if (!this.enabled || !cursorPose) {
        return;
      }

      let intersection;
      const isGrabbing = this.data.cursor.components["super-hands"].state.has("grab-start");
      if (!isGrabbing) {
        rawIntersections.length = 0;
        this.raycaster.ray.origin = cursorPose.position;
        this.raycaster.ray.direction = cursorPose.direction;
        this.raycaster.intersectObjects(this.targets, true, rawIntersections);
        intersection = rawIntersections.find(x => x.object.el);
        this.emitIntersectionEvents(this.prevIntersection, intersection);
        this.prevIntersection = intersection;
        this.distance = intersection ? intersection.distance : this.data.far;
      }

      const { cursor, near, far, camera, cursorColorHovered, cursorColorUnhovered } = this.data;

      const cursorModDelta = userinput.get(paths.actions.cursor.modDelta);
      if (isGrabbing && !userinput.activeSets.has(sets.cursorHoldingUI) && cursorModDelta) {
        this.distance = THREE.Math.clamp(this.distance - cursorModDelta, near, far);
      }
      cursor.object3D.position.copy(cursorPose.position).addScaledVector(cursorPose.direction, this.distance);
      // The cursor will always be oriented towards the player about its Y axis, so objects held by the cursor will rotate towards the player.
      getLastWorldPosition(camera.object3D, cameraPos);
      cameraPos.y = cursor.object3D.position.y;
      cursor.object3D.lookAt(cameraPos);
      cursor.object3D.scale.setScalar(Math.pow(this.distance, 0.315) * 0.75);
      cursor.object3D.matrixNeedsUpdate = true;

      const cursorColor = AFRAME.scenes[0].systems["rotate-selected-object"].rotating
        ? rotatingColor(t)
        : intersection || isGrabbing
          ? cursorColorHovered
          : cursorColorUnhovered;

      if (this.data.cursor.components.material.data.color !== cursorColor) {
        this.data.cursor.setAttribute("material", "color", cursorColor);
      }

      if (this.line.material.visible) {
        // Reach into line component for better performance
        const posePosition = cursorPose.position;
        const cursorPosition = cursor.object3D.position;
        const positionArray = this.line.geometry.attributes.position.array;

        positionArray[0] = posePosition.x;
        positionArray[1] = posePosition.y;
        positionArray[2] = posePosition.z;
        positionArray[3] = cursorPosition.x;
        positionArray[4] = cursorPosition.y;
        positionArray[5] = cursorPosition.z;

        this.line.geometry.attributes.position.needsUpdate = true;
        this.line.geometry.computeBoundingSphere();
      }
    };
  })(),

  remove: function() {
    this.emitIntersectionEvents(this.prevIntersection, null);
    delete this.prevIntersection;
  }
});
