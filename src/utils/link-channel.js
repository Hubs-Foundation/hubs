import { generatePublicKeyAndEncryptedObject, generateKeys, decryptObject } from "./crypto";

const LINK_ACTION_TIMEOUT = 10000;

export default class LinkChannel {
  constructor(store) {
    this.store = store;
  }

  setSocket = socket => {
    this.socket = socket;
  };

  // Returns a promise that, when resolved, will forward an object with three keys:
  //
  // code: The code that was made available to use for link.
  //
  // cancel: A function that the caller can call to cancel the use of the code.
  //
  // onFinished: A promise that, when resolved, indicates the code is no longer usable,
  // because it was either successfully used by the remote device or it has expired
  // ("used" or "expired" is passed to the callback).
  generateCode = () => {
    return new Promise(resolve => {
      const onFinished = new Promise(finished => {
        const step = () => {
          const getLetter = () => "ABCDEFGHI"[Math.floor(Math.random() * 9)];
          const code = `${getLetter()}${getLetter()}${getLetter()}${getLetter()}`;

          // Only respond to one link_request in this channel.
          let readyToSend = false;
          let leftChannel = false;

          const channel = this.socket.channel(`link:${code}`, { timeout: LINK_ACTION_TIMEOUT });

          const leave = () => {
            if (!leftChannel) channel.leave();
            leftChannel = true;
          };

          const cancel = () => leave();

          channel.on("link_expired", () => finished("expired"));

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

          channel.on("link_request", incoming => {
            if (readyToSend) {
              const data = { path: location.pathname };

              // Copy profile data to link'ed device if it's been set.
              if (this.store.state.activity.hasChangedName) {
                data.profile = { ...this.store.state.profile };
              }
              data.credentials = { ...this.store.state.credentials };

              generatePublicKeyAndEncryptedObject(incoming.public_key, data).then(
                ({ publicKeyString, encryptedData }) => {
                  const payload = {
                    target_session_id: incoming.reply_to_session_id,
                    public_key: publicKeyString,
                    data: encryptedData
                  };

                  if (!leftChannel) {
                    channel.push("link_response", payload);
                  }

                  leave();

                  finished("used");
                  readyToSend = false;
                }
              );
            }
          });

          channel.join().receive("error", r => console.error(r));
        };

        step();
      });
    });
  };

  // Attempts to receive a link payload from a remote device using the given code.
  //
  // Promise rejects if the code is invalid or there is a problem with the channel.
  // Promise resolves and passes payload of link source on successful link.
  attemptLink = code => {
    return new Promise((resolve, reject) => {
      const channel = this.socket.channel(`link:${code}`, { timeout: LINK_ACTION_TIMEOUT });
      let finished = false;

      generateKeys().then(({ publicKeyString, privateKey }) => {
        channel.on("presence_state", state => {
          const numOccupants = Object.keys(state).length;

          if (numOccupants === 1) {
            // Great, only sender is in topic, request link
            channel.push("link_request", {
              reply_to_session_id: this.socket.params().session_id,
              public_key: publicKeyString
            });

            setTimeout(() => {
              if (finished) return;
              channel.leave();
              reject(new Error("no_response"));
            }, LINK_ACTION_TIMEOUT);
          } else if (numOccupants === 0) {
            // Nobody in this channel, probably a bad code.
            channel.leave();
            reject(new Error("failed"));
          } else {
            console.warn("link code channel already has 2 or more occupants, something fishy is going on.");
            channel.leave();
            reject(new Error("in_use"));
          }
        });

        channel.on("link_response", payload => {
          finished = true;
          channel.leave();

          decryptObject(payload.public_key, privateKey, payload.data).then(resolve);
        });

        channel
          .join()
          .receive("ok", data => (this.socket.params().session_id = data.session_id))
          .receive("error", r => console.error(r));
      });
    });
  };
}
