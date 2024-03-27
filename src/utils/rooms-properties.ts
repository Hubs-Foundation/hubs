import { string } from "prop-types";
import { EventEmitter } from "eventemitter3";

const propertiesURL = "https://kontopoulosdm.github.io/properties.json";

interface RoomProperties {
  room: string;
  id: Array<string>;
  allow_agent: boolean;
  translation: TranslationProperties;
  navigation: NavigationProperties;
  map: MapProperties;
}

const unknownRoom = {
  room: "unknown",
  id: ["uknown"],
  allow_agent: false,
  translation: { allow: false },
  navigation: { allow: false },
  map: { allow: false }
};

interface NavigationProperties {
  allow: boolean;
  targets?: { name: string; pivot: Array<Number>; box: Array<Number> }[];
  dimensions?: { height: number; box: Array<Number> }[];
  connectors?: { end1: Array<Number>; end2: Array<Number> }[];
}

interface MapProperties {
  allow: boolean;
  file?: string;
  ratio?: number;
  mapToImage?: Array<Number>;
  center?: Array<Number>;
  centeroffset?: Array<Number>;
}

interface TranslationProperties {
  allow: boolean;
  conversation?: { type: "bubble" | "duo" | "presentation"; data?: Array<Number> };
  spatiality?: {
    type: "borders" | "room";
    data?: Array<Array<Number>>;
  };
  panel?: {
    type: "avatar" | "fixed";
    data?: Array<Number>;
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
  read: boolean;
  url: string;

  constructor(roomUrl: string) {
    this.read = false;
    this.url = roomUrl;

    this.uknownRoom = {
      room: "unknown",
      id: ["uknown"],
      allow_agent: false,
      translation: { allow: false },
      navigation: { allow: false },
      map: { allow: false }
    };
  }

  async Read(HubID: string, reset: boolean): Promise<RoomProperties> {
    if (reset) this.read = false;

    if (this.read) return Promise.resolve(this.roomProps);
    else {
      try {
        const response = await fetch(propertiesURL, { method: "GET" });
        if (!response.ok) throw new Error("Response not OK");
        const roomArray = (await response.json()) as RoomProperties[];

        for (let i = 0; i < roomArray.length; i++) {
          for (let j = 0; j < roomArray[i].id.length; j++) {
            if (roomArray[i].id[j] === HubID) {
              this.setProps(roomArray[i]);
              this.read = true;
              break;
            }
          }
        }
        if (!this.read) {
          this.setProps(this.uknownRoom);
          this.read = true;
        }
        APP.scene!.emit("properties_loaded");
        return this.roomProps;
      } catch (error) {
        this.setProps(this.uknownRoom);
        APP.scene!.emit("properties_loaded");
        this.read = true;
        return this.roomProps;
      }
    }
  }

  setProps(roomProps: RoomProperties) {
    this.roomProps = roomProps;
    this.navProps = roomProps.navigation;
    this.transProps = roomProps.translation;
    this.mapProps = roomProps.map;
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
}

export const roomPropertiesReader = new RoomPropertiesReader(propertiesURL);

export async function GetHubProperties(HubID: string): Promise<RoomProperties> {
  try {
    const response = await fetch(propertiesURL, { method: "GET" });
    if (!response.ok) throw new Error("Response not OK");
    const roomArray = (await response.json()) as RoomProperties[];

    for (let i = 0; i < roomArray.length; i++) {
      for (let j = 0; j < roomArray[i].id.length; j++) {
        if (roomArray[i].id[j] === HubID) {
          APP.scene!.emit("properties_loaded", { premissions: roomArray[i] });
          return roomArray[i];
        }
      }
    }
    APP.scene!.emit("properties_loaded", { premissions: unknownRoom });
    return unknownRoom;
  } catch (error) {
    console.log(error);
    APP.scene!.emit("properties_loaded", { premissions: unknownRoom });
    return unknownRoom;
  }
}
