import { subtitleSystem } from "../bit-systems/subtitling-system";
/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-button
 */
AFRAME.registerComponent("translate-button", {
  init() {
    this.onPresenceUpdated = this.onPresenceUpdated.bind(this);
    this.updateFromPresenceMeta = this.updateFromPresenceMeta.bind(this);

    NAF.utils.getNetworkedEntity(this.el).then(networkedEl => {
      this.playerSessionId = NAF.utils.getCreator(networkedEl);
      const playerPresence = window.APP.hubChannel.presence.state[this.playerSessionId];
      this.owner = networkedEl.components.networked.data.owner;
      if (playerPresence) {
        this.updateFromPresenceMeta(playerPresence.metas[0]);
      }
      console.log(playerPresence);
      if (playerPresence) {
        this.updateFromPresenceMeta(playerPresence.metas[0]);
      }
    });
    this.onTargetUpdate = event => {
      const text = this.el.querySelector(".translate-button-text").object3D;
      if (event.detail.owner === this.owner) {
        text.el.setAttribute("text", {
          value: "Stop"
        });
      } else {
        text.el.setAttribute("text", {
          value: "Translate"
        });
      }
    };

    this.onClick = () => {
      subtitleSystem.SelectTarget(this.owner);
      if (!!this.userLanguage) {
        subtitleSystem.SetSourceLanguage(languages[this.userLanguage]);
      } else {
        subtitleSystem.SetSourceLanguage(this.userLanguage);
      }
    };
  },
  play() {
    this.el.object3D.addEventListener("interact", this.onClick);
    APP.scene.addEventListener("translation-target-updated", this.onTargetUpdate);
    this.el.sceneEl.addEventListener("presence_updated", this.onPresenceUpdated);
  },
  pause() {
    this.el.object3D.removeEventListener("interact", this.onClick);
    this.el.sceneEl.removeEventListener("presence_updated", this.onPresenceUpdated);
  },
  onPresenceUpdated({ detail: presenceMeta }) {
    if (presenceMeta.sessionId === this.playerSessionId) {
      this.updateFromPresenceMeta(presenceMeta);
    }
  },
  //need for bind?
  updateFromPresenceMeta(presenceMeta) {
    this.userLanguage = presenceMeta.profile.language;

    if (subtitleSystem.target === this.owner) {
      subtitleSystem.SetSourceLanguage(this.userLanguage);
      console.log(`Setting source language to ${this.userLanguage}`);
      return;
    }
    console.log(`Setting ${this.owner} language to ${this.userLanguage} without changing source language`);
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
