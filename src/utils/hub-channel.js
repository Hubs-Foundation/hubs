import moment from "moment-timezone";

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

    const entryEvent = {
      ...entryTimingFlags,
      initialOccupantCount,
      entryDisplayType,
      userAgent: navigator.userAgent
    };

    this.channel.push("events:entered", entryEvent);
  };

  getEntryTimingFlags = () => {
    const entryTimingFlags = { isNewDaily: true, isNewMonthly: true, isNewDayWindow: true, isNewMonthWindow: true };

    if (!this.store.state.lastEnteredAt) {
      return entryTimingFlags;
    }

    const lastEntered = moment(this.store.state.lastEnteredAt);
    const lastEnteredPst = moment(lastEntered).tz("America/Los_Angeles");
    const nowPst = moment().tz("America/Los_Angeles");
    const dayWindowAgo = moment().subtract(1, "day");
    const monthWindowAgo = moment().subtract(1, "month");

    entryTimingFlags.isNewDaily =
      lastEnteredPst.dayOfYear() !== nowPst.dayOfYear() || lastEnteredPst.year() !== nowPst.year();
    entryTimingFlags.isNewMonthly =
      lastEnteredPst.month() !== nowPst.month() || lastEnteredPst.year() !== nowPst.year();
    entryTimingFlags.isNewDayWindow = lastEntered.isBefore(dayWindowAgo);
    entryTimingFlags.isNewMonthWindow = lastEntered.isBefore(monthWindowAgo);

    return entryTimingFlags;
  };

  disconnect = () => {
    if (this.channel) {
      this.channel.socket.disconnect();
    }
  };
}
