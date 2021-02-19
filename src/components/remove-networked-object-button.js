import { removeNetworkedObject } from "../utils/removeNetworkedObject";

AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    this.onClick = () => {
      removeNetworkedObject(this.el.sceneEl, this.targetEl);
      this.el.parentNode.removeAttribute("visibility-while-frozen");
      this.el.parentNode.setAttribute("visible", false);
    };

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.targetEl = networkedEl;
    });
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
  }
});
