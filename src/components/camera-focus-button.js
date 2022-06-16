import { CameraTool, MyCameraTool } from "../bit-components";
import { anyEntityWith } from "../utils/bit-utils";
import { findComponentsInNearestAncestor } from "../utils/scene-graph";

const tmpPos = new THREE.Vector3();
AFRAME.registerComponent("camera-focus-button", {
  schema: {
    track: { default: false },
    selector: { default: null }
  },

  init() {
    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      if (this.data.selector) {
        this.targetEl = networkedEl.querySelector(this.data.selector);
      } else {
        this.targetEl = networkedEl;
      }
    });

    this.onClick = () => {
      const myCam = anyEntityWith(APP.world, MyCameraTool);
      if (!myCam) return;

      if (this.data.track) {
        const tracking = CameraTool.trackTarget[myCam];
        CameraTool.trackTarget[myCam] = tracking === this.targetEl.eid ? 0 : this.targetEl.eid;
      } else {
        this.targetEl.object3D.getWorldPosition(tmpPos);
        APP.world.eid2obj.get(myCam).lookAt(tmpPos);
      }
    };

    this.menuPlacementRoots = findComponentsInNearestAncestor(this.el, "position-at-border");
  },

  tick() {
    const isVisible = this.el.object3D.visible;
    const shouldBeVisible = !!anyEntityWith(APP.world, MyCameraTool);
    if (isVisible !== shouldBeVisible) {
      this.el.object3D.visible = shouldBeVisible;
      for (let i = 0; i < this.menuPlacementRoots.length; i++) {
        this.menuPlacementRoots[i].markDirty();
      }
    }
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
