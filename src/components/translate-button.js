import { subtitleSystem } from "../bit-systems/subtitling-system";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { getLastWorldPosition } from "../utils/three-utils";
/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-button
 */
AFRAME.registerComponent("translate-button", {
  init() {
    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.updateFromPresenceMeta = this.updateFromPresenceMeta.bind(this);
    this.updateVisibility = this.updateVisibility.bind(this);
    this.onTranslationStopped = this.onTranslationStopped.bind(this);

    this.camWorldPos = new THREE.Vector3();
    this.objWorldPos = new THREE.Vector3();
    this.isTarget = false;

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.playerSessionId = NAF.utils.getCreator(networkedEl);

      const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
      this.owner = networkedEl.components.networked.data.owner;

      if (playerPresence) this.updateFromPresenceMeta(playerPresence.metas[0]);
    });

    waitForDOMContentLoaded().then(() => {
      this.cameraEl = document.getElementById("viewing-camera");
      this.updateVisibility();
    });

    this.onTargetUpdate = event => {
      this.isTarget = event.detail.owner === this.owner;
    };

    this.onClick = () => {
      APP.scene.emit("translation_updates_available", {
        type: "target",
        target: this.owner,
        language: this.userLanguage,
        micStatus: this.micStatus
      });
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.sceneEl.addEventListener("translation-target-updated", this.onTargetUpdate);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.addEventListener("translation-stopped", this.onTranslationStopped);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.removeEventListener("translation-target-updated", this.onTargetUpdate);
    this.el.sceneEl.removeEventListener("translation-stopped", this.onTranslationStopped);
  },
  tick() {
    this.updateVisibility();
  },
  onTranslationStopped() {
    this.isTarget = false;
  },

  onPresenceUpdated({ detail: presenceMeta }) {
    if (presenceMeta.sessionId === this.playerSessionId) {
      this.updateFromPresenceMeta(presenceMeta);
    }
  },
  //need for bind?
  updateFromPresenceMeta(presenceMeta) {
    this.userLanguage = presenceMeta.profile.language;
    this.micStatus = presenceMeta.profile.micStatus;

    if (subtitleSystem.target === this.owner) {
      APP.scene.emit("translation_updates_available", {
        type: "properties",
        language: this.userLanguage,
        micStatus: this.micStatus
      });
    }
  },
  updateVisibility() {
    if (!this.cameraEl) {
      this.el.setAttribute("visible", false);
      return;
    }

    const isVisible = this.el.object3D.visible;

    getLastWorldPosition(this.cameraEl.object3DMap.camera, this.camWorldPos);
    this.objWorldPos = this.el.object3D.getWorldPosition(new THREE.Vector3());

    const distance = this.objWorldPos.distanceTo(this.camWorldPos);

    const shouldBeVisible = distance < 2 && !this.isTarget;

    if (isVisible !== shouldBeVisible) {
      this.el.setAttribute("visible", shouldBeVisible);
    }
  }
});

export const languages = {
  Greek: "gr",
  English: "en",
  German: "de",
  Dutch: "du",
  Spanish: "es",
  Italian: "it"
};
