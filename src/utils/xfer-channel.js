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
  // onFinished: A promise that, when resolved, indicates the code was used or expired.
  // If expired, the string "expired" will be passed forward.
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
            if (Object.keys(state).length > 0) {
              // Code is in use by someone else, try a new one
              step();
            } else {
              readyToSend = true;
              resolve({ code, cancel, onFinished });
            }
          });

          channel.on("xfer_request", () => {
            if (readyToSend) {
              const payload = { path: location.pathname };

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

          channel.join();
        };

        step();
      });
    });
  };
}
