import { waitForDOMContentLoaded } from "../utils/async-utils";
import { SOUND_PEN_UNDO_DRAW } from "./sound-effects-system";

/**
 * Drawing Menu System
 * A system for showing menus for drawings.
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
    this.buttonMap = {};

    waitForDOMContentLoaded().then(() => {
      this.cursorControllers = document.querySelectorAll("[cursor-controller]");
      this.camera = this.sceneEl.querySelector("#avatar-pov-node");
    });
  }

  tick() {
    if (!this.cursorControllers || this.cursorControllers.length === 0 || !this.camera) return;

    if (this.sceneEl.is("frozen") && window.APP.hubChannel.can("spawn_drawing")) {
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
            userinput.get(interaction.options[remote].grabPath) &&
            hovered.components.tags &&
            hovered.components.tags.data.singleActionButton
          ) {
            if (this.buttonMap[hovered.object3D.uuid]) {
              const networkedEntity = this.buttonMap[hovered.object3D.uuid];
              if (hovered.classList.contains("undo-drawing")) {
                networkedEntity.components["networked-drawing"].undoDraw();
                this.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_PEN_UNDO_DRAW);
              } else if (hovered.classList.contains("delete-drawing")) {
                NAF.utils.takeOwnership(networkedEntity);
                this.sceneEl.removeChild(networkedEntity);
              } else if (hovered.classList.contains("serialize-drawing")) {
                networkedEntity.components["networked-drawing"].serializeDrawing().then(() => {
                  const networkedEntity = this.buttonMap[hovered.object3D.uuid];
                  NAF.utils.takeOwnership(networkedEntity);
                  this.sceneEl.removeChild(networkedEntity);
                });
              }
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
        menu.querySelector(".undo-drawing").object3D.visible = isMine;
        menu.querySelector(".serialize-drawing").object3D.visible =
          isMine && window.APP.hubChannel.can("spawn_and_move_media");

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

  registerDrawingMenu(networkedDrawingEl) {
    const menuEl = networkedDrawingEl.querySelector(".drawing-menu");
    this.drawingMenus.push(menuEl);
    const undoButton = menuEl.querySelector(".undo-drawing");
    this.buttonMap[undoButton.object3D.uuid] = networkedDrawingEl;
    const deleteButton = menuEl.querySelector(".delete-drawing");
    this.buttonMap[deleteButton.object3D.uuid] = networkedDrawingEl;
    const serializeButton = menuEl.querySelector(".serialize-drawing");
    this.buttonMap[serializeButton.object3D.uuid] = networkedDrawingEl;
  }

  unregisterDrawingMenu(networkedDrawingEl) {
    const menuEl = networkedDrawingEl.querySelector(".drawing-menu");
    const idx = this.drawingMenus.indexOf(menuEl);
    if (idx !== -1) {
      this.drawingMenus.splice(idx, 1);
    }
    const undoButton = menuEl.querySelector(".undo-drawing");
    delete this.buttonMap[undoButton.object3D.uuid];
    const deleteButton = menuEl.querySelector(".delete-drawing");
    delete this.buttonMap[deleteButton.object3D.uuid];
    const serializeButton = menuEl.querySelector(".serialize-drawing");
    delete this.buttonMap[serializeButton.object3D.uuid];
  }
}
