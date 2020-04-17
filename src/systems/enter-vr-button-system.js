import configs from "../utils/configs";

let uiRoot;
export class EnterVRButtonSystem {
  constructor(scene) {
    this.scene = scene;
    this.wasGhost = false;
  }
  enableButton() {
    this.scene.setAttribute("vr-mode-ui", "enabled", true);
    this.scene.components["vr-mode-ui"].enterVREl.style.display = "block";
    this.scene.components["vr-mode-ui"].enterVREl.style.bottom = "80px";
  }
  disableButton() {
    this.scene.components["vr-mode-ui"].enterVREl.style.display = "none";
  }
  tick() {
    if (this.scene.is("entered")) {
      return;
    }
    uiRoot = uiRoot || document.getElementById("ui-root");
    const enable =
      configs.feature("enable_lobby_ghosts") &&
      uiRoot &&
      uiRoot.firstChild &&
      (uiRoot.firstChild.classList.contains("isGhost") && !uiRoot.firstChild.classList.contains("hide"));
    if (enable && !this.enabled) {
      this.enableButton();
    } else if (this.enabled && !enable) {
      this.disableButton();
    }
    this.enabled = enable;
  }
}
