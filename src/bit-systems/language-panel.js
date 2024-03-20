import { translationSystem } from "./translation-system";
import { FlagPanelManager, Interacted } from "../bit-components";
import { renderAsEntity } from "../utils/jsx-entity";
import { defineQuery, enterQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { selectMaterial, normalMaterial, HUDLangPanel } from "../prefabs/hud-lang-panel";

const panelManagerQuery = defineQuery([FlagPanelManager]);
const enterpanelManagerQuery = enterQuery(panelManagerQuery);
const exitpanelManagerQuery = exitQuery(panelManagerQuery);

class objElement {
  constructor() {
    this.eid = null;
    this.obj = null;
  }
  update(eid) {
    this.eid = eid;
    this.obj = APP.world.eid2obj.get(eid);
  }
}

export class LanguagePanel {
  constructor() {
    this.initialized = false;
    this.panel = new objElement();
    this.flagButtons = {
      italian: new objElement(),
      spanish: new objElement(),
      dutch: new objElement(),
      german: new objElement(),
      greek: new objElement(),
      english: new objElement()
    };
    this.Setup = this.Setup.bind(this);
    this.Remove = this.Remove.bind(this);
    this.Update = this.Update.bind(this);

    this.onLanguageUpdated = this.onLanguageUpdated.bind(this);
    this.onClear = this.onClear.bind(this);
    this.onToggle = this.onToggle.bind(this);
  }

  Init(reset) {
    if (reset) return;

    APP.scene.addEventListener("lang-toggle", this.onToggle);
    APP.scene.addEventListener("clear-scene", this.onClear);
  }

  Instantiate() {
    const eid = renderAsEntity(APP.world, HUDLangPanel());
    const obj = APP.world.eid2obj.get(eid);
    APP.world.scene.add(obj);
    APP.scene.addState("panel");
  }

  Remove() {
    APP.world.scene.remove(this.panel.obj.parent);
    removeEntity(APP.world, this.panel.eid);
    APP.scene.removeState("panel");
  }

  Setup(panelEid) {
    this.panel.update(panelEid);
    const refs = {
      german: FlagPanelManager.deRef[panelEid],
      dutch: FlagPanelManager.duRef[panelEid],
      spanish: FlagPanelManager.esRef[panelEid],
      italian: FlagPanelManager.itRef[panelEid],
      greek: FlagPanelManager.elRef[panelEid],
      english: FlagPanelManager.enRef[panelEid]
    };

    Object.keys(refs).forEach(key => {
      this.flagButtons[key].update(refs[key]);
    });

    this.Update(translationSystem.mylanguage);
    APP.scene.addEventListener("language_updated", this.onLanguageUpdated);
  }

  Update(language) {
    try {
      Object.keys(this.flagButtons).forEach(key => {
        this.flagButtons[key].obj.material = normalMaterial.clone();
      });
      if (language) {
        this.flagButtons[language].obj.material = selectMaterial.clone();
      }
    } catch (e) {
      console.error(e);
    }
  }

  Cleanup(eid) {
    if (this.panel.eid === eid) this.panel.update(null);
    Object.keys(this.flagButtons).forEach(key => {
      this.flagButtons[key].update(null);
    });
    APP.scene.removeEventListener("language_updated", this.onLanguageUpdated);
  }

  Interactions(world) {
    let closePanel = false;
    Object.keys(this.flagButtons).forEach(key => {
      if (hasComponent(world, Interacted, this.flagButtons[key].eid)) {
        closePanel = true;
        if (translationSystem.mylanguage !== key) translationSystem.updateMyLanguage(key);
      }
    });

    if (closePanel) APP.scene.emit("lang-toggle");
  }

  onLanguageUpdated(event) {
    this.Update(event.detail.language);
  }

  onClear() {
    if (APP.scene.is("panel")) {
      this.Remove();
    }
  }

  onToggle() {
    if (!APP.scene.is("panel")) {
      APP.scene.emit("clear-scene");
      this.Instantiate();
    } else {
      this.Remove();
    }
  }
}

export const languagePanel = new LanguagePanel();

export function FlagPanelSystem(world) {
  enterpanelManagerQuery(world).forEach(panelEid => {
    languagePanel.Setup(panelEid);
  });
  exitpanelManagerQuery(world).forEach(panelEid => {
    languagePanel.Cleanup(panelEid);
  });
  panelManagerQuery(world).forEach(panelEid => {
    languagePanel.Interactions(world);
  });
}
