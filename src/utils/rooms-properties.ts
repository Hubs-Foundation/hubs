import { string } from "prop-types";
import { EventEmitter } from "eventemitter3";
import { ArrayVec2, ArrayVec3 } from "./jsx-entity";
import { keyboardDebuggingBindings } from "../systems/userinput/bindings/keyboard-debugging";

interface RoomDescription {
  room: string;
  nav: Array<string>;
  no_nav: Array<string>;
}

interface RoomProperties {
  room: string;
  id: Array<string>;
  agent: Array<string>;
  translation: TranslationProperties;
  navigation: NavigationProperties;
  map: MapProperties;
  tutorial: TutorialProperties;
  help: HelpProperties;
  labels: Array<LabelProperties>;
  HubID?: string;
}

interface TutorialProperties {
  allow: Array<string>;
  slides?: number;
  congrats_slides?: Array<string>;
  position?: ArrayVec3;
  rotation?: ArrayVec3;
  ratio?: number;
  type?: "fixed" | "moving";
}

interface HelpProperties {
  allow: Array<string>;
  slides?: number;
  nav?: Array<number>;
  no_nav?: Array<number>;
  ratio?: number;
}

export interface NavigationProperties {
  allow: Array<string>;
  targets?: Array<{ name: string; position: [number, number] }>;
  dimensions?: [number, number, number, number];
  polygon?: Array<[number, number]>;
  obstacles?: Array<Array<[number, number]>>;
  objects?: Array<{ name: string; position: [number, number] }>;
}

interface MapProperties {
  allow: Array<string>;
  image_ratio?: number;
  scale?: number;
  room_size?: ArrayVec2;
}

interface TranslationProperties {
  allow: Array<string>;
  conversation?: { type: "bubble" | "duo" | "presentation"; data?: Array<number> };
  spatiality?: {
    type: "borders" | "room";
    data?: Array<Array<number>>;
  };
  panel?: {
    type: "avatar" | "fixed";
    data?: Array<number>;
  };
}

interface LabelProperties {
  name: string;
  position: ArrayVec3;
  rotation: ArrayVec3;
  scale: number;
  ratio: number;
}

export enum PropertyType {
  ROOM = "https://kontopoulosdm.github.io/room_properties.json",
  MAP = "https://kontopoulosdm.github.io/maps.json"
}

class RoomPropertiesReader {
  roomProps: RoomProperties;
  uknownRoom: RoomProperties;
  navProps: NavigationProperties;
  transProps: TranslationProperties;
  mapProps: MapProperties;
  tutorialProps: TutorialProperties;
  helpProps: HelpProperties;
  labelProps: LabelProperties[];
  read: boolean;
  url: string;
  serverURL: string;
  hubId: string;
  redirectionHubId: string;
  devMode: boolean;

  constructor() {
    this.read = false;

    this.serverURL = "https://kontopoulosdm.github.io";
    this.url = this.serverURL + "/properties.json";

    this.uknownRoom = {
      room: "unknown",
      id: ["uknown"],
      agent: [],
      translation: { allow: [] },
      navigation: { allow: [] },
      map: { allow: [] },
      tutorial: { allow: [] },
      help: { allow: [] },
      labels: []
    };
  }

  async Read(HubID: string, reset: boolean): Promise<RoomProperties> {
    if (reset) {
      this.read = false;
      APP.scene!.emit("room_properties_updated");
    }

    if (this.read) return Promise.resolve(this.roomProps);
    else {
      try {
        this.hubId = HubID;
        console.log(`hubid`, this.hubId);
        const response = await fetch(this.url, { method: "GET" });
        if (!response.ok) throw new Error("Response not OK");
        const roomArray = (await response.json()) as RoomProperties[];

        for (let i = 0; i < roomArray.length; i++) {
          for (let j = 0; j < roomArray[i].id.length; j++) {
            if (roomArray[i].id[j] === HubID) {
              this.setProps(roomArray[i], HubID);
              this.read = true;
              this.redirectionHubId = await this.GetRedirectionHubId();
              break;
            }
          }
        }

        if (!this.read) {
          this.setProps(this.uknownRoom, HubID);
          this.read = true;
        }
        APP.scene!.emit("properties_loaded");
        return this.roomProps;
      } catch (error) {
        this.setProps(this.uknownRoom, HubID);
        APP.scene!.emit("properties_loaded");
        this.read = true;
        return this.roomProps;
      }
    }
  }

  async GetRedirectionHubId(): Promise<string> {
    const response = await fetch(this.serverURL.concat("/rooms.json"), { method: "GET" });
    if (!response.ok) throw new Error("Response not OK");

    const roomArrays = (await response.json()) as RoomDescription[];

    let myHubIndex: number = -1;
    const hubIDsKeys = this.AllowsNav ? "nav" : "no_nav";
    console.log(this.AllowsNav);

    console.log(`hubkeys`, hubIDsKeys);

    for (let i = 0; i < roomArrays.length; i++) {
      console.log("searching for hubIndexNumber");
      const room = roomArrays[i];
      if (room.room === this.Room) {
        console.log(`room is `, room.room, this.Room);
        const hubIds = room[hubIDsKeys];
        console.log(hubIds);
        for (let j = 0; j < hubIds.length; j++) {
          if (hubIds[j] === this.hubId) {
            myHubIndex = j;
            if (j === 0) this.devMode = true;
            else this.devMode = false;
            console.log(`myhubindex is `, myHubIndex);
            break;
          }
        }
        break;
      }
    }
    let result: string[] = [];
    if (myHubIndex >= 0)
      roomArrays.forEach(room => {
        const hubIds = room[hubIDsKeys];
        if (room.room !== this.Room) result.push(hubIds[myHubIndex]);
      });
    else {
      this.redirectionHubId = "";
      this.devMode = false;
    }

    console.log(`results`, result);
    return result[0];
  }

  setProps(roomProps: RoomProperties, HubID: string) {
    this.roomProps = { ...roomProps, HubID: HubID };
    this.navProps = roomProps.navigation;
    this.transProps = roomProps.translation;
    this.mapProps = roomProps.map;
    this.tutorialProps = roomProps.tutorial;
    this.helpProps = roomProps.help;
    this.labelProps = roomProps.labels;
  }

  waitForProperties(): Promise<any> {
    if (this.read) return Promise.resolve(null);
    else
      return new Promise(resolve => {
        APP.scene!.addEventListener("properties_loaded", resolve, { once: true });
      });
  }

  HasProps() {
    return this.read;
  }

  AllowsProperty(propertyArray: Array<string>): boolean {
    if (this.read) {
      for (let i = 0; i < propertyArray.length; i++) {
        if (this.roomProps.HubID! === propertyArray[i] || propertyArray[i] === "all") return true;
      }
      return false;
    }
    return false;
  }

  get AllowsNav() {
    return this.AllowsProperty(this.navProps.allow);
  }
  get AllowsMap() {
    return this.AllowsProperty(this.mapProps.allow);
  }
  get AllowTrans() {
    return this.AllowsProperty(this.transProps.allow);
  }
  get AllowsAgent() {
    return this.AllowsProperty(this.roomProps.agent);
  }
  get AllowsTutorial() {
    return this.AllowsProperty(this.tutorialProps.allow);
  }
  get AllowsHelp() {
    return this.AllowsProperty(this.helpProps.allow);
  }

  get Room() {
    return this.roomProps.room.replace(" ", "_").toLowerCase();
  }
}

export const roomPropertiesReader = new RoomPropertiesReader();
