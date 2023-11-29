import { Vector3 } from "three";

interface RoomProperties {
  targets: saliencyProp[];
  dimensions: { height: number; box: [number, number, number, number] }[];
  connectors?: { end1: [number, number, number]; end2: [number, number, number] }[];
}

interface saliencyProp {
  name: string;
  pivot: [number, number, number];
  box: [number, number, number, number];
}

const demo: RoomProperties = {
  targets: [
    { name: "booth_1", pivot: [23.0, 0.0, 3], box: [19, 23, 1, 5] },
    { name: "booth_2", pivot: [22.0, 0.0, 18], box: [20, 24, 14, 18] },
    { name: "booth_3", pivot: [3.0, 0.0, 17], box: [3, 7, 15, 19] },
    { name: "booth_4", pivot: [3.0, 0.0, 3], box: [1, 5, 3, 7] },
    { name: "social_area", pivot: [12, 0.0, 10], box: [9, 15, 4, 10] },
    { name: "garden", pivot: [13, 0.0, 12], box: [10, 16, 12, 18] }
  ],
  dimensions: [
    { height: 0, box: [-12, 12, 1, 27] },
    { height: 0, box: [-2, 2, 28, 33] },
    { height: 4.59, box: [11, 17, 29, 32] },
    { height: 4.59, box: [-17, -11, 29, 32] },
    { height: 4.59, box: [-17, -13, 33, 39] },
    { height: 4.59, box: [13, 17, 33, 39] },
    { height: 4.59, box: [-12, 12, 34, 39] }
  ]
};

const tradeshows: RoomProperties = {
  targets: [
    { name: "booth 1", pivot: [7.5, 0, 8], box: [8, 12, 6, 10] },
    { name: "booth 2", pivot: [7.5, 0, 21], box: [8, 12, 19, 23] },
    { name: "booth 3", pivot: [-7.5, 0, 8], box: [-12, -8, 6, 10] },
    { name: "booth 4", pivot: [-7.5, 0, 21], box: [-12, -8, 19, 23] },
    { name: "social area", pivot: [0, 0, 13.5], box: [-5, 5, 3, 13] },
    { name: "statue", pivot: [0, 0, 26], box: [-5, 5, 16, 26] },
    { name: "exit", pivot: [-10.5, 0, 14], box: [-12, -11, 12, 17] },
    { name: "business room", pivot: [0, 0, 33], box: [-2, 2, 33, 34] },
    { name: "conference room", pivot: [0, 4.59, 39], box: [-2, 2, 39, 41] }
  ],
  dimensions: [
    { height: 0, box: [-12, 12, 1, 27] },
    { height: 0, box: [-2, 2, 28, 33] },
    { height: 4.59, box: [11, 17, 29, 32] },
    { height: 4.59, box: [-17, -11, 29, 32] },
    { height: 4.59, box: [-17, -13, 33, 39] },
    { height: 4.59, box: [13, 17, 33, 39] },
    { height: 4.59, box: [-12, 12, 34, 39] }
  ],
  connectors: [
    { end1: [2, 0, 30], end2: [10, 4.59, 30] },
    { end1: [-2, 0, 30], end2: [-10, 4.59, 30] },
    { end1: [2, 0, 31], end2: [10, 4.59, 31] },
    { end1: [-2, 0, 31], end2: [-10, 4.59, 31] }
  ]
};

enum Rooms {
  Demo = "iotAJFL",
  Tradeshows = "E5FoNKq",
  ConferenceRoom = "g4Antqh",
  Lobby = "null2",
  BusinessArea = "null3"
}

const RoomPropertiesMap: Record<string, RoomProperties> = {};
RoomPropertiesMap[Rooms.Demo] = demo;
RoomPropertiesMap[Rooms.Tradeshows] = tradeshows;

export function GetRoomProperties(_roomID: string): RoomProperties | false {
  const result = RoomPropertiesMap[_roomID];
  if (!result) return false;
  else return result;
}
