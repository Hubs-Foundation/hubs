export function denoisePresence({ onJoin, onLeave, onChange }) {
  return {
    rawOnJoin: (key, beforeJoin, afterJoin) => {
      if (beforeJoin === undefined) {
        onJoin(key, afterJoin.metas[0]);
      }
    },
    rawOnLeave: (key, remaining, removed) => {
      if (remaining.metas.length === 0) {
        onLeave(key, removed.metas[0]);
      } else {
        onChange(key, removed.metas[removed.metas.length - 1], remaining.metas[remaining.metas.length - 1]);
      }
    }
  };
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    let didTerminate = false;
    setTimeout(() => {
      if (didTerminate) return;
      reject(`Request timed out in ${ms} milliseconds`);
    }, ms);
    promise
      .then(data => {
        didTerminate = true;
        resolve(data);
      })
      .catch(data => {
        didTerminate = true;
        reject(data);
      });
  });
}

export function joinChannel(channel) {
  return new Promise((resolve, reject) => {
    channel
      .join()
      .receive("ok", data => resolve(data))
      .receive("error", data => {
        channel.leave();
        reject(data);
      });
  });
}

function connectToSocket(socket) {
  return new Promise((resolve, reject) => {
    socket.onOpen(resolve);
    socket.onError(reject);
    socket.connect();
  });
}
