export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", "primitive: box; width: 1; height: 1; depth: 1");
    entity.setAttribute("material", "color: red");
    entity.setAttribute("class", "interactable");
    entity.setAttribute("is-remote-hover-target", "");
    entity.setAttribute("hoverable-visuals", "");
    this.scene.appendChild(entity);
  };
}
