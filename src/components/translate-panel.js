/**
 * Registers a click handler and invokes the block method on the NAF adapter for the owner associated with its entity.
 * @namespace network
 * @component translate-panel
 */

import { Vector3 } from "three";
import { FromatNewText } from "../bit-systems/agent-slideshow-system";
const PANEL_PADDING = 0.05;

AFRAME.registerComponent("translate-panel", {
  init() {
    this.translateText = this.el.querySelector(".translate-text").object3D;
    this.translateBackground = this.el.querySelector(".translate-background").object3D;
    this.onAvailableTranslation = this.onAvailableTranslation.bind(this);
    this.updateTextSize = this.updateTextSize.bind(this);
    this.fortmatLines = this.fortmatLines.bind(this);
    this.onTargetUpdate = this.onTargetUpdate.bind(this);
    this.size = new Vector3();
    this.preformatText;
    this.formattedText;
  },

  play() {
    APP.scene.addEventListener("translation-available", this.onAvailableTranslation);
    APP.scene.addEventListener("translation-target-updated", this.onTargetUpdate);
    this.translateText.el.setAttribute("text", {
      value: this.formattedText
    });
    this.onTargetUpdate({ detail: { owner: null } });
  },

  pause() {
    APP.scene.removeEventListener("translation-available", this.onAvailableTranslation);
    APP.scene.removeEventListener("translation-target-updated", this.onTargetUpdate);
  },
  onAvailableTranslation(event) {
    this.preformatText = event.detail.text;
    this.fortmatLines();
    console.log(this.formattedText);
    this.translateText.el.addEventListener("text-updated", this.updateTextSize);
    this.translateText.el.setAttribute("text", {
      value: this.formattedText
    });
  },

  updateTextSize() {
    this.translateText.el.components["text"].getSize(this.size);
    console.log(`text size is`);
    console.log(this.size);
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
    NAF.utils
      .getNetworkedEntity(this.el)
      .then(networkedEl => {
        const owner = networkedEl.components.networked.data.owner;
        this.el.object3D.visible = owner === event.detail.owner;
      })
      .catch(error => {
        console.error(error);
      });
  }
});
