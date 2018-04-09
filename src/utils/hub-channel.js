export default class HubChannel {
  constructor(store) {
    this.store = store;
  }

  setPhoenixChannel = channel => {
    this.channel = channel;
  };

  sendEntryEvent = async () => {
    if (!this.channel) {
      console.warn("No phoenix channel initialized before room entry.");
      return;
    }

    let entryDisplayType = "Screen";

    if (navigator.getVRDisplays) {
      const vrDisplay = (await navigator.getVRDisplays()).find(d => d.isPresenting);

      if (vrDisplay) {
        entryDisplayType = vrDisplay.displayName;
      }
    }

    // This is fairly hacky, but gets the # of initial occupants
    let initialOccupantCount = 0;

    if (NAF.connection.adapter && NAF.connection.adapter.publisher) {
      initialOccupantCount = NAF.connection.adapter.publisher.initialOccupants.length;
    }

    const entryTimingFlags = { isNewDay: true, isNewMonth: false };

    const entryEvent = {
      ...entryTimingFlags,
      initialOccupantCount,
      entryDisplayType,
      userAgent: navigator.userAgent
    };

    this.channel.push("events:entered", entryEvent);
  };

  disconnect = () => {
    if (this.channel) {
      this.channel.socket.disconnect();
    }
  };
}
