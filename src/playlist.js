import * as jsyaml from "js-yaml";
import { addDays, addHours, addMilliseconds, subMilliseconds, getUnixTime } from "date-fns";
import { mapValues } from "lodash";
import { duration } from "moment";
// import getHubId from "./utils/hub-id";
import { roomName } from "./room-metadata";

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
    - artist: Artemis
      title: Artemis
      length: 01:17:54
    - artist: DJ Marcelle
      title: DJ-Marcelle
      length: 00:30:00
    - artist: K.L. Mai
      title: KL-Mai
      length: 00:41:37
    - artist: Mija Healey
      title: Mija-Healey
      length: 01:17:11
    - artist: Nar
      title: Nar
      length: 00:53:17
    - artist: Spekki Webu
      title: Spekki-Webu
      length: 01:05:55
    - artist: Vox Supreme
      title: Vox-Supreme
      length: 01:18:17
room2:
  tracks:
    - artist: Altjira
      title: Altjira
      length: 01:43:52
    - artist: DBR
      title: DBR
      length: 01:31:40
    - artist: Factor XIII
      title: Factor-XIII
      length: 01:16:03
    - artist: Ham Laosethakul
      title: Ham-Laosethakul
      length: 02:28:06
room3:
  tracks:
    - artist: nicha 'n' hooch
      title: nicha-n-hooch
      length: 01:37:42
    - artist: synergetix
      title: synergetix
      length: 01:00:19
`;

const parseTrackDurations = ({ tracks, ...meta }) => {
  const converted = tracks.map(({ length, ...rest }) => ({ length: duration(length).asMilliseconds(), ...rest }));
  return { tracks: converted, ...meta };
};

const lineup = mapValues(jsyaml.load(stream_config), parseTrackDurations);

export const roomPlaylist = (room = roomName()) => lineup[room].tracks;

// Who is currently playing
export const currentlyPlaying = (room = roomName(), time = new Date()) => {
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
export const setTimes = (room = roomName(), from = new Date(), until = addDays(new Date(), 1)) => {
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
