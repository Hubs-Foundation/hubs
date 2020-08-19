import getHubId from "./utils/hub-id";

const roomMapping = window.ROOM_MAPPING || {
  room1: "/EJY4miE/room-1",
  room2: "/XRfKSWB/room-2",
  room3: "/fcWA7EE/room-3",
  lobby: "/3maDzA9/lobby"
};

var roomMetadata = {
  room1: {
    // Tianyi's room
    streamUrl: "https://str33m.dr33mphaz3r.com/room1"
  },
  room2: {
    // Kynan's room
    streamUrl: "https://str33m.dr33mphaz3r.com/room2"
  },
  room3: {
    // Henry's room
    baseSpeed: 150,
    flyMode: true,
    freeRotation: true,
    streamUrl: "https://str33m.dr33mphaz3r.com/room3"
  },
  lobby: {
    streamVolume: 0.6,
    streamUrl: "https://str33m.dr33mphaz3r.com/lobby"
  }
};

for (var key in roomMapping) {
  roomMetadata[key].url = roomMapping[key];
}

export const roomName = (id = getHubId()) => hubIdToRoomKey[id];

var hubIdToRoomKey = {};

for (var key in roomMapping) {
  var url = roomMapping[key];
  var hubId = url.split("/")[1];
  hubIdToRoomKey[hubId] = key;
}

export function getRoomMetadata(roomKey) {
  if (!roomKey) {
    roomKey = roomName();
  }
  return roomMetadata[roomKey] || {};
}
