import * as jsyaml from "js-yaml";
import { addDays, addHours, addMilliseconds, subMilliseconds, getUnixTime } from "date-fns";
import { mapValues } from "lodash";
import { duration } from "moment";

const stream_config = `
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
room2:
  tracks:
    - artist: Altjira
      title: Altjira
      length: 01:43:52
    - artist: DBR
      title: DBR
      length: 01:31:40
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

const playing = (playlist, time = new Date()) => {
  const { tracks, shift = 0 } = playlist;

  const runtime_reducer = (sum, { length }) => {
    return sum + length;
  };

  const runtime = tracks.reduce(runtime_reducer, 0);

  let offset = ((getUnixTime(time) + shift) * 1e3) % runtime;

  const track = tracks.find(({ length }) => {
    if (offset < length) {
      return true;
    } else {
      offset -= length;
      return false;
    }
  });

  return { track, offset };
};

// returns {room-name: [artist-key: time]}
const set_times = (playlist, from = new Date(), until = addDays(new Date(), 1)) => {
  // Super inefficient lol, i'm tired
  let time = from;
  const list = [];
  while (getUnixTime(time) < getUnixTime(until)) {
    const { track, offset } = playing(playlist, time);
    const { length } = track;
    const start = subMilliseconds(time, offset);
    time = addMilliseconds(time, length);
    list.push({ start, ...track });
  }

  return list;
};

console.log(playing(lineup.room1));
console.log(playing(lineup.room1, addHours(new Date(), 2)));
console.log(set_times(lineup.room1));
