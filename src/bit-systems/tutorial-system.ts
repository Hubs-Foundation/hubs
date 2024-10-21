import { AxesHelper, Object3D, Vector3 } from "three";
import { HubsWorld } from "../app";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { AElement, AScene } from "aframe";
import { ArrayVec3, renderAsEntity } from "../utils/jsx-entity";
import { MovingTutorialImagePanel, StaticTutorialImagePanel } from "../prefabs/tutorial-panels";
import { Text } from "troika-three-text";
import { CursorRaycastable, FloatingTextPanel, Interacted } from "../bit-components";
import {
  addComponent,
  defineQuery,
  enterQuery,
  entityExists,
  hasComponent,
  removeComponent,
  removeEntity
} from "bitecs";
import { languageCodes, translationSystem } from "./translation-system";
import { navSystem } from "./routing-system";
import { avatarPos, virtualAgent } from "./agent-system";
import { changeHub } from "../change-hub";
import { preload } from "../utils/preload";
import { loadTexture } from "../utils/load-texture";
// import { logger } from "./logging-system";

const CONGRATS_SLIDE_COUNT = 4;
const DISTANCE_THRESH = 1.5;
const ANGLE_THRESH = 44;
const changeTime = 10000;
const floatingPanelQuery = defineQuery([FloatingTextPanel]);

interface StepCategory {
  name: string;
  type: "nav" | "noNav" | "both";
  slides: Array<number>;
  steps: Array<StepObject>;
}
interface StepObject {
  onceFunc?: Function;
  loopFunc?: Function;
  cleanUpFunc?: Function;
}

class TutorialManager {
  Ascene: AScene;
  allowed: boolean;
  wellDoneStep: boolean;
  showArrows: boolean;

  initPosition: Vector3;
  initDir: Vector3;

  activeCategory: StepCategory;
  activeStep: StepObject;

  activeStepIndex: number;
  activeCategoryIndex: number;

  categoriesArray: Array<StepCategory>;
  roomTutorial: Array<StepCategory>;

  panelRef: number;
  prevRef: number;
  nextRef: number;
  resetRef: number;
  clickRef: number;

  slides: Array<Object3D>;
  avatarHead: Object3D;
  panelObj: Object3D;
  prevObj: Object3D;
  nextObj: Object3D;
  resetButtonObj: Object3D;
  clickButtonObj: Object3D;
  centerButtonText: Text;

  room: string;
  changeRoomID: string;

  activeTimeout: NodeJS.Timeout | null;
  redirectionTimeout: NodeJS.Timeout;

  constructor() {
    this.allowed = false;
    this.activeStepIndex = 0;
    this.activeCategoryIndex = 0;
    this.onTaskToggle = this.onTaskToggle.bind(this);
    this.onClearToggle = this.onClearToggle.bind(this);
  }

  Init(reset: boolean) {
    const avatarheadElement = document.querySelector("#avatar-pov-node") as AElement;
    this.Ascene = document.querySelector("a-scene") as AScene;
    this.avatarHead = avatarheadElement.object3D;

    if (reset) {
      if (this.panelRef && entityExists(APP.world, this.panelRef)) {
        this.RemovePanel();
      }

      if (this.activeTimeout) clearTimeout(this.activeTimeout);
      if (this.redirectionTimeout) clearTimeout(this.redirectionTimeout);
    }

    if (!roomPropertiesReader.AllowsTutorial) {
      this.allowed = false;
      console.warn(`Tutorial is not allowed in this room`);
      return;
    }

    this.roomTutorial = RoomSteps[roomPropertiesReader.Room as "conference_room" | "lobby" | "tradeshows"];
    const navString =
      roomPropertiesReader.Room === "lobby"
        ? roomPropertiesReader.AllowsNav
          ? "nav"
          : "noNav"
        : roomPropertiesReader.AllowsAgent
        ? "nav"
        : "noNav";

    this.categoriesArray = [];
    console.log(navString);

    this.roomTutorial.forEach(stepCategory => {
      if (stepCategory.type === "both" || stepCategory.type === navString) this.categoriesArray.push(stepCategory);
    });

    console.log(this.categoriesArray);

    this.activeStepIndex = 0;
    this.activeCategoryIndex = 0;

    // this.activeTimeout = setTimeout(() => {
    this.allowed = true;
    this.AddTutorialPanel(
      roomPropertiesReader.roomProps.tutorial.slides!,
      roomPropertiesReader.tutorialProps.position!,
      roomPropertiesReader.tutorialProps.rotation!,
      roomPropertiesReader.tutorialProps.ratio!
    );
    // }, 1000);

    this.onMicEvent = this.onMicEvent.bind(this);
  }

  Tick(world: HubsWorld) {
    if (!this.allowed) return;

    floatingPanelQuery(world).forEach(_ => {
      if (hasComponent(world, Interacted, this.nextRef)) this.Next();
      if (hasComponent(world, Interacted, this.prevRef)) this.Prev();
      if (hasComponent(world, Interacted, this.resetRef)) {
        this.Next();
        this.resetButtonObj.visible = false;
      }
      if (hasComponent(world, Interacted, this.clickRef)) {
        this.Next(true);
        this.clickButtonObj.visible = false;
      }

      if (this.activeStep["loopFunc"]) this.activeStep.loopFunc();
    });
  }

  async AddTutorialPanel(slidesCount: number, pos: ArrayVec3, rot: ArrayVec3, ratio: number) {
    const language = translationSystem.mylanguage as "english" | "spanish" | "german" | "dutch" | "greek" | "italian";
    const languageCode = languageCodes[language];

    const slides: Array<string> = [];
    const cSlides: Array<string> = [];

    for (let i = 0; i < slidesCount; i++) {
      const url = `${roomPropertiesReader.serverURL}/${roomPropertiesReader.Room}/gif/${languageCode}_tutorial_${i}.png`;
      slides.push(url);
    }

    const gifSlides: Array<string> = new Array(slidesCount).fill("");

    for (let i = 0; i < slidesCount; i++) {
      const url = `${roomPropertiesReader.serverURL}/${roomPropertiesReader.Room}/gif/tutorial_${i}.gif`;
      const response = await fetch(url);
      if (response.ok) gifSlides[i] = url;
    }

    console.group(gifSlides);

    for (let i = 0; i < CONGRATS_SLIDE_COUNT; i++) {
      const url = `${roomPropertiesReader.serverURL}/congrats_slides/${languageCode}_tutorial_congrats_${i}.png`;
      cSlides.push(url);
    }
    let tutorialPanelEntity;

    if (roomPropertiesReader.tutorialProps.type === "moving")
      tutorialPanelEntity = await MovingTutorialImagePanel(slides, cSlides, gifSlides, pos, rot, ratio, 2);
    else tutorialPanelEntity = await StaticTutorialImagePanel(slides, cSlides, gifSlides, pos, rot, ratio, 4);
    this.panelRef = renderAsEntity(APP.world, tutorialPanelEntity);
    this.panelObj = APP.world.eid2obj.get(this.panelRef)!;
    APP.world.scene.add(this.panelObj);

    this.prevRef = FloatingTextPanel.prevRef[this.panelRef];
    this.nextRef = FloatingTextPanel.nextRef[this.panelRef];
    this.resetRef = FloatingTextPanel.resetRef[this.panelRef];
    this.clickRef = FloatingTextPanel.clickRef[this.panelRef];

    this.prevObj = APP.world.eid2obj.get(this.prevRef) as Object3D;
    this.nextObj = APP.world.eid2obj.get(this.nextRef) as Object3D;
    this.resetButtonObj = APP.world.eid2obj.get(this.resetRef) as Object3D;
    this.clickButtonObj = APP.world.eid2obj.get(this.clickRef) as Object3D;

    this.slides = [];

    slides.forEach((_, index) => {
      this.slides.push(this.panelObj.getObjectByName(`slide_${index}`)!);
    });
    cSlides.forEach((_, index) => {
      this.slides.push(this.panelObj.getObjectByName(`congrats_slide_${index}`)!);
    });

    this.activeCategory = this.categoriesArray[this.activeCategoryIndex];
    this.activeStep = this.activeCategory.steps[this.activeStepIndex];
    this.showArrows = true;
    this.Ascene.addState("task");
    APP.scene!.addEventListener("task-toggle", this.onTaskToggle);
    APP.scene!.addEventListener("clear-scene", this.onClearToggle);
    this.RenderSlide();
    this.OnceFunc();
  }

  onTaskToggle() {
    if (this.Ascene.is("task")) {
      this.panelObj.visible = false;
      this.Ascene.removeState("task");
      // logger.AddUiInteraction("task_toggle", "deactivate_task");
    } else {
      APP.scene!.emit("clear-scene");
      this.panelObj.visible = true;
      this.Ascene.addState("task");
      // logger.AddUiInteraction("task_toggle", "activate_task");
    }
  }

  onClearToggle() {
    if (roomPropertiesReader.Room === "lobby") return;
    if (this.Ascene.is("task")) {
      this.panelObj.visible = false;
      this.Ascene.removeState("task");
    }
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

    this.ToggleArrowVisibility(this.showArrows);

    this.slides[this.activeCategory.slides[this.activeStepIndex]].visible = true;
    APP.scene!.emit("clear-scene");
    this.Ascene.addState("task");
    this.panelObj.visible = true;
  }

  ClearTimeOut() {
    if (this.activeTimeout !== null) clearTimeout(this.activeTimeout);
    this.activeTimeout = null;
  }

  Next(congratulate = false) {
    if (this.activeStepIndex === this.activeCategory.steps.length - 1) {
      this.NextCategory(congratulate);
    } else {
      this.AddStep(1);
    }
  }

  Prev() {
    if (this.activeStepIndex === 0) this.PrevCategory();
    else {
      this.AddStep(-1);
    }
  }

  AddStep(offset: number) {
    this.SetStep(this.activeStepIndex + offset);
  }

  SetStep(number: number) {
    this.ClearTimeOut();
    this.RunCleanupFunc();
    this.activeStepIndex = number;
    this.activeStep = this.activeCategory.steps[this.activeStepIndex];
    this.RenderSlide();
    this.OnceFunc();
  }

  ChangeCategory(category: StepCategory) {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();
    this.activeCategory = category;
    this.SetStep(0);
  }

  RunCleanupFunc() {
    if (this.activeStep) {
      const cleanupFunc = this.activeStep["cleanUpFunc"];
      if (cleanupFunc) cleanupFunc();
    }
  }

  ChangeCategoryByIndex(index: number) {
    this.activeCategoryIndex = index;
    if (this.activeCategoryIndex === this.categoriesArray.length) this.activeCategoryIndex = 0;
    this.ChangeCategory(this.categoriesArray[this.activeCategoryIndex]);
  }

  NextCategory(congratulate = false) {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();

    if (congratulate) {
      this.ChangeCategory(WellDoneCategoryNext());
    } else {
      this.ChangeCategoryByIndex(this.activeCategoryIndex + 1);
    }
  }

  PrevCategory() {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();
    this.activeCategoryIndex -= 1;
    this.activeCategory = this.categoriesArray[this.activeCategoryIndex];
    this.SetStep(0);
  }

  OnceFunc() {
    const startingFunc = this.activeStep["onceFunc"];
    if (startingFunc) startingFunc();
  }

  onMicEvent() {
    this.NextCategory();
  }

  HidePanel() {
    this.panelObj.visible = false;
    this.Ascene.removeState("task");
  }

  ToggleArrowVisibility(show: boolean = false) {
    this.prevObj.visible = show;
    this.nextObj.visible = show;
    const action = show ? addComponent : removeComponent;

    action(APP.world, CursorRaycastable, this.nextRef);
    action(APP.world, CursorRaycastable, this.prevRef);
  }
}

export const tutorialManager = new TutorialManager();

const WellDoneCategoryNext = (): StepCategory => {
  const slideNo = tutorialManager.slides.length - Math.floor(Math.random() * (CONGRATS_SLIDE_COUNT - 1) + 1);

  return {
    name: "welldone",
    type: "both",
    slides: [slideNo],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.ToggleArrowVisibility(false);
          tutorialManager.activeTimeout = setTimeout(() => {
            tutorialManager.Next();
            tutorialManager.ToggleArrowVisibility(true);
          }, 1500);
        }
      }
    ]
  };
};
const WellDoneCategory = (): StepCategory => {
  const slideNo = tutorialManager.slides.length - Math.floor(Math.random() * (CONGRATS_SLIDE_COUNT - 1) + 1);

  return {
    name: "welldone",
    type: "both",
    slides: [slideNo],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.activeTimeout = setTimeout(() => {
            tutorialManager.HidePanel();
          }, 1500);
        }
      }
    ]
  };
};
const MicUnMutedCategory = (): StepCategory => {
  const onMuting = () => tutorialManager.Next(true);

  return {
    name: "mic_unmuted",
    type: "nav",
    slides: [9],
    steps: [
      {
        onceFunc: () => tutorialManager.Ascene.addEventListener("action_disable_mic", onMuting, { once: true }),
        cleanUpFunc: () => tutorialManager.Ascene.removeEventListener("action_disable_mic", onMuting)
      }
    ]
  };
};

const onUnmuting = () => tutorialManager.ChangeCategory(MicUnMutedCategory());

const OnMapToggle = () => {
  APP.scene!.addEventListener(
    "map-toggle",
    () => {
      tutorialManager.Next(true);
    },
    { once: true }
  );
};

function ChangeSlidein5() {
  tutorialManager.activeTimeout = setTimeout(() => {
    tutorialManager.Next();
  }, 10000);
}

function welcomeSteps(time: number): Array<StepObject> {
  return [
    {
      onceFunc: () => {
        targetPos = navSystem.nodes[navSystem.GetDestIndex("social area")].vector;
        tutorialManager.activeTimeout = setTimeout(() => {
          tutorialManager.HidePanel();
        }, time);

        tutorialManager.redirectionTimeout = setTimeout(() => {
          tutorialManager.ChangeCategory(timeOutCategory);
        }, 4 * 60000);
      },
      loopFunc: () => {
        if (avatarPos().distanceTo(targetPos) < 3) {
          tutorialManager.Next(true);
          // logger.AddAnnouncementInteraction("step_achieved", "navigation to social area");
        }
      },
      cleanUpFunc: () => {
        setTimeout(() => {
          tutorialManager.panelObj.visible = true;
        });
      }
    }
  ];
}

const timeOutCategory: StepCategory = {
  name: "timeout",
  type: "both",
  slides: [3],
  steps: [
    {
      onceFunc: () => {
        // tutorialManager.HidePanel(); //this need to be changed
        setTimeout(() => {
          // logger.AddAnnouncementInteraction("room redirection", "to conference room");

          changeHub(roomPropertiesReader.devMode ? "" : "AxFm4cE"); ///provide correct ID in prod
        }, changeTime);
      }
    }
  ]
};

const MapPanelSteps: Array<StepObject> = [
  { onceFunc: () => {} },
  {
    onceFunc: () => {
      APP.scene!.addEventListener("map-toggle", OnMapToggle, { once: true });
    },
    cleanUpFunc: () => {
      APP.scene!.removeEventListener("map-toggle", OnMapToggle);
    }
  }
];
let targetPos: Vector3;

const LobbySteps: Array<StepCategory> = [
  {
    name: "welcome_1",
    type: "both",
    slides: [0],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.resetButtonObj.visible = false;
          tutorialManager.clickButtonObj.visible = false;
          tutorialManager.prevObj.visible = false;
        },
        cleanUpFunc: () => {
          tutorialManager.prevObj.visible = true;
        }
      }
    ]
  },
  {
    name: "welcome_2",
    type: "both",
    slides: [1],
    steps: [
      {
        onceFunc: () => {}
      }
    ]
  },
  {
    name: "click",
    type: "both",
    slides: [2],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.activeTimeout = setTimeout(() => {
            tutorialManager.clickButtonObj.visible = true;
          }, 1000);
        },
        cleanUpFunc: () => {
          tutorialManager.clickButtonObj.visible = false;
        }
      }
    ]
  },
  {
    name: "move",
    type: "both",
    slides: [3, 4],
    steps: [
      {
        onceFunc: () => {}
      },
      {
        onceFunc: () => {
          tutorialManager.initPosition = tutorialManager.avatarHead.getWorldPosition(new Vector3());
        },
        loopFunc: () => {
          const currentPos = tutorialManager.avatarHead.getWorldPosition(new Vector3());
          const distance = tutorialManager.initPosition.distanceTo(currentPos.setY(tutorialManager.initPosition.y));
          if (distance >= DISTANCE_THRESH) tutorialManager.Next(true);
        }
      }
    ]
  },
  {
    name: "teleport",
    type: "both",
    slides: [5],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.initPosition = tutorialManager.avatarHead.getWorldPosition(new Vector3());
        },
        loopFunc: () => {
          const currentPos = tutorialManager.avatarHead.getWorldPosition(new Vector3());
          const distance = tutorialManager.initPosition.distanceTo(currentPos.setY(tutorialManager.initPosition.y));
          if (distance >= DISTANCE_THRESH) tutorialManager.Next(true);
        }
      }
    ]
  },
  {
    name: "turn",
    type: "both",
    slides: [6],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.initDir = tutorialManager.avatarHead.getWorldDirection(new Vector3());
        },
        loopFunc: () => {
          const orientation = tutorialManager.avatarHead.getWorldDirection(new Vector3());
          const radAngle = tutorialManager.initDir.angleTo(orientation.setY(tutorialManager.initDir.y).normalize());
          const angle = THREE.MathUtils.radToDeg(radAngle);
          if (angle >= ANGLE_THRESH) tutorialManager.Next(true);
        }
      }
    ]
  },
  {
    name: "speak",
    type: "nav",
    slides: [7, 8],
    steps: [
      {
        onceFunc: () => {}
      },
      {
        onceFunc: () => {
          tutorialManager.ToggleArrowVisibility(false);
          tutorialManager.Ascene.addEventListener("action_enable_mic", onUnmuting, { once: true });
        },
        cleanUpFunc: () => {
          tutorialManager.Ascene.removeEventListener("action_enable_mic", onUnmuting);
          tutorialManager.ToggleArrowVisibility(true);
        }
      }
    ]
  },
  {
    name: "panel",
    type: "nav",
    slides: [10, 12],
    steps: MapPanelSteps
  },
  {
    name: "panel",
    type: "noNav",
    slides: [11, 13],
    steps: MapPanelSteps
  },
  {
    name: "finish",
    type: "both",
    slides: [14],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.resetButtonObj.visible = true;
          tutorialManager.nextObj.visible = false;
        },
        cleanUpFunc: () => {
          tutorialManager.resetButtonObj.visible = false;
          tutorialManager.nextObj.visible = true;
        }
      }
    ]
  }
];

const TradeshowSteps: Array<StepCategory> = [
  {
    name: "welcome",
    type: "nav",
    slides: [0],
    steps: welcomeSteps(10000)
  },
  {
    name: "welcome",
    type: "noNav",
    slides: [1],
    steps: welcomeSteps(changeTime)
  },
  {
    name: "nextStep",
    type: "both",
    slides: [2],
    steps: [
      {
        onceFunc: () => {
          targetPos = navSystem.nodes[navSystem.GetDestIndex("conference room")].vector;

          tutorialManager.activeTimeout = setTimeout(() => {
            tutorialManager.HidePanel();
          }, changeTime);
        },
        loopFunc: () => {
          if (avatarPos().distanceTo(targetPos) < 3) {
            tutorialManager.ChangeCategory(WellDoneCategory());
            // logger.AddAnnouncementInteraction("step_achieved", "navigation to conference room");
          }
        }
      }
    ]
  }
];

const ConferenceSteps: Array<StepCategory> = [
  {
    name: "welcome",
    slides: [0],
    type: "both",
    steps: [
      {
        onceFunc: () => {
          tutorialManager.activeTimeout = setTimeout(() => {
            tutorialManager.HidePanel();
          }, changeTime);
        }
      }
    ]
  }
];

const RoomSteps = { conference_room: ConferenceSteps, lobby: LobbySteps, tradeshows: TradeshowSteps };
