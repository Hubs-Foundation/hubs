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
    this.onPropertiesRead = this.onPropertiesRead.bind(this);
    this.camWorldPos = new THREE.Vector3();
    this.isTarget = false;
    this.distanceBased = false;
    this.withinBorder = false;
    this.translationAllowed = false;
    this.borderConstrained = false;
    this.borders = [];

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.playerSessionId = NAF.utils.getCreator(networkedEl);

      const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
      this.owner = networkedEl.components.networked.data.owner;

      if (playerPresence) this.updateFromPresenceMeta(playerPresence.metas[0]);
    });

    waitForDOMContentLoaded().then(() => {
      this.cameraEl = document.getElementById("viewing-camera");
      // this.updateVisibility(); // this most probably is not neeeded since we check for the camera in the mainloop
    });

    this.onTargetUpdated = event => {
      // isTarget is toggled if the event is about this user
      this.isTarget = event.detail.id === this.owner ? !this.isTarget : this.isTarget;
    };

    this.onClick = () => {
      APP.scene.emit("translation_updates_available", {
        type: "target",
        id: this.owner,
        language: this.userLanguage
      });
    };

    this.el.setAttribute("visible", false);
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.addEventListener("properties_read", this.onPropertiesRead);
    this.el.sceneEl.addEventListener("target_added", this.onTargetUpdated);
    this.el.sceneEl.addEventListener("target_removed", this.onTargetUpdated);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
    this.el.sceneEl.removeEventListener("properties_read", this.onPropertiesRead);
    this.el.sceneEl.removeEventListener("target_added", this.onTargetUpdated);
    this.el.sceneEl.removeEventListener("target_removed", this.onTargetUpdated);
  },
  tick() {
    // if translation is allowed it computes if the button should be visible based on distance and borders
    // if room is not border contstrained then variable expressing this, is set to true and does not ever change
    if (!(this.cameraEl && this.translationAllowed)) return;
    const isVisible = this.el.object3D.visible;
    getLastWorldPosition(this.cameraEl.object3DMap.camera, this.camWorldPos);
    const worldPos = this.el.object3D.getWorldPosition(new THREE.Vector3());
    if (this.borderConstrained)
      this.withinBorder =
        this.borders[0] < worldPos.x < this.borders[1] && this.borders[2] < worldPos.z < this.borders[3];

    const shouldBeVisible = this.withinBorder && !this.isTarget && worldPos.distanceTo(this.camWorldPos) < 2;
    if (isVisible !== shouldBeVisible) this.el.setAttribute("visible", shouldBeVisible);
  },
  onPropertiesRead({ detail: roomProps }) {
    // reads room properties. translate button needs to be visible only if translation
    // is allowed and the conversation type is bubble. check if there is need for border check

    this.translationAllowed = roomProps.translation.allow && roomProps.translation.conversation.type === "bubble";
    if (!this.translationAllowed) return;

    this.borderConstrained = roomProps.translation.spatiality.type === "borders";

    if (this.borderConstrained) {
      this.borders = roomProps.spatiality.data;
      //add event listener for border status changed
    } else this.withinBorder = true; //start checking
  },

  onPresenceUpdated({ detail: presenceMeta }) {
    if (presenceMeta.sessionId === this.playerSessionId) {
      this.updateFromPresenceMeta(presenceMeta);
    }
  },
  //need for bind?
  updateFromPresenceMeta(presenceMeta) {
    this.userLanguage = presenceMeta.profile.language;

    APP.scene.emit("translation_updates_available", {
      type: "properties",
      id: this.owner,
      language: this.userLanguage
    });
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
