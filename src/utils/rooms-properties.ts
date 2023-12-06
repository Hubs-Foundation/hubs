interface saliencyProp {
  name: string;
  pivot: [number, number, number];
  box: [number, number, number, number];
}

interface JSONProperties {
  room: string;
  id: string;
  targets: saliencyProp[];
  dimensions: { height: number; box: [number, number, number, number] }[];
  connectors?: { end1: [number, number, number]; end2: [number, number, number] }[];
}

export async function GetRoomProperties(_roomID: string): Promise<JSONProperties | false> {
  try {
    const roomProps = (await GetPropertiesFile()) as Array<JSONProperties>;
    for (let i = 0; i < roomProps.length; i++) {
      if (roomProps[i].id === _roomID) return roomProps[i];
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function GetPropertiesFile(): Promise<Array<JSONProperties> | string> {
  try {
    const response = await fetch("https://kontopoulosdm.github.io/room_properties.json", {
      method: "GET"
    });

    if (!response.ok) {
      throw "Resp not ok";
    }

    const responseData = (await response.json()) as Array<JSONProperties>;

    return responseData;
  } catch (error) {
    throw "Could not fetch";
  }
}
