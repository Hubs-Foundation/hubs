//import { COLLISION_LAYERS } from "../constants";
// import { SHAPE, TYPE } from "three-ammo/constants";

export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    this.scene.appendChild(entity);
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("networked", { template: "#interactable-iframe-media" });
  };
}
