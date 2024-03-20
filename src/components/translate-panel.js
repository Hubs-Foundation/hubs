/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-panel
 */

import { Vector3 } from "three";
import { translationSystem } from "../bit-systems/translation-system";

const PANEL_PADDING = 0.05;

AFRAME.registerComponent("translate-panel", {
  init() {
    this.translateText = this.el.querySelector(".translate-text").object3D;
    this.translateBackground = this.el.querySelector(".translate-background").object3D;

    this.updateTextSize = this.updateTextSize.bind(this);
    this.fortmatLines = this.fortmatLines.bind(this);
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.onLanguageUpdate = this.onLanguageUpdate.bind(this);

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.playerSessionId = NAF.utils.getCreator(networkedEl);
        this.owner = networkedEl.components.networked.data.owner;
      })
      .catch(error => console.log(error));

    this.size = new Vector3();
    this.preformatText;
    this.formattedText;
    this.targetLanguage = false;
    this.userLanguage = window.APP.store.state.profile.language;
    this.user = false;

    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        this.owner = networkedEl.components.networked.data.owner;
      })
      .catch(error => {
        console.error(error);
      });

    this.onAvailableTranslation = ({ detail: response }) => {
      if (response.id === this.owner) this.UpdateText(response.text);
    };

    this.el.object3D.visible = false;
  },

  play() {
    this.el.sceneEl.addEventListener("translation_updates_applied", this.onTargetUpdate);
    this.el.sceneEl.addEventListener("language_updated", this.onLanguageUpdate);
  },

  pause() {
    this.el.sceneEl.removeEventListener("translation_updates_applied", this.onTargetUpdated);
    this.el.sceneEl.removeEventListener("language_updated", this.onLanguageUpdate);
  },

  UpdateText(text) {
    if (!text) return;
    this.preformatText = text;
    this.fortmatLines();
    this.translateText.el.addEventListener("text-updated", this.updateTextSize);
    this.translateText.el.setAttribute("text", {
      value: this.formattedText
    });
  },

  updateTextSize() {
    this.translateText.el.components["text"].getSize(this.size);
    this.translateBackground.el.setAttribute("slice9", {
      width: this.size.x + PANEL_PADDING * 2,
      height: this.size.y + PANEL_PADDING * 2
    });
  },

  fortmatLines() {
    const lines = this.preformatText.split(/\s+/);
    const line_size = lines.length;
    const maxStep = 7;
    const step = line_size / 2 > maxStep ? maxStep : line_size > 3 ? Math.ceil(line_size / 2) : line_size;
    this.formattedText = lines.map((word, index) => (index % step === step - 1 ? word + "\n" : word)).join(" ");
  },

  onTargetUpdate({ detail: updates }) {
    if (updates.id !== this.owner) return;

    const show = updates.type === "add";
    if (show && !this.el.object3D.visible) {
      this.el.sceneEl.addEventListener("translation_available", this.onAvailableTranslation);
      this.UpdateText(GreetingPhrases[translationSystem.mylanguage]);
    } else if (!show) this.el.sceneEl.removeEventListener("translation_available", this.onAvailableTranslation);

    this.el.object3D.visible = show;
  },

  onLanguageUpdate({ detail: language }) {
    console.log("new language", language);
    this.UpdateText(GreetingPhrases[translationSystem.mylanguage]);
  }
});

const GreetingPhrases = {
  spanish: "La traducción se mostrará aquí",
  italian: "La traduzione verrà mostrata qui",
  greek: "Η μετάφραση θα εμφανιστεί εδώ",
  dutch: "De vertaling wordt hier getoond",
  german: "Die Übersetzung wird hier angezeigt",
  english: "The translation will be displayed here"
};
