import { Vector3 } from "three";

interface RoomProperties {
  exceptions: number[][];
  saliency: object;
  dimensions: number[];
}

const demo = {
  exceptions: [
    [1.5, 4.5, 2, 5],
    [20.5, 23.5, 2, 5],
    [20.5, 23.5, 15, 18],
    [1.5, 4.5, 15, 18],
    [10, 15, 13.5, 18.5],
    [10, 15, 3.5, 9]
  ],
  saliency: {
    booth_1: [24.0, 0.0, 3.5],
    booth_2: [22.0, 0.0, 18.5],
    booth_3: [1.0, 0.0, 16.5],
    booth_4: [3.0, 0.0, 1.5],
    social_area: [12.5, 0.0, 9.5],
    garden: [16.5, 0.0, 16.0]
  },
  dimensions: [0, 25, 0, 20]
};

enum Rooms {
  Demo = "oo9A5q2",
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
