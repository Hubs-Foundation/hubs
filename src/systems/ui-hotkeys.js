import { paths } from "./userinput/paths";
import { SOURCES } from "../storage/media-search-store";

const MEDIA_SEARCH_PATHS = [
  paths.actions.mediaSearch1,
  paths.actions.mediaSearch2,
  paths.actions.mediaSearch3,
  paths.actions.mediaSearch4,
  paths.actions.mediaSearch5,
  paths.actions.mediaSearch6,
  paths.actions.mediaSearch7
];

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

    for (let i = 0; i <= 6; i++) {
      if (this.userinput.get(MEDIA_SEARCH_PATHS[i])) {
        this.mediaSearchStore.sourceNavigate(SOURCES[i]);
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
