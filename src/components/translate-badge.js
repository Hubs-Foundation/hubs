/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-badge
 */

import { translationSystem } from "../bit-systems/translation-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { getLastWorldPosition } from "../utils/three-utils";

AFRAME.registerComponent("translate-badge", {
  init() {
    //bindings
    this.onPropertiesRead = this.onPropertiesRead.bind(this);
    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.updateFromPresenceMeta = this.updateFromPresenceMeta.bind(this);
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.onBorderStateChange = this.onBorderStateChange.bind(this);

    //status variables

    this.el.object3D.visible = false;
    this.isTarget = false;
    this.withinBorder = false;
    this.badgeAllowed = false;
    this.borderConstrained = false;
    this.language = "";
    this.playerSessionId;
    this.borders = [];
    this.owner;
    this.camWorldPos = new THREE.Vector3();
    this.translateIcon = this.el.querySelector(".translate_badge_icon").object3D;
    this.cancelIcon = this.el.querySelector(".cancel_translate_badge_icon").object3D;

    console.log(this.translateIcon);
    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.playerSessionId = NAF.utils.getCreator(networkedEl);
        const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
        this.owner = networkedEl.components.networked.data.owner;
        if (playerPresence) {
          this.updateFromPresenceMeta(playerPresence.metas[0]);
        }
      })
      .catch(error => console.log(error));

    waitForDOMContentLoaded().then(() => {
      this.cameraEl = document.getElementById("viewing-camera");
      // this.updateVisibility(); // this most probably is not neeeded since we check for the camera in the mainloop
    });

    this.onClick = () => {
      const type = this.isTarget ? "remove" : "add";
      const eventDetails = { type: type, id: this.owner, language: this.language };
      APP.scene.emit("translation_updates_available", eventDetails);
    };

    this.badgeAllowed = translationSystem.allowed && translationSystem.transProperties.conversation === "bubble";
    if (!this.badgeAllowed) return;

    this.borderConstrained = translationSystem.transProperties.spatiality.type === "borders";

    if (this.borderConstrained) {
      this.borders = translationSystem.transProperties.spatiality.data;
      //add event listener for border status changed
    } else this.withinBorder = true; //start checking

    this.translateIcon.visible = true;
    this.cancelIcon.visible = false;
    this.el.object3D.visible = false;
  },

  tick() {
    // if translation is allowed it computes if the button should be visible based on distance and borders
    // if room is not border contstrained then variable expressing this, is set to true and does not ever change
    if (!(this.cameraEl && this.badgeAllowed)) {
      return;
    }

    const isVisible = this.el.object3D.visible;
    getLastWorldPosition(this.cameraEl.object3DMap.camera, this.camWorldPos);
    const worldPos = this.el.object3D.getWorldPosition(new THREE.Vector3());
    if (this.borderConstrained) {
      this.withinBorder =
        this.borders[0] < worldPos.x < this.borders[1] && this.borders[2] < worldPos.z < this.borders[3];
      this.withinBorder = this.withinBorder && translationSystem.prevBorderState;
    }

    const shouldBeVisible = this.withinBorder && worldPos.distanceTo(this.camWorldPos) < 2;
    if (isVisible !== shouldBeVisible) this.el.object3D.visible = shouldBeVisible;
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.addEventListener("properties_read", this.onPropertiesRead);
    this.el.sceneEl.addEventListener("translation_updates_applied", this.onTargetUpdate);
    this.el.sceneEl.addEventListener("border_state_change", this.onTargetUpdate);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.removeEventListener("properties_read", this.onPropertiesRead);
    this.el.sceneEl.removeEventListener("translation_updates_applied", this.onTargetUpdate);
    this.el.sceneEl.removeEventListener("border_state_change", this.onTargetUpdate);
  },

  onPropertiesRead({ detail: roomProps }) {
    // reads room properties. translate button needs to be visible only if translation
    // is allowed and the conversation type is bubble. check if there is need for border check

    this.badgeAllowed = roomProps.translation.allow && roomProps.translation.conversation === "bubble";
    if (!this.badgeAllowed) return;

    this.borderConstrained = roomProps.translation.spatiality.type === "borders";

    if (this.borderConstrained) {
      this.borders = roomProps.translation.spatiality.data;
      //add event listener for border status changed
    } else this.withinBorder = true; //start checking
  },

  onPresenceUpdated({ detail: presenceMeta }) {
    if (presenceMeta.sessionId === this.playerSessionId) {
      this.updateFromPresenceMeta(presenceMeta);
    }
  },
  updateFromPresenceMeta(presenceMeta) {
    this.language = presenceMeta.profile.language;
    console.log(`user ${this.playerSessionId} langugage updated to ${this.language}`);
    if (this.isTarget) {
      const eventDetails = { type: "add", id: this.owner, language: this.language };
      APP.scene.emit("translation_updates_available", eventDetails);
    }
  },
  onTargetUpdate({ detail: event }) {
    if (event.id !== this.owner) return;

    const _IsTarget = event.type === "add";

    if (this.isTarget !== _IsTarget) {
      this.translateIcon.visible = !_IsTarget;
      this.cancelIcon.visible = _IsTarget;
      this.isTarget = _IsTarget;
    }
  },
  onBorderStateChange({ detail: currentState }) {
    this.withinBorder = currentState;
  }
});
