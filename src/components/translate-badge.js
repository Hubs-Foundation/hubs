/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-badge
 */

import { translationSystem } from "../bit-systems/translation-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { getLastWorldPosition } from "../utils/three-utils";

AFRAME.registerComponent("translate-badge", {
  init() {
    console.log(`translation badge`, this.el);
    //bindings

    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.updateFromPresenceMeta = this.updateFromPresenceMeta.bind(this);
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.onBorderStateChange = this.onBorderStateChange.bind(this);

    //status variables

    this.el.object3D.visible = false;
    this.isTarget = false;
    this.withinBorder = false;
    this.withinPresenterBorders = false;
    this.badgeAllowed = false;

    this.presenterBoders = [];
    this.borders = [];

    this.language = null;
    this.owner = null;
    this.playerSessionId = null;

    this.camWorldPos = new THREE.Vector3();
    this.translateIcon = this.el.querySelector(".translate_badge_icon").object3D;
    this.cancelIcon = this.el.querySelector(".cancel_translate_badge_icon").object3D;

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
    });

    console.log(`waiting for properties to be read`);
    roomPropertiesReader.waitForProperties().then(() => this.SetTranslationVariables());

    this.translateIcon.visible = true;
    this.cancelIcon.visible = false;
    this.el.object3D.visible = false;
  },

  tick() {
    // if translation is allowed it computes if the button should be visible based on distance and borders
    // if room is not border contstrained then variable expressing this, is set to true and does not ever change
    if (!this.cameraEl || !roomPropertiesReader.read || !roomPropertiesReader.AllowTrans) return;

    const worldPos = this.el.object3D.getWorldPosition(new THREE.Vector3());

    if (this.badgeAllowed) {
      const isVisible = this.el.object3D.visible;
      getLastWorldPosition(this.cameraEl.object3DMap.camera, this.camWorldPos);
      if (this.borders.length > 0) {
        this.withinBorder =
          worldPos.x > this.borders[0] &&
          worldPos.x < this.borders[1] &&
          worldPos.z > this.borders[2] &&
          worldPos.z < this.borders[3];
        this.withinBorder = this.withinBorder && translationSystem.prevBorderState;
      } else {
        this.withinBorder = true;
      }

      const shouldBeVisible = this.withinBorder && worldPos.distanceTo(this.camWorldPos) < 2;

      console.log(isVisible, shouldBeVisible);
      if (isVisible !== shouldBeVisible) this.el.object3D.visible = shouldBeVisible;
    }

    if (this.presenterBoders.length > 0) {
      const _withinPresenterBorders =
        worldPos.x > this.presenterBoders[0] &&
        worldPos.x < this.presenterBoders[1] &&
        worldPos.z > this.presenterBoders[2] &&
        worldPos.z < this.presenterBoders[3];

      if (this.withinPresenterBorders !== _withinPresenterBorders) {
        const eventDetails = {
          type: "presenter",
          id: this.owner,
          language: this.language,
          action: _withinPresenterBorders
        };
        APP.scene.emit("translation_updates_available", eventDetails);
      }

      this.withinPresenterBorders = _withinPresenterBorders;
    }
  },

  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.addEventListener("translation_updates_applied", this.onTargetUpdate);
    this.el.sceneEl.addEventListener("border_state_change", this.onTargetUpdate);
    if (this.badgeAllowed) this.el.sceneEl.addEventListener("translation_updates_applied", this.onTargetUpdate);
  },

  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.removeEventListener("translation_updates_applied", this.onTargetUpdate);
    this.el.sceneEl.removeEventListener("border_state_change", this.onTargetUpdate);
    if (this.badgeAllowed) this.el.sceneEl.removeEventListener("translation_updates_applied", this.onTargetUpdate);
  },

  SetTranslationVariables() {
    // reads room properties. translate button needs to be visible only if translation
    // is allowed and the conversation type is bubble. check if there is need for border check

    const transProps = roomPropertiesReader.transProps;
    if (!roomPropertiesReader.AllowTrans) return;

    //when conversation is bubble based
    if (transProps.conversation.type === "bubble") {
      this.badgeAllowed = true;
      this.onClick = () => {
        const type = this.isTarget ? "remove" : "add";
        const eventDetails = { type: type, id: this.owner, language: this.language };
        APP.scene.emit("translation_updates_available", eventDetails);
      };

      // check if there are spatiality constrains
      if (transProps.spatiality.type === "borders") this.borders = transProps.spatiality.data;
      else this.withinBorder = true;
    }

    // when conversation is with presenter
    else if (transProps.conversation.type === "presentation") {
      this.presenterBoders = transProps.conversation.data;
    }
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
