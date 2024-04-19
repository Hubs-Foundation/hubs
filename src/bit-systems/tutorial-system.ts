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
import { defineQuery, enterQuery, entityExists, hasComponent, removeEntity } from "bitecs";
import { degToRad } from "three/src/math/MathUtils";
import { languageCodes, translationSystem } from "./translation-system";
import { navSystem } from "./routing-system";
import { virtualAgent } from "./agent-system";
import { changeHub } from "../change-hub";

const CONGRATS_SLIDE_COUNT = 4;
const DISTANCE_THRESH = 1.5;
const PANEL_PADDING = 0.05;
const PANEL_MIN_WIDTH = 1;
const PANEL_MIN_HEIGHT = 0.5;
const ANGLE_THRESH = 44;
const waypointPos = new Vector3(-4.5, 0, -4.0);
const floatingPanelQuery = defineQuery([FloatingTextPanel]);
const floatingPanelEnterQuery = enterQuery(floatingPanelQuery);

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

interface RoomTutorialObject {
  navIndex: Array<number>;
  noNavIndex: Array<number>;
  steps: Array<StepObject>;
}

class TutorialManager {
  Ascene: AScene;
  allowed: boolean;
  wellDoneStep: boolean;

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
  testRef: number;

  slides: Array<Object3D>;
  avatarHead: Object3D;
  panelObj: Object3D;
  prevObj: Object3D;
  nextObj: Object3D;
  testObj: Object3D;

  room: "lobby" | "tradeshows" | "conference";
  changeRoomID: string;

  constructor() {
    this.allowed = false;
    this.activeStepIndex = 0;
    this.activeCategoryIndex = 0;
  }

  Init(reset: boolean) {
    if (reset) {
      if (this.panelRef && entityExists(APP.world, this.panelRef)) {
        this.RemovePanel();
      }
    }

    if (!roomPropertiesReader.AllowsTutorial) {
      this.allowed = false;
      console.warn(`Tutorial is not allowed in this room`);
      return;
    }

    let startingTime: number;

    if (roomPropertiesReader.roomProps.room === "Lobby") {
      this.room = "lobby";
      startingTime = 1000;
      this.roomTutorial = lobbySteps;
    } else if (roomPropertiesReader.roomProps.room === "Tradeshows") {
      this.room = "tradeshows";
      startingTime = 1000;
      this.roomTutorial = TradeshowSteps;
    } else if (roomPropertiesReader.roomProps.room === "Conference Room") {
      this.room = "conference";
      this.roomTutorial = ConferenceSteps;
      startingTime = 500;
    } else startingTime = 1000;

    this.categoriesArray = [];
    if (roomPropertiesReader.AllowsNav) {
      this.roomTutorial.forEach(stepCategory => {
        if (stepCategory.type === "both" || stepCategory.type === "nav") this.categoriesArray.push(stepCategory);
      });
    } else {
      this.roomTutorial.forEach(stepCategory => {
        if (stepCategory.type === "both" || stepCategory.type === "noNav") this.categoriesArray.push(stepCategory);
      });
    }

    const avatarheadElement = document.querySelector("#avatar-pov-node") as AElement;
    this.Ascene = document.querySelector("a-scene") as AScene;
    this.avatarHead = avatarheadElement.object3D;

    setTimeout(() => {
      this.allowed = true;
      // console.log(roomPropertiesReader.tutorialProps.slides);
      this.AddTutorialPanel(
        roomPropertiesReader.roomProps.tutorial.slides!,
        roomPropertiesReader.tutorialProps.position!,
        roomPropertiesReader.tutorialProps.rotation!,
        roomPropertiesReader.tutorialProps.ratio!
      );
    }, startingTime);

    this.onMicEvent = this.onMicEvent.bind(this);
  }

  Tick(world: HubsWorld) {
    if (!this.allowed) return;

    floatingPanelQuery(world).forEach(_ => {
      if (hasComponent(world, Interacted, this.nextRef)) this.Next();
      if (hasComponent(world, Interacted, this.prevRef)) this.Prev();
      if (hasComponent(world, Interacted, this.testRef)) {
        this.Next(this.activeCategoryIndex !== this.categoriesArray.length - 1);
        this.testObj.visible = false;
      }

      if (this.activeStep["loopFunc"]) this.activeStep.loopFunc();
    });
  }

  AddTutorialPanel(slidesCount: number, pos: ArrayVec3, rot: ArrayVec3, ratio: number) {
    const language = translationSystem.mylanguage as "english" | "spanish" | "german" | "dutch" | "greek" | "italian";
    const languageCode = languageCodes[language];

    const slides: Array<string> = [];
    const cSlides: Array<string> = [];
    for (let i = 0; i < slidesCount; i++) {
      slides.push(`${roomPropertiesReader.serverURL}/${this.room}/${languageCode}_tutorial_${i}.png`);
      // console.log(`pushing ${roomPropertiesReader.serverURL}/${this.room}/${languageCode}_tutorial_${i}.png`);
    }

    for (let i = 0; i < CONGRATS_SLIDE_COUNT; i++)
      cSlides.push(`${roomPropertiesReader.serverURL}/congrats_slides/${languageCode}_tutorial_congrats_${i}.png`);

    this.panelRef = renderAsEntity(
      APP.world,
      TutorialImagePanel(slides, cSlides, pos, rot, ratio, roomPropertiesReader.tutorialProps.type === "moving")
    );
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
    cSlides.forEach((_, index) => {
      this.slides.push(this.panelObj.getObjectByName(`congrats_slide_${index}`)!);
    });

    this.activeCategory = this.categoriesArray[this.activeCategoryIndex];
    this.activeStep = this.activeCategory.steps[this.activeStepIndex];
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

    this.slides[this.activeCategory.slides[this.activeStepIndex]].visible = true;

    // console.log(this.activeCategoryIndex, this.activeStepIndex);
  }

  Next(congratulate = false) {
    if (this.activeStepIndex === this.activeCategory.steps.length - 1) {
      this.NextCategory(congratulate);
    } else {
      this.AddStep(1);
      this.RenderSlide();
    }
  }

  Prev() {
    if (this.activeStepIndex === 0) this.PrevCategory();
    else {
      this.AddStep(-1);
      this.RenderSlide();
    }
  }

  AddStep(offset: number) {
    this.SetStep(this.activeStepIndex + offset);
  }

  SetStep(number: number) {
    this.activeStepIndex = number;
    this.activeStep = this.activeCategory.steps[this.activeStepIndex];
  }

  ChangeCategory(category: StepCategory) {
    const cleanupFunc = this.activeStep["cleanUpFunc"];
    if (cleanupFunc) cleanupFunc();

    this.activeCategory = category;
    this.SetStep(0);
    this.RenderSlide();
    this.OnceFunc();
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
      this.ChangeCategory(WellDoneCategory());
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
    this.RenderSlide();

    const startingFunc = this.activeStep["onceFunc"];
    if (startingFunc) startingFunc();
  }

  OnceFunc() {
    const startingFunc = this.activeStep["onceFunc"];
    if (startingFunc) startingFunc();
  }

  onMicEvent() {
    this.NextCategory();
  }
}

export const tutorialManager = new TutorialManager();

const WellDoneCategory = (): StepCategory => {
  const slideNo = tutorialManager.slides.length - Math.floor(Math.random() * (CONGRATS_SLIDE_COUNT - 1) + 1);

  return {
    name: "welldone",
    type: "both",
    slides: [slideNo],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.prevObj.visible = false;
          tutorialManager.nextObj.visible = false;
          setTimeout(() => {
            tutorialManager.Next();
          }, 1500);
        }
      }
    ]
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

function welcomeSteps(time: number): Array<StepObject> {
  return [
    {
      onceFunc: () => {
        targetPos = navSystem.nodes[navSystem.GetDestIndex("social area")].vector;

        tutorialManager.nextObj.visible = false;
        tutorialManager.prevObj.visible = false;
        setTimeout(() => {
          tutorialManager.panelObj.visible = false;
        }, time);

        timeOut = setTimeout(() => {
          tutorialManager.ChangeCategory(timeOutCategory);
        }, 60000);
      },
      loopFunc: () => {
        if (virtualAgent.avatarPos.distanceTo(targetPos) < 3) tutorialManager.Next(true);
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
        tutorialManager.panelObj.visible = false; //this need to be changed
        tutorialManager.nextObj.visible = false;
        tutorialManager.prevObj.visible = false;
        setTimeout(() => {
          changeHub("AxFm4cE"); ///provide correct ID in prod
        }, 5000);
      }
    }
  ]
};

let targetPos: Vector3;
let timeOut: NodeJS.Timeout;

const lobbySteps: Array<StepCategory> = [
  {
    name: "welcome_1",
    type: "both",
    slides: [0],
    steps: [
      {
        onceFunc: () => {
          setTimeout(() => {
            tutorialManager.Next();
          }, 5000);

          tutorialManager.nextObj.visible = false;
          tutorialManager.prevObj.visible = false;
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
        onceFunc: () => {
          setTimeout(() => {
            tutorialManager.Next();
          }, 5000);

          tutorialManager.nextObj.visible = false;
          tutorialManager.prevObj.visible = false;
        }
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
          tutorialManager.nextObj.visible = false;
          tutorialManager.prevObj.visible = false;
          setTimeout(() => {
            tutorialManager.testObj.visible = true;
            const testText = tutorialManager.testObj.getObjectByName("Button Label") as Text;
            testText.text = "Click me!";
          }, 2000);
        }
      }
    ]
  },
  {
    name: "move",
    type: "both",
    slides: [3],
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
    slides: [4],
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
    slides: [5, 6],
    steps: [
      {},
      {
        onceFunc: () => {
          tutorialManager.Ascene.addEventListener("action_enable_mic", onUnmuting);
        },
        cleanUpFunc: () => {
          tutorialManager.Ascene.removeEventListener("action_enable_mic", onUnmuting);
        }
      }
    ]
  },
  {
    name: "panel",
    type: "nav",
    slides: [8, 10],
    steps: [
      {},
      {
        onceFunc: () => {
          tutorialManager.Ascene.addEventListener("lang-toggle", OnToggle, { once: true });
        },
        cleanUpFunc: () => {
          tutorialManager.Ascene.removeEventListener("map-toggle", OnToggle);
        }
      }
    ]
  },
  {
    name: "panel",
    type: "noNav",
    slides: [9, 11],
    steps: [
      {},
      {
        onceFunc: () => {
          tutorialManager.Ascene.addEventListener("map-toggle", OnToggle, { once: true });
        },
        cleanUpFunc: () => {
          tutorialManager.Ascene.removeEventListener("map-toggle", OnToggle);
        }
      }
    ]
  },
  {
    name: "finish",
    type: "nav",
    slides: [12],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.testObj.visible = true;
          const testText = tutorialManager.testObj.getObjectByName("Button Label") as Text;
          testText.text = "Reset";
        },
        cleanUpFunc: () => {
          tutorialManager.testObj.visible = false;
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
    steps: welcomeSteps(5000)
  },
  {
    name: "nextStep",
    type: "both",
    slides: [2],
    steps: [
      {
        onceFunc: () => {
          tutorialManager.nextObj.visible = false;
          tutorialManager.prevObj.visible = false;
          targetPos = navSystem.nodes[navSystem.GetDestIndex("conference room")].vector;

          setTimeout(() => {
            tutorialManager.panelObj.visible = false;
          }, 5000);
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
          tutorialManager.nextObj.visible = false;
          tutorialManager.prevObj.visible = false;
          setTimeout(() => {
            tutorialManager.panelObj.visible = false;
          }, 5000);
        }
      }
    ]
  }
];
