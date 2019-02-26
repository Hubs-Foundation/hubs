import { paths } from "./userinput/paths";
import { SOURCES } from "../storage/media-search-store";

// Every frame, looks for input paths that trigger UI-relevant events and handles them.
AFRAME.registerSystem("ui-hotkeys", {
  init() {
    this.mediaSearchStore = window.APP.mediaSearchStore;
  },

  tick: function() {
    if (!this.userinput) {
      this.userinput = this.el.systems.userinput;
    }

    if (this.userinput.get(paths.actions.focusChat)) {
      this.focusChat();
    }

    if (this.userinput.get(paths.actions.focusChatCommand)) {
      this.focusChat("/");
    }

    if (this.userinput.get(paths.actions.mediaExit)) {
      this.mediaSearchStore.pushExitMediaBrowserHistory();
    }

    for (let i = 1; i <= 7; i++) {
      if (this.userinput.get(`/actions/mediaSearch${i}`)) {
        this.mediaSearchStore.sourceNavigate(SOURCES[i - 1]);
      }
    }
  },

  focusChat: function(prefix) {
    const target = document.querySelector(".chat-focus-target");

    target.focus();

    if (prefix) {
      target.value = prefix;
    }
  }
});
