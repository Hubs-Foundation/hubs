// Provides the idea of "media linking" -- if two media objects are linked
// then updates to one (src, page, etc) will be reflected on the other, and vice versa.
AFRAME.registerSystem("linked-media", {
  init: function() {
    this.handlers = [];
    this.addLinkageHandler = this.addLinkageHandler.bind(this);
    this.syncLinkage = this.syncLinkage.bind(this);
  },

  addLinkageHandler(elA, elB) {
    const handler = () => {
      // Since elB will have its event fired here if we change something, ignore it.
      if (elB._handlingLinkage) return;
      elA._handlingLinkage = true;
      this.syncLinkage(elA, elB);
      elA._handlingLinkage = false;
    };

    if (elA.components["media-loader"].data) {
      elA.addEventListener("componentchanged", handler);
    } else {
      const waitForMediaLoader = evt => {
        if (evt.detail.name === "media-loader") {
          elA.removeEventListener("componentinitialized", waitForMediaLoader);
          elA.addEventListener("componentchanged", handler);
        }
      };

      elA.addEventListener("componentinitialized", waitForMediaLoader);
    }

    return handler;
  },

  registerLinkage: function(elA, elB) {
    this.syncLinkage(elA, elB);

    const handlerA = this.addLinkageHandler(elA, elB);
    const handlerB = this.addLinkageHandler(elB, elA);
    elA.setAttribute("linked-media", "");
    elB.setAttribute("linked-media", "");

    this.handlers.push([elA, elB, handlerA, handlerB]);
  },

  deregisterLinkage: function(el) {
    // Deregister elA -> elB, get list of elBs
    for (const [elA, elB, handlerA, handlerB] of this.handlers) {
      if (el === elA || el === elB) {
        elA.removeEventListener("componentchanged", handlerA);
        elB.removeEventListener("componentchanged", handlerB);
      }
    }

    this.handlers = this.handlers.filter(([elA, elB]) => elA !== el && elB !== el);
  },

  syncLinkage(elA, elB) {
    if (elB.components["networked"]) {
      // Take ownership before updating
      if (!NAF.utils.isMine(elB) && !NAF.utils.takeOwnership(elB)) return;
    }

    const { src, version } = elA.components["media-loader"].data;

    // For now, manually sync linkable properties.
    elB.setAttribute("media-loader", { src, version });

    if (elA.components["media-pdf"]) {
      const { index } = elA.components["media-pdf"].data;
      elB.setAttribute("media-pdf", { index });
    }

    if (elA.components["media-video"]) {
      const { time, videoPaused, loop, hidePlaybackControls } = elA.components["media-video"].data;

      // Sync time, pause state, playback controls, and tighten sync tolerance since its local
      const syncedVideoAttributes = { time, videoPaused, loop, hidePlaybackControls };

      const targetIsNetworked = !elB.components.networked;
      if (targetIsNetworked) {
        syncedVideoAttributes.syncTolerance = 0.25;
      }

      elB.setAttribute("media-video", syncedVideoAttributes);
      elB.components["media-video"].updatePlaybackState(true);
    }
  }
});

AFRAME.registerComponent("linked-media", {
  remove: function() {
    this.system.deregisterLinkage(this.el);
  }
});
