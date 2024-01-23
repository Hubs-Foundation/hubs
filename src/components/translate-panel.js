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
    this.targetLanguageCheck = false;
    this.userLanguageCheck = false;
    this.userCheck = false;

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
    APP.scene.addEventListener("translation_target_language_updated", this.onTargetLanguageUpdate);

    this.translateText.el.setAttribute("text", {
      value: this.formattedText
    });

    this.checkAndRender();
  },

  pause() {
    APP.scene.removeEventListener("translation-available", this.onAvailableTranslation);
    APP.scene.removeEventListener("translation-target-updated", this.onTargetUpdate);
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdate);
    APP.scene.removeEventListener("translation_target_language_updated", this.onTargetLanguageUpdate);
  },

  onAvailableTranslation(event) {
    this.preformatText = event.detail.text;
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
    this.userCheck = this.owner === event.detail.owner;
    this.checkAndRender();
  },

  onLanguageUpdate(event) {
    this.userLanguageCheck = !!event.detail.language;
    this.checkAndRender();
  },

  onTargetLanguageUpdate(event) {
    console.log(`target lanugage changed to: ${event.detail.language}`);
    this.targetLanguageCheck = !!event.detail.language;
    this.checkAndRender();
  },

  checkAndRender() {
    const check = this.userCheck && this.targetLanguageCheck && this.userLanguageCheck;
    this.el.object3D.visible = check;
    console.log(
      `Panel updates. user check: ${this.userCheck} | user lanugage check: ${this.userLanguageCheck} | target language check: ${this.targetLanguageCheck}, should be visible: ${check}`
    );
  }
});
