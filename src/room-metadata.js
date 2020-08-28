import getHubId from "./utils/hub-id";

export const LOBBY_SCENE_ID = window.LOBBY_SID || "bWGEEsK";
export const lobbyIDs = window.LOBBY_IDS || ["3maDzA9", "Ek5qYcd", "zNYKYnv", "ApXo7Y3", "QETdxTw", "oQLA4Sx"];
export const inLobby = (id = getHubId()) => lobbyIDs.includes(id);

const roomMapping = window.ROOM_MAPPING || {
  room1: "/EJY4miE/t3kn0-sw4mp",
  room2: "/XRfKSWB/psyb3r-dung30n",
  room3: "/fcWA7EE/c3r3br4l-v0rt3x",
  lobby: "/3maDzA9/dr33m-pl4z4"
};

const roomMetadata = {
  room1: {
    // Tianyi's room
  },
  room2: {
    // Kynan's room
  },
  room3: {
    // Henry's room
    baseSpeed: 19,
    flyMode: true,
    freeRotation: true
  },
  lobby: {
    streamVolume: 0.6,
    requireLogin: false,
    enableMicrophone: true
  }
};

for (const key in roomMapping) {
  roomMetadata[key].url = roomMapping[key];
}

const hubIdToRoomKey = {};

for (const key in roomMapping) {
  const url = roomMapping[key];
  const hubId = url.split("/")[1];
  hubIdToRoomKey[hubId] = key;
}

export const currentRoomKey = (id = getHubId()) => hubIdToRoomKey[id];

export function getRoomMetadata(roomKey) {
  if (!roomKey) {
    roomKey = currentRoomKey();
  }
  return roomMetadata[roomKey] || {};
}

export const bestLobby = () => {
  return `/${lobbyIDs[0]}/hypnik_crypt333`;
};

export const getRoomURL = roomKey => {
  if (!roomKey) roomKey = currentRoomKey();
  return roomKey == "lobby" ? bestLobby() : getRoomMetadata(roomKey).url;
};
