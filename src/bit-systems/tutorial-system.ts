import { AxesHelper, Object3D, Vector3 } from "three";
import { HubsWorld } from "../app";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { AElement, AScene } from "aframe";
import { ArrayVec3, renderAsEntity } from "../utils/jsx-entity";
import { TutorialImagePanel, TutorialPanel } from "../prefabs/tutorial-panels";
import { Text } from "troika-three-text";
import { FloatingTextPanel, Interacted } from "../bit-components";
import { GetTextSize, UpdatePanelSize } from "../utils/interactive-panels";
import { updateSlice9Geometry } from "../update-slice9-geometry";
import { defineQuery, enterQuery, hasComponent, removeEntity } from "bitecs";
import { degToRad } from "three/src/math/MathUtils";

const DISTANCE_THRESH = 1.5;
const PANEL_PADDING = 0.05;
const PANEL_MIN_WIDTH = 1;
const PANEL_MIN_HEIGHT = 0.5;
const ANGLE_THRESH = 44;
const waypointPos = new Vector3(-4.5, 0, -4.0);
const floatingPanelQuery = defineQuery([FloatingTextPanel]);
const floatingPanelEnterQuery = enterQuery(floatingPanelQuery);

interface StepObject {
  slides: Array<number>;
  onceFunc?: Function;
  loopFunc?: Function;
  cleanUpFunc?: Function;
}

class TutorialManager {
  allowed: boolean;
  activeStepIndex: number;
  activeStep: StepObject;
  activeSlide: number;
  stepsArray: Array<StepObject>;
  slides: Array<Object3D>;
  wellDoneStep: boolean;
  initPosition: Vector3;
  initDir: Vector3;
  avatarHead: Object3D;
  Ascene: AScene;
  panelRef: number | null;
  prevRef: number;
  nextRef: number;
  testRef: number;
  panelObj: Object3D;
  prevObj: Object3D;
  nextObj: Object3D;
  testObj: Object3D;

  constructor() {
    this.allowed = false;
    this.activeSlide = 0;
    this.activeStepIndex = 0;
  }

  Init(steps: Array<StepObject>) {
    roomPropertiesReader.waitForProperties().then(() => {
      if (!roomPropertiesReader.roomProps.tutorial.allow) {
        this.allowed = false;
        console.warn(`Tutorial is now allowed in this room`);
        return;
      }

      const avatarheadElement = document.querySelector("#avatar-pov-node") as AElement;
      this.Ascene = document.querySelector("a-scene") as AScene;
      this.avatarHead = avatarheadElement.object3D;

      const pos = roomPropertiesReader.roomProps.tutorial["position"];
      const rot = roomPropertiesReader.roomProps.tutorial["position"];
      const ratio = roomPropertiesReader.roomProps.tutorial["ratio"];

      setTimeout(() => {
        this.allowed = true;
        this.AddTutorialPanel(
          roomPropertiesReader.roomProps.tutorial.slides!,
          roomPropertiesReader.roomProps.tutorial.congrats_slides!,
          pos ? pos : [-9, 2.0, -10],
          rot ? rot : [0, degToRad(90), 0],
          ratio ? ratio : 1 / 2.2!
        );
      }, 2000);

      this.onMicEvent = this.onMicEvent.bind(this);
      this.stepsArray = steps;
    });
  }

  Tick(world: HubsWorld) {
    if (!this.allowed) return;

    floatingPanelQuery(world).forEach(_ => {
      if (hasComponent(world, Interacted, this.nextRef)) this.Next();
      if (hasComponent(world, Interacted, this.prevRef)) this.Prev();
      if (hasComponent(world, Interacted, this.testRef)) {
        this.Next(this.activeStepIndex !== this.stepsArray.length - 1);
        this.testObj.visible = false;
      }

      if (this.activeStep["loopFunc"]) this.activeStep.loopFunc();
    });
  }

  AddTutorialPanel(
    slides: Array<string>,
    congrats_slides: Array<string>,
    pos: ArrayVec3,
    rot: ArrayVec3,
    ratio: number
  ) {
    this.panelRef = renderAsEntity(APP.world, TutorialImagePanel(slides, congrats_slides, pos, rot, ratio));
    this.panelObj = APP.world.eid2obj.get(this.panelRef)!;
    APP.world.scene.add(this.panelObj);

    this.prevRef = FloatingTextPanel.prevRef[this.panelRef];
    this.nextRef = FloatingTextPanel.nextRef[this.panelRef];
    this.testRef = FloatingTextPanel.testRef[this.panelRef];

    this.prevObj = APP.world.eid2obj.get(this.prevRef) as Object3D;
    this.nextObj = APP.world.eid2obj.get(this.nextRef) as Object3D;
    this.testObj = APP.world.eid2obj.get(this.testRef) as Object3D;
    this.testObj.visible = false;
    this.slides = [];

    slides.forEach((_, index) => {
      this.slides.push(this.panelObj.getObjectByName(`slide_${index}`)!);
    });
    congrats_slides.forEach((_, index) => {
      this.slides.push(this.panelObj.getObjectByName(`congrats_slide_${index}`)!);
    });

    this.activeStep = this.stepsArray[this.activeStepIndex];
    this.RenderSlide();
    this.OnceFunc();
  }

  RemovePanel() {
    APP.world.scene.remove(this.panelObj);
    [this.panelRef, this.prevRef, this.nextRef, this.panelRef].forEach(ref => {
      removeEntity(APP.world, ref!);
    });
  }

  RenderSlide(slideNo = -1) {
    this.slides.forEach(slide => {
      slide.visible = false;
    });

    if (slideNo !== -1) {
      this.slides[slideNo].visible = true;
      return;
    }

    this.prevObj.visible = true;
    this.nextObj.visible = true;
    if (this.activeStepIndex === 0) this.prevObj.visible = false;
    else if (this.activeStepIndex === this.stepsArray.length - 1) this.nextObj.visible = false;
    this.slides[this.activeStep.slides[this.activeSlide]].visible = true;
  }

  Next(congratulate = false) {
    if (this.activeSlide === this.activeStep.slides.length - 1) {
      this.NextStep(congratulate);
    } else {
      this.activeSlide += 1;
      this.RenderSlide();
    }
  }

  Prev() {
    if (this.activeSlide === 0) this.PrevStep();
    else {
      this.activeSlide -= 1;
      this.RenderSlide();
    }
  }

  NextStep(congratulate = false) {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();

    if (congratulate) {
      this.activeStep = wellDoneStep();
    } else {
      this.activeStepIndex += 1;
      this.activeSlide = 0;

      if (this.activeStepIndex === this.stepsArray.length) {
        this.activeStepIndex = 0;
        this.activeSlide = 0;
      }

      this.activeStep = this.stepsArray[this.activeStepIndex];
    }

    this.RenderSlide();
    this.OnceFunc();
  }

  OnceFunc() {
    const startingFunc = this.activeStep["onceFunc"];
    if (startingFunc) startingFunc();
  }

  PrevStep() {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();
    this.activeStepIndex -= 1;
    this.activeStep = this.stepsArray[this.activeStepIndex];
    this.activeSlide = 0;
    this.RenderSlide();

    const startingFunc = this.activeStep["onceFunc"];
    if (startingFunc) startingFunc();
  }

  onMicEvent() {
    this.NextStep();
  }
}

export const tutorialManager = new TutorialManager();

const wellDoneStep = (): StepObject => {
  const slideNo =
    tutorialManager.slides.length -
    Math.floor(Math.random() * (roomPropertiesReader.roomProps.tutorial.congrats_slides!.length - 1) + 1);
  console.log(slideNo);
  return {
    slides: [slideNo],
    onceFunc: () => {
      tutorialManager.prevObj.visible = false;
      tutorialManager.nextObj.visible = false;
      setTimeout(() => {
        tutorialManager.Next();
      }, 2000);
    }
  };
};

const onMuting = () => {
  tutorialManager.Next(true);
};
const onUnmuting = () => {
  tutorialManager.RenderSlide(6);
  tutorialManager.Ascene.addEventListener("action_disable_mic", onMuting);
  tutorialManager.nextObj.visible = false;
  tutorialManager.prevObj.visible = false;
};
const OnToggle = () => {
  tutorialManager.Ascene.addEventListener(
    "lang-toggle",
    () => {
      tutorialManager.Next(true);
    },
    { once: true }
  );
};

export const stepsArray: Array<StepObject> = [
  {
    slides: [0],
    onceFunc: () => {
      setTimeout(() => {
        tutorialManager.Next();
      }, 5000);

      tutorialManager.nextObj.visible = false;
      tutorialManager.prevObj.visible = false;
    }
  },
  {
    slides: [1],
    onceFunc: () => {
      tutorialManager.nextObj.visible = false;
      tutorialManager.prevObj.visible = false;
      setTimeout(() => {
        tutorialManager.testObj.visible = true;
        const testText = tutorialManager.testObj.getObjectByName("Button Label") as Text;
        testText.text = "Click me!";
      }, 2000);
    }
  },
  {
    slides: [2],
    onceFunc: () => {
      tutorialManager.initPosition = tutorialManager.avatarHead.getWorldPosition(new Vector3());
    },
    loopFunc: () => {
      const currentPos = tutorialManager.avatarHead.getWorldPosition(new Vector3());
      const distance = tutorialManager.initPosition.distanceTo(currentPos.setY(tutorialManager.initPosition.y));
      if (distance >= DISTANCE_THRESH) tutorialManager.Next(true);
    }
  },
  {
    slides: [3],
    onceFunc: () => {
      tutorialManager.initDir = tutorialManager.avatarHead.getWorldDirection(new Vector3());
    },
    loopFunc: () => {
      const orientation = tutorialManager.avatarHead.getWorldDirection(new Vector3());
      const radAngle = tutorialManager.initDir.angleTo(orientation.setY(tutorialManager.initDir.y).normalize());
      const angle = THREE.MathUtils.radToDeg(radAngle);
      if (angle >= ANGLE_THRESH) tutorialManager.Next(true);
    }
  },
  {
    slides: [4, 5],
    onceFunc: () => {
      tutorialManager.Ascene.addEventListener("action_enable_mic", onUnmuting);
    },
    cleanUpFunc: () => {
      tutorialManager.Ascene.removeEventListener("action_enable_mic", onUnmuting);
    }
  },
  {
    slides: [7, 8],
    onceFunc: () => {
      tutorialManager.Ascene.addEventListener("lang-toggle", OnToggle, { once: true });
    },
    cleanUpFunc: () => {
      tutorialManager.Ascene.removeEventListener("lang-toggle", OnToggle);
    }
  },
  {
    slides: [9],
    onceFunc: () => {
      tutorialManager.testObj.visible = true;
      const testText = tutorialManager.testObj.getObjectByName("Button Label") as Text;
      testText.text = "Reset";
    },
    cleanUpFunc: () => {
      tutorialManager.testObj.visible = false;
    }
  }
];
