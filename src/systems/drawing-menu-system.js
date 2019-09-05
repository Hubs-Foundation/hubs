import { waitForDOMContentLoaded } from "../utils/async-utils";

/**
 * Drawing Menu System
 * A tool that allows drawing on networked-drawing components.
 * @namespace drawing
 * @component pen
 */

function almostEquals(epsilon, u, v) {
  return Math.abs(u.x - v.x) < epsilon && Math.abs(u.y - v.y) < epsilon && Math.abs(u.z - v.z) < epsilon;
}

export class DrawingMenuSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;

    this.sceneEl.addEventListener("stateremoved", this.hideMenus.bind(this));

    this.lastIntersection = new THREE.Vector3();

    this.drawingMenus = [];
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;

    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.setDirty);

    waitForDOMContentLoaded().then(() => {
      this.cursorControllers = document.querySelectorAll("[cursor-controller]");
      this.camera = this.sceneEl.querySelector("#avatar-pov-node");
      this.observer.observe(this.sceneEl, { childList: true, attributes: true, subtree: true });
      this.sceneEl.addEventListener("object3dset", this.setDirty.bind(this));
      this.sceneEl.addEventListener("object3dremove", this.setDirty.bind(this));
    });
  }

  tick() {
    if (!this.cursorControllers || this.cursorControllers.length === 0 || !this.camera) return;

    if (this.sceneEl.is("frozen")) {
      if (this.dirty) {
        this.populateEntities(this.targets);
        this.dirty = false;
      }

      const interaction = AFRAME.scenes[0].systems.interaction;

      const hovered = this.getHovered();
      if (hovered) {
        for (let i = 0; i < this.cursorControllers.length; i++) {
          if (this.cursorControllers[i].components["cursor-controller"].intersection) {
            const intersectionPoint = this.cursorControllers[i].components["cursor-controller"].intersection.point;
            this.showMenu(hovered, intersectionPoint);
          }
        }
      }
      this.handleButtons();
      this.scaleMenus();
    }
  }

  getMenuScale(distance) {
    if (distance <= 1.5) {
      return 0.5;
    }
    return Math.min(3, distance - 1);
  }

  scaleMenus = (() => {
    const cameraWorldPos = new THREE.Vector3();
    return function() {
      if (!this.drawingMenus || this.drawingMenus.length === 0) return;

      this.camera.object3D.getWorldPosition(cameraWorldPos);

      for (let i = 0; i < this.drawingMenus.length; i++) {
        const menu = this.drawingMenus[i];
        if (menu.object3D.visible && !menu.getAttribute("animation__show")) {
          const dist = cameraWorldPos.distanceTo(menu.object3D.position);
          menu.object3D.scale.setScalar(this.getMenuScale(dist));
          menu.object3D.matrixNeedsUpdate = true;
        }
      }
    };
  })();

  handleButtons = (() => {
    const remotes = ["rightRemote", "leftRemote"];
    return function() {
      const interaction = AFRAME.scenes[0].systems.interaction;
      const userinput = AFRAME.scenes[0].systems.userinput;

      for (let i = 0; i < remotes.length; i++) {
        const remote = remotes[i];
        if (interaction.state[remote]) {
          const hovered = interaction.state[remote].hovered;
          if (
            hovered &&
            interaction.options[remote] &&
            userinput.get(interaction.options[remote].grabPath) &&
            hovered.components.tags &&
            hovered.components.tags.data.singleActionButton &&
            hovered.parentEl.parentEl.components["networked-drawing"]
          ) {
            if (hovered.classList.contains("undo-drawing")) {
              hovered.parentEl.parentEl.components["networked-drawing"].undoDraw();
            } else if (hovered.classList.contains("delete-drawing")) {
              NAF.utils.takeOwnership(hovered.parentEl.parentEl);
              this.sceneEl.removeChild(hovered.parentEl.parentEl);
            }
          }
        }
      }
    };
  })();

  getHovered() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    let hovered = null;
    if (
      interaction.state.leftRemote &&
      interaction.state.leftRemote.hovered &&
      interaction.state.leftRemote.hovered.classList.contains("drawing")
    ) {
      hovered = interaction.state.leftRemote.hovered;
    } else if (
      interaction.state.rightRemote &&
      interaction.state.rightRemote.hovered &&
      interaction.state.rightRemote.hovered.classList.contains("drawing")
    ) {
      hovered = interaction.state.rightRemote.hovered;
    }
    return hovered;
  }

  showMenu = (() => {
    const position = new THREE.Vector3();
    const cameraWorldPos = new THREE.Vector3();
    return function(hovered, intersectionPoint) {
      const menu = hovered.children[0];

      if (!menu.object3D.visible || !almostEquals(0.25, intersectionPoint, this.lastIntersection)) {
        this.camera.object3D.getWorldPosition(cameraWorldPos);
        position
          .subVectors(cameraWorldPos, intersectionPoint)
          .normalize()
          .multiplyScalar(0.1);
        menu.object3D.position.copy(intersectionPoint).add(position);
        menu.object3D.lookAt(cameraWorldPos);
        menu.object3D.matrixNeedsUpdate = true;
        menu.object3D.visible = true;
        this.lastIntersection.copy(intersectionPoint);

        const isMine = hovered.components.networked.isMine();
        if (!isMine) {
          menu.querySelector(".undo-drawing").object3D.visible = false;
          const deleteButton = menu.querySelector(".delete-drawing");
          deleteButton.object3D.position.y = 0.125;
          deleteButton.object3D.matrixNeedsUpdate = true;
        }

        const dist = cameraWorldPos.distanceTo(menu.object3D.position);
        const finalScale = this.getMenuScale(dist);

        menu.removeAttribute("animation__show");

        menu.setAttribute("animation__show", {
          property: "scale",
          dur: 300,
          from: { x: finalScale * 0.8, y: finalScale * 0.8, z: finalScale * 0.8 },
          to: { x: finalScale, y: finalScale, z: finalScale },
          easing: "easeOutElastic"
        });

        menu.addEventListener(
          "animationcomplete",
          () => {
            menu.removeAttribute("animation__show");
          },
          { once: true }
        );
      }
    };
  })();

  hideMenus() {
    if (!this.drawingMenus) return;

    for (let i = 0; i < this.drawingMenus.length; i++) {
      this.drawingMenus[i].object3D.visible = false;
    }
  }

  setDirty() {
    this.dirty = true;
  }

  populateEntities() {
    this.drawingMenus = this.sceneEl.querySelectorAll(".drawing-menu");
  }
}
