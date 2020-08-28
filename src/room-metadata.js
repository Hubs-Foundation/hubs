import getHubId from "./utils/hub-id";

import { fetchPublicRooms } from "./utils/phoenix-utils";
import configs from "./utils/configs";

const maxRoomCap = configs.feature("max_room_cap") || 50;

export const LOBBY_SCENE_ID = window.LOBBY_SCENE_ID || "kPeiTQC";
export const ENABLE_LOAD_BALANCING = !!window.ENABLE_LOAD_BALANCING;
export const lobbyIDs = window.LOBBY_IDS || ["3maDzA9", "ApXo7Y3", "Ek5qYcd", "QETdxTw", "oQLA4Sx", "zNYKYnv"];

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
    requireLogin: true
  },
  room2: {
    // Kynan's room
    requireLogin: true
  },
  room3: {
    // Henry's room
    requireLogin: true,
    baseSpeed: 19,
    flyMode: true,
    freeRotation: true
  },
  lobby: {
    streamVolume: 0.5,
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

lobbyIDs.forEach(lobbyID => (hubIdToRoomKey[lobbyID] = "lobby"));

export const currentRoomKey = (id = getHubId()) => hubIdToRoomKey[id];

export function getRoomMetadata(roomKey) {
  if (!roomKey) roomKey = currentRoomKey();
  return roomMetadata[roomKey] || {};
}

export const bestLobby = async () => {
  const defaultLobby = `/${lobbyIDs[0]}/hypnik_crypt333`;
  if (!ENABLE_LOAD_BALANCING) return defaultLobby;

  const rooms = await fetchPublicRooms();

  const lobbies = rooms.filter(room => room.scene_id === LOBBY_SCENE_ID);

  // Get the list of all the occupied rooms that aren't full and sort them by number of users in ascending order.
  const sortedOccupiedRooms = lobbies
    .filter(room => room.member_count < room.room_size && room.member_count > 0)
    .sort((a, b) => a.member_count - b.member_count);

  let room;

  if (sortedOccupiedRooms.length > 0) {
    room = sortedOccupiedRooms[0];

    // If the room is over 50% full give a 50% chance to move the user to an unoccupied room.
    if (room.member_count > room.room_size / 2 && Math.random() > 0.5) {
      const unoccupiedRooms = rooms.filter(room => room.member_count === 0);

      // If there is an unoccupied room availible pick one at random
      if (unoccupiedRooms.length > 0) {
        const index = Math.round(Math.random() * unoccupiedRooms.length);
        room = unoccupiedRooms[index];
      }
    }
  } else {
    // Otherwise just put the user in the occupied room
    const emptyRooms = lobbies.filter(room => room.member_count === 0);

    // Otherwise pick an empty room at random.
    if (emptyRooms.length > 0) {
      const index = Math.round(Math.random() * emptyRooms.length);
      room = emptyRooms[index];
    } else {
      const spectatorRooms = rooms.filter(room => room.member_count + room.lobby_count < maxRoomCap);

      // If there are no empty rooms, just put the user in any room that has space for a spectator
      if (spectatorRooms.length > 0) {
        const index = Math.round(Math.random() * spectatorRooms.length);
        room = spectatorRooms[index];
      }
    }
  }

  return room ? new URL(room.url).pathname : defaultLobby;
};

export const getRoomURL = roomKey => {
  if (!roomKey) roomKey = currentRoomKey();
  return roomKey == "lobby" ? bestLobby() : getRoomMetadata(roomKey).url;
};
