import { Socket, Presence } from "phoenix";

export function denoisePresence({ onJoin, onLeave, onChange }) {
  return {
    rawOnJoin: (key, beforeJoin, afterJoin) => {
      if (beforeJoin === undefined && afterJoin.metas.length === 1) {
        onJoin(key, afterJoin.metas[0]);
      }
    },
    rawOnLeave: (key, remaining, removed) => {
      if (remaining.metas.length === 0 && removed.metas.length === 1) {
        onLeave(key, removed.metas[0]);
      } else {
        onChange(removed.metas[removed.metas.length - 1], remaining.metas[remaining.metas.length - 1]);
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

function joinChannel(channel) {
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

export async function netcode({
  protocol,
  port,
  host,
  hubId,
  hubChannelParams,
  onHubChannelPresenceSync,
  onHubChannelPresenceJoin,
  onHubChannelPresenceLeave
}) {
  const maybePort = port ? `:${port}` : "";
  const socketUrl = `${protocol}://${host}${maybePort}`;
  const socket = new Socket(`${socketUrl}/socket`, {});
  socket.onError(console.error);
  socket.onClose(console.log);
  socket.onOpen(console.log);
  const channels = new Map();
  const retChannelTopic = "ret";
  const retChannel = socket.channel(retChannelTopic, { hub_id: hubId });
  channels.set(retChannelTopic, retChannel);
  const hubChannelTopic = `hub:${hubId}`;
  const hubChannel = socket.channel(hubChannelTopic, hubChannelParams);
  channels.set(hubChannelTopic, hubChannel);
  const hubChannelPresence = new Presence(hubChannel);
  hubChannelPresence.onSync(() => {
    onHubChannelPresenceSync(hubChannelPresence);
  });
  hubChannelPresence.onJoin(onHubChannelPresenceJoin);
  hubChannelPresence.onLeave(onHubChannelPresenceLeave);

  try {
    await withTimeout(connectToSocket(socket), 5000);
  } catch (e) {
    console.error("Failed to connect to reticulum.");
    return;
  }
  const joinChannelTimeoutMS = 2000;
  try {
    await withTimeout(joinChannel(retChannel), joinChannelTimeoutMS);
  } catch (e) {
    console.error("Failed to join channel.", retChannelTopic, e);
    return;
  }

  let sessionId;
  let sessionToken;
  let permsToken;
  try {
    const { session_id, session_token, perms_token } = await withTimeout(joinChannel(hubChannel), joinChannelTimeoutMS);
    sessionId = session_id;
    sessionToken = session_token;
    permsToken = perms_token;
  } catch (e) {
    console.error("Failed to join channel.", hubChannel, e);
    return;
  }

  return {
    socket,
    channels,
    hubChannelPresence,
    sessionId,
    sessionToken,
    permsToken
  };
}
