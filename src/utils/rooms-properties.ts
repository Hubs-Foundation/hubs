import { string } from "prop-types";
import { EventEmitter } from "eventemitter3";
import { ArrayVec2, ArrayVec3 } from "./jsx-entity";

interface RoomProperties {
  room: string;
  id: Array<string>;
  agent: Array<string>;
  translation: TranslationProperties;
  navigation: NavigationProperties;
  map: MapProperties;
  tutorial: TutorialProperties;
  HubID?: string;
}

interface TypeProperty {
  agent: Array<string>;
  map: Array<string>;
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

export interface NavigationProperties {
  allow: Array<string>;
  targets?: Array<{ name: string; position: [number, number] }>;
  dimensions?: [number, number, number, number];
  polygon?: Array<[number, number]>;
  obstacles?: Array<Array<[number, number]>>;
}

interface OldMapProperties {
  allow: Array<string>;
  file?: string;
  ratio?: number;
  mapToImage?: Array<number>;
  center?: Array<number>;
  centeroffset?: Array<number>;
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
  read: boolean;
  url: string;
  serverURL: string;

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
      tutorial: { allow: [] }
    };
  }

  async Read(HubID: string, reset: boolean): Promise<RoomProperties> {
    if (reset) this.read = false;

    if (this.read) return Promise.resolve(this.roomProps);
    else {
      try {
        const response = await fetch(this.url, { method: "GET" });
        if (!response.ok) throw new Error("Response not OK");
        const roomArray = (await response.json()) as RoomProperties[];

        for (let i = 0; i < roomArray.length; i++) {
          for (let j = 0; j < roomArray[i].id.length; j++) {
            if (roomArray[i].id[j] === HubID) {
              this.setProps(roomArray[i], HubID);
              this.read = true;
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

  setProps(roomProps: RoomProperties, HubID: string) {
    this.roomProps = { ...roomProps, HubID: HubID };
    this.navProps = roomProps.navigation;
    this.transProps = roomProps.translation;
    this.mapProps = roomProps.map;
    this.tutorialProps = roomProps.tutorial;
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
}

export const roomPropertiesReader = new RoomPropertiesReader();
