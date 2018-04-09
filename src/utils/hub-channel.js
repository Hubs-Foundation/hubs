import moment from "moment";

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

    const entryTimingFlags = this.getEntryTimingFlags();
    console.log(entryTimingFlags);

    const entryEvent = {
      ...entryTimingFlags,
      initialOccupantCount,
      entryDisplayType,
      userAgent: navigator.userAgent
    };

    this.channel.push("events:entered", entryEvent);
  };

  getEntryTimingFlags = () => {
    const entryTimingFlags = { isNewDaily: true, isNewMonthly: true, isNewDayHourWindow: true, isNewMonthWindow: true };

    if (!this.store.state.lastEnteredAt) {
      return entryTimingFlags;
    }

    const lastEntered = moment(this.store.state.lastEnteredAt);
    const dayWindowAgo = moment().subtract(1, "day");
    const monthWindowAgo = moment().subtract(1, "month");
  };

  disconnect = () => {
    if (this.channel) {
      this.channel.socket.disconnect();
    }
  };
}
