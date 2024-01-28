/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-panel
 */

import { Vector3 } from "three";
import { FromatNewText } from "../bit-systems/agent-slideshow-system";
import { subtitleSystem } from "../bit-systems/subtitling-system";
const PANEL_PADDING = 0.05;

AFRAME.registerComponent("translate-panel", {
  init() {
    this.translateText = this.el.querySelector(".translate-text").object3D;
    this.translateBackground = this.el.querySelector(".translate-background").object3D;
    this.onAvailableTranslation = this.onAvailableTranslation.bind(this);
    this.updateTextSize = this.updateTextSize.bind(this);
    this.fortmatLines = this.fortmatLines.bind(this);
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.onLanguageUpdate = this.onLanguageUpdate.bind(this);
    this.checkAndRender = this.checkAndRender.bind(this);
    this.onTargetLanguageUpdate = this.onTargetLanguageUpdate.bind(this);

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
  },

  play() {
    APP.scene.addEventListener("translation-available", this.onAvailableTranslation);
    APP.scene.addEventListener("translation-target-updated", this.onTargetUpdate);
    APP.scene.addEventListener("language_updated", this.onLanguageUpdate);
    APP.scene.addEventListener("translation_target_properties_updated", this.onTargetLanguageUpdate);

    this.translateText.el.setAttribute("text", {
      value: this.formattedText
    });

    this.checkAndRender();
  },

  pause() {
    APP.scene.removeEventListener("translation-available", this.onAvailableTranslation);
    APP.scene.removeEventListener("translation-target-updated", this.onTargetUpdate);
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdate);
    APP.scene.removeEventListener("translation_target_properties_updated", this.onTargetLanguageUpdate);
  },
  onAvailableTranslation(event) {
    this.UpdateText(event.detail.text);
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

  onTargetUpdate(event) {
    this.user = this.owner === event.detail.owner;
    this.targetLanguage = event.detail.language;
    console.log(`Target Updated. Target language  : ${this.targetLanguage}`);
    this.checkAndRender();
  },

  onLanguageUpdate(event) {
    this.userLanguage = event.detail.language;
    this.checkAndRender();
  },

  onTargetLanguageUpdate(event) {
    console.log(`target lanugage changed to: ${event.detail.language}`);
    if (this.targetLanguage === event.detail.language) return;
    this.targetLanguage = event.detail.language;
    this.checkAndRender();
  },

  checkAndRender() {
    const check = !!this.user && !!this.targetLanguage && !!this.userLanguage;
    this.el.object3D.visible = check;
    const langCode = subtitleSystem.mylanguage ? subtitleSystem.mylanguage : "en";
    if (check) this.UpdateText(GreetingPhrases[langCode]);
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
