import { Vector3 } from "three";

interface RoomProperties {
  saliency: saliencyProp[];
  dimensions: [number, number, number, number];
}

interface saliencyProp {
  name: string;
  pivot: [number, number, number];
  box: [number, number, number, number];
}

const demo: RoomProperties = {
  saliency: [
    { name: "booth_1", pivot: [23.0, 0.0, 3], box: [19, 23, 1, 5] },
    { name: "booth_2", pivot: [22.0, 0.0, 18], box: [20, 24, 14, 18] },
    { name: "booth_3", pivot: [3.0, 0.0, 17], box: [3, 7, 15, 19] },
    { name: "booth_4", pivot: [3.0, 0.0, 3], box: [1, 5, 3, 7] },
    { name: "social_area", pivot: [12, 0.0, 10], box: [9, 15, 4, 10] },
    { name: "garden", pivot: [13, 0.0, 12], box: [10, 16, 12, 18] }
  ],
  dimensions: [0, 25, 0, 20]
};

enum Rooms {
  Demo = "iotAJFL",
  Tradeshows = "null",
  ConferenceRoom = "null1",
  Lobby = "null2",
  BusinessArea = "null3"
}

const RoomPropertiesMap: Record<string, RoomProperties> = {};
RoomPropertiesMap[Rooms.Demo] = demo;

export function GetRoomProperties(_roomID: string): RoomProperties | false {
  const result = RoomPropertiesMap[_roomID];
  if (!result) return false;
  else return result;
}
