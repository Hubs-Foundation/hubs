import { denoisePresence } from "./utils/phoenix-utils";
import { Presence } from "phoenix";
import { emitter } from "./emitter";
import { eventNamesForRoomId } from "./utils/event-names-for-room-id";

export class Jeejah {
  constructor({ socket, roomId }) {
    const events = new emitter();
    const channel = socket.channel(`room:${roomId}`);
    const presence = new Presence(channel);
    const { JOIN, LEAVE, CHANGE, SYNC, CREATE, UPDATE, DELETE } = eventNamesForRoomId(roomId);
    const { rawOnJoin, rawOnLeave } = denoisePresence({
      onJoin: (key, meta) => {
        events.trigger(JOIN, { key, meta });
      },
      onLeave: (key, meta) => {
        events.trigger(LEAVE, { key, meta });
      },
      onChange: (key, previous, current) => {
        events.trigger(CHANGE, { key, previous, current });
      }
    });
    presence.onJoin(rawOnJoin);
    presence.onLeave(rawOnLeave);
    presence.onSync(() => {
      events.trigger(SYNC, { presence });
    });

    channel.on(CREATE, payload => {
      events.trigger(CREATE, payload);
    });

    channel.on(UPDATE, payload => {
      events.trigger(`${UPDATE}`, payload);
    });

    channel.on(DELETE, payload => {
      events.trigger(`${DELETE}`, payload);
    });

    channel
      .join()
      .receive("ok", () => {
        events.trigger("join-ok", { roomId });
      })
      .receive("error", data => {
        console.error("got error from channel", data);
      });

    this.roomId = roomId;
    this.events = events;
    this.channel = channel;
    this.presence = presence;
  }

  create(payload) {
    const { CREATE } = eventNamesForRoomId(this.roomId);
    this.channel.push(CREATE, payload);
  }
  update(payload) {
    const { UPDATE } = eventNamesForRoomId(this.roomId);
    this.channel.push(UPDATE, payload);
  }
  delete(payload) {
    const { DELETE } = eventNamesForRoomId(this.roomId);
    this.channel.push(DELETE, payload);
  }
}
