import getHubId from "./utils/hub-id";

const roomMapping = window.ROOM_MAPPING || {
  "room1": "/EJY4miE/t3kn0-sw4mp",
  "room2": "/XRfKSWB/psyb3r-dung30n",
  "room3": "/fcWA7EE/c3r3br4l-v0rt3x",
  "lobby": "/3maDzA9/dr33m-pl4z4",
};

var roomMetadata = {
  "room1": { // Tianyi's room
    streamUrl: "https://str33m.dr33mphaz3r.com/room1"
  },
  "room2": { // Kynan's room
    streamUrl: "https://str33m.dr33mphaz3r.com/room2"
  },
  "room3": { // Henry's room
    baseSpeed: 150,
    flyMode: true,
    freeRotation: true,
    streamUrl: "https://str33m.dr33mphaz3r.com/room3"
  },
  "lobby": {
    streamVolume: 0.6,
    streamUrl: "https://str33m.dr33mphaz3r.com/lobby"
  }
}

for(var key in roomMapping) {
  roomMetadata[key].url = roomMapping[key];
}

var hubIdToRoomKey = {};
for(var key in roomMapping){
  var url = roomMapping[key];
  var hubId = url.split('/')[1];
  hubIdToRoomKey[hubId] = key;
}

export default function getRoomMetadata(roomKey) {
  if (!roomKey) {
    const hubId = getHubId();
    roomKey = hubIdToRoomKey[hubId]
  }
  return roomMetadata[roomKey] || {}
}