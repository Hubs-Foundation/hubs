import { string } from "prop-types";

const propertiesURL = "https://kontopoulosdm.github.io/properties.json";
const unkonwnRoom = {
  room: "unknown",
  id: ["uknown"],
  allow_map: false,
  allow_agent: false,
  allow_navigation: false
};

interface RoomProperties {
  targets: { name: string; pivot: Array<Number>; box: Array<Number> };
  dimensions: { height: number; box: Array<Number> }[];
  connectors?: { end1: Array<Number>; end2: Array<Number> }[];
}

interface MapProperties {
  file: string;
  ratio: number;
  mapToImage: Array<Number>;
  center: Array<Number>;
  centeroffset: Array<Number>;
}

interface JSONHubProperties {
  room: string;
  id: Array<string>;
  allow_map: boolean;
  allow_agent: boolean;
  allow_navigation: boolean;
  navigation?: RoomProperties;
  map?: MapProperties;
}

export async function GetHubProperties(HubID: string): Promise<JSONHubProperties> {
  try {
    const response = await fetch(propertiesURL, { method: "GET" });
    if (!response.ok) throw new Error("Response not OK");
    const roomArray = (await response.json()) as JSONHubProperties[];

    for (let i = 0; i < roomArray.length; i++) {
      for (let j = 0; j < roomArray[i].id.length; j++) {
        if (roomArray[i].id[j] === HubID) return roomArray[i];
      }
    }
    return unkonwnRoom;
  } catch (error) {
    console.log(error);
    return unkonwnRoom;
  }
}

export async function GetProperties(
  _roomID: string,
  type: PropertyType
): Promise<JSONRoomProperties_old | JSONMapProperties_old | false> {
  let props;
  try {
    if (type === PropertyType.ROOM) {
      props = await GetPropertiesFile<JSONRoomProperties_old[]>(type);
    } else if (type === PropertyType.MAP) {
      props = await GetPropertiesFile<JSONMapProperties_old[]>(type);
    } else {
      throw new Error("Invalid property type");
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  for (let i = 0; i < props.length; i++) {
    if (props[i].id === _roomID) return props[i];
  }
  return false;
}

export async function GetPropertiesFile<T>(link: PropertyType): Promise<T> {
  try {
    const response = await fetch(link, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("Response not OK");
    }
    const responseData = (await response.json()) as T;
    return responseData;
  } catch (error) {
    throw new Error("Could not fetch data: " + error.message);
  }
}

interface JSONRoomProperties_old {
  room: string;
  id: string;
  targets: { name: string; pivot: Array<Number>; box: Array<Number> };
  dimensions: { height: number; box: Array<Number> }[];
  connectors?: { end1: Array<Number>; end2: Array<Number> }[];
}

interface JSONMapProperties_old {
  id: string;
  file: string;
  ratio: number;
  mapToImage: Array<Number>;
  center: Array<Number>;
  centeroffset: Array<Number>;
}

export enum PropertyType {
  ROOM = "https://kontopoulosdm.github.io/room_properties.json",
  MAP = "https://kontopoulosdm.github.io/maps.json"
}
