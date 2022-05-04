import { RemoveNetworkedEntityButton } from "../utils/jsx-entity";
import { addComponent, removeComponent } from "bitecs";

AFRAME.registerComponent("remove-networked-object-button", {
  init() {
    addComponent(APP.world, RemoveNetworkedEntityButton, this.el.object3D.eid);
  },

  remove() {
    removeComponent(APP.world, RemoveNetworkedEntityButton, this.el.object3D.eid);
  }
});
