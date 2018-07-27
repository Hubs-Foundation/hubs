const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

function isSameMonth(da, db) {
  return da.getFullYear() == db.getFullYear() && da.getMonth() == db.getMonth();
}

function isSameDay(da, db) {
  return isSameMonth(da, db) && da.getDate() == db.getDate();
}

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
    const storedLastEnteredAt = this.store.state.activity.lastEnteredAt;

    if (!storedLastEnteredAt) {
      return entryTimingFlags;
    }

    const now = new Date();
    const lastEntered = new Date(storedLastEnteredAt);
    const msSinceLastEntered = now - lastEntered;

    // note that new daily and new monthly is based on client local time
    entryTimingFlags.isNewDaily = !isSameDay(now, lastEntered);
    entryTimingFlags.isNewMonthly = !isSameMonth(now, lastEntered);
    entryTimingFlags.isNewDayWindow = msSinceLastEntered > MS_PER_DAY;
    entryTimingFlags.isNewMonthWindow = msSinceLastEntered > MS_PER_MONTH;

    return entryTimingFlags;
  };

  disconnect = () => {
    if (this.channel) {
      this.channel.socket.disconnect();
    }
  };
}
