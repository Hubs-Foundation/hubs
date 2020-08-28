import * as jsyaml from "js-yaml";
import { addDays, addHours, addMilliseconds, subMilliseconds, getUnixTime } from "date-fns";
import { mapValues } from "lodash";
import { duration } from "moment";
// import getHubId from "./utils/hub-id";
import { currentRoomKey } from "./room-metadata";

const stream_config =
  window.PLAYLIST ||
  `
lobby:
  shift: 0 # optional second shift key
  tracks:
    - artist: dr33m
      title: lobby
      length: 00:36:56
room1:
  tracks:
    - artist: "DJ Marcelle"
      title: "DJ-Marcelle"
      length: "00:30:00"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Vox Supreme"
      title: "Vox-Supreme"
      length: "01:18:17"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "K.L. Mai"
      title: "KL-Mai"
      length: "00:41:37"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Artemis"
      title: "Artemis"
      length: "01:17:54"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "pyruvicac.id"
      title: "Pyruvic-Acid"
      length: "01:10:53"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Nar"
      title: "Nar"
      length: "00:53:17"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Mija Healey"
      title: "Mija-Healey"
      length: "01:17:11"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Spekki Webu"
      title: "Spekki-Webu"
      length: "01:05:55"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

room2:
  tracks:
    - artist: "Woody92"
      title: "woody92"
      length: "01:06:09"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Ham Laosethakul"
      title: "Ham-Laosethakul"
      length: "02:28:07"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "Altjira"
      title: "Altjira"
      length: "01:43:53"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Kia"
      title: "Kia"
      length: "01:06:42"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "DBR"
      title: "DBR"
      length: "01:31:41"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Harold"
      title: "Harold"
      length: "01:28:43"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Factor XIII"
      title: "Factor-XIII"
      length: "01:16:04"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

room3:
  tracks:
    - artist: "Bartolomé"
      title: "Bartolome"
      length: "00:47:23"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "S1m0nc3ll0"
      title: "s1m0nc3ll0"
      length: "01:02:28"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Meuko! Meuko!"
      title: "meuko-meuko"
      length: "00:32:23"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "!luuli"
      title: "luuli"
      length: "02:24:41"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "Synergetix [live]"
      title: "synergetix"
      length: "00:50:01"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "Nicha’N’Hooch"
      title: "nicha-n-hooch"
      length: "01:37:42"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-2"
      length: "00:00:10"

    - artist: "D-Grade x Durin’s Bane"
      title: "D-Grade-Durins-Bane"
      length: "01:15:58"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"

    - artist: "Thick Owens pres. The Coretaker"
      title: "Thick-Owens-pres-The-Coretaker"
      length: "01:10:27"

    - artist: "~~~dr33m~~~dr33m~~~dr33m~~~"
      title: "dr33m-1"
      length: "00:00:11"
`;

const parseTrackDurations = ({ tracks, ...meta }) => {
  const converted = tracks.map(({ length, ...rest }) => ({ length: duration(length).asMilliseconds(), ...rest }));
  return { tracks: converted, ...meta };
};

const lineup = mapValues(jsyaml.load(stream_config), parseTrackDurations);

export const roomPlaylist = (room = currentRoomKey()) => lineup[room].tracks;

// Who is currently playing
export const currentlyPlaying = (room = currentRoomKey(), time = new Date()) => {
  if (!lineup[room]) return null;

  const { tracks, shift = 0 } = lineup[room];

  const runtimeReducer = (sum, { length }) => {
    return sum + length;
  };

  const runtime = tracks.reduce(runtimeReducer, 0);

  let offset = ((getUnixTime(time) + shift) * 1e3) % runtime;

  const track = tracks.find(({ length }) => {
    if (offset < length) {
      return true;
    } else {
      offset -= length;
      return false;
    }
  });

  return { ...track, offset };
};

// Creates a list of tracks, with their `start` time merged.
export const setTimes = (room = currentRoomKey(), from = new Date(), until = addDays(new Date(), 1)) => {
  if (!lineup[room]) return null;

  // Super inefficient lol, i'm tired
  let time = from;
  const list = [];
  while (getUnixTime(time) < getUnixTime(until)) {
    const { track, offset } = currentlyPlaying(room, time);
    const { length } = track;
    const start = subMilliseconds(time, offset);
    time = addMilliseconds(time, length);
    list.push({ start, ...track });
  }

  return list;
};
