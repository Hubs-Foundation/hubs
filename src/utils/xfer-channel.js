export default class XferChannel {
  constructor(store) {
    this.store = store;
  }

  setSocket = socket => {
    this.socket = socket;
  };

  // Returns a promise that, when resolved, will forward an object with three keys:
  //
  // code: The code that was made available to use for xfer.
  //
  // cancel: A function that the caller can call to cancel the use of the code.
  //
  // onFinished: A promise that, when resolved, indicates the code is no longer usable,
  // because it was either successfully used by the remote device or it has expired
  // ("used" or "expired" is passed to the callback.)
  generateCode = () => {
    return new Promise(resolve => {
      const onFinished = new Promise(finished => {
        const step = () => {
          const code = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");

          // Only respond to one xfer_request in this channel.
          let readyToSend = false;

          const channel = this.socket.channel(`xfer:${code}`, { timeout: 10000 });
          const cancel = () => channel.leave();

          channel.on("xfer_expired", () => finished("expired"));

          channel.on("presence_state", state => {
            if (readyToSend) return;

            if (Object.keys(state).length > 0) {
              // Code is in use by someone else, try a new one
              step();
            } else {
              readyToSend = true;
              resolve({ code, cancel, onFinished });
            }
          });

          channel.on("xfer_request", incoming => {
            if (readyToSend) {
              const payload = { path: location.pathname, target_session_id: incoming.reply_to_session_id };

              // Copy profile data to xfer'ed device if it's been set.
              if (this.store.state.activity.hasChangedName) {
                payload.profile = { ...this.store.state.profile };
              }

              channel.push("xfer_response", payload);
              channel.leave();
              finished("used");
              readyToSend = false;
            }
          });

          channel.join().receive("error", r => console.error(r));
        };

        step();
      });
    });
  };

  // Attempts to receive an xfer payload from a remote device using the given code.
  //
  // Promise rejects if the code is invalid or there is a problem with the channel.
  // Promise resolves and passes payload of xfer source on successful xfer.
  attemptXfer = code => {
    return new Promise((resolve, reject) => {
      const channel = this.socket.channel(`xfer:${code}`, { timeout: 10000 });
      let finished = false;

      channel.on("presence_state", state => {
        const numOccupants = Object.keys(state).length;

        if (numOccupants === 1) {
          // Great, only sender is in topic, request xfer
          channel.push("xfer_request", { reply_to_session_id: this.socket.params.session_id });

          setTimeout(() => {
            if (finished) return;
            channel.leave();
            reject("no_response");
          }, 10000);
        } else if (numOccupants === 0) {
          // Nobody in this channel, probably a bad code.
          reject("failed");
        } else {
          console.warn("xfer code channel already has 2 or more occupants, something fishy is going on.");
          reject("in_use");
        }
      });

      channel.on("xfer_response", payload => {
        finished = true;
        channel.leave();
        resolve(payload);
      });

      channel.join().receive("error", r => console.error(r));
    });
  };
}
