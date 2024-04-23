import { AScene } from "aframe";
import { Object3D } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { HelpImagePanel } from "../prefabs/help-panel";
import { languageCodes, translationSystem } from "./translation-system";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { FloatingTextPanel, Interacted } from "../bit-components";
import { hasComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";

class HelpButton {
  Ascene: AScene;
  slidesCount: number;
  panelRef: number;
  prevRef: number;
  nextRef: number;
  testRef: number;
  activeSlideIndex: number;

  panelObj: Object3D;
  prevObj: Object3D;
  nextObj: Object3D;
  testObj: Object3D;

  slideLinks: Array<string>;
  slidesObjs: Array<Object3D>;

  constructor() {
    this.activeSlideIndex = 0;
    this.onToggle = this.onToggle.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  NextSlide() {
    this.SetSlide(this.activeSlideIndex + 1);
  }

  PrevSlide() {
    this.SetSlide(this.activeSlideIndex - 1);
  }

  SetSlide(newIndex: number) {
    this.activeSlideIndex = newIndex;

    this.nextObj.visible = true;
    this.prevObj.visible = true;

    if (newIndex === this.slidesObjs.length - 1) this.nextObj.visible = false;
    if (newIndex === 0) this.prevObj.visible = false;
    this.RenderActiveSlide();
  }

  RenderActiveSlide() {
    this.slidesObjs.forEach(slide => {
      slide.visible = false;
    });
    this.slidesObjs[this.activeSlideIndex].visible = true;
  }

  Init(reset: boolean) {
    if (reset) {
      APP.scene!.removeEventListener("help-toggle", this.onToggle);
      APP.scene!.removeEventListener("clear-scene", this.onClear);
    }
    const language = translationSystem.mylanguage as "english" | "spanish" | "german" | "dutch" | "greek" | "italian";
    const languageCode = languageCodes[language];

    this.slidesCount = roomPropertiesReader.helpProps.slides!;
    this.slideLinks = [];
    this.slidesObjs = [];

    for (let i = 0; i < this.slidesCount; i++)
      this.slideLinks.push(`${roomPropertiesReader.serverURL}/help/${languageCode}_help_${i}.png`);

    this.slideLinks.push(
      `${roomPropertiesReader.serverURL}/help/${languageCode}_help_${
        roomPropertiesReader.AllowsNav ? "nav" : "noNav"
      }.png`
    );

    APP.scene!.addEventListener("help-toggle", this.onToggle);
    APP.scene!.addEventListener("clear-scene", this.onClear);
  }

  RenderPanel() {
    this.panelRef = renderAsEntity(APP.world, HelpImagePanel(this.slideLinks, roomPropertiesReader.helpProps.ratio!));
    this.panelObj = APP.world.eid2obj.get(this.panelRef)!;
    APP.world.scene.add(this.panelObj);

    this.prevRef = FloatingTextPanel.prevRef[this.panelRef];
    this.nextRef = FloatingTextPanel.nextRef[this.panelRef];
    this.testRef = FloatingTextPanel.testRef[this.panelRef];

    this.prevObj = APP.world.eid2obj.get(this.prevRef)!;
    this.nextObj = APP.world.eid2obj.get(this.nextRef)!;
    this.testObj = APP.world.eid2obj.get(this.testRef)!;

    this.testObj.visible = false;

    this.slideLinks.forEach((_, index) => {
      this.slidesObjs.push(this.panelObj.getObjectByName(`slide_${index}`)!);
    });

    (APP.scene as AScene).addState("help");

    this.SetSlide(0);
  }

  RemovePanel() {
    removeEntity(APP.world, this.panelRef);
    APP.world.scene.remove(this.panelObj);
    this.slidesObjs = [];

    (APP.scene as AScene).removeState("help");
  }

  Tick(world: HubsWorld) {
    if (hasComponent(world, Interacted, this.nextRef)) this.NextSlide();
    if (hasComponent(world, Interacted, this.prevRef)) this.PrevSlide();
  }

  onToggle() {
    if ((APP.scene as AScene).is("help")) {
      this.RemovePanel();
    } else {
      (APP.scene as AScene).emit("clear-scene");
      this.RenderPanel();
    }
  }

  onClear() {
    if ((APP.scene as AScene).is("help")) {
      this.RemovePanel();
    }
  }
}

export const helpButton = new HelpButton();
