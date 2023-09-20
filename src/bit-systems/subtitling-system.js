import { paths } from "../systems/userinput/paths";

export class SubtitleSystem {
  constructor() {
    this.language;
    this.target;
    this.VRmode;
    this.targetLanguage;
    this.scene;
    this.initialized;
  }

  Init() {
    this.language = null;
    this.target = null;
    this.targetLanguage = null;
    this.VRmode = this.scene.is("vr-mode");
    this.scene = APP.scene;
    this.initialized = true;
  }

  SelectTarget(target) {
    this.target = target;
  }

  HasTarget() {
    return !!this.target;
  }
}

export const subtitleSystem = new SubtitleSystem();
