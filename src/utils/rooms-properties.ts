interface saliencyProp {
  name: string;
  pivot: [number, number, number];
  box: [number, number, number, number];
}

interface JSONRoomProperties {
  room: string;
  id: string;
  targets: saliencyProp[];
  dimensions: { height: number; box: [number, number, number, number] }[];
  connectors?: { end1: [number, number, number]; end2: [number, number, number] }[];
}

interface JSONMapProperties {
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

export async function GetProperties(
  _roomID: string,
  type: PropertyType
): Promise<JSONRoomProperties | JSONMapProperties | false> {
  let props;
  try {
    if (type === PropertyType.ROOM) {
      props = await GetPropertiesFile<JSONRoomProperties[]>(type);
    } else if (type === PropertyType.MAP) {
      props = await GetPropertiesFile<JSONMapProperties[]>(type);
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
