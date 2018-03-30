/**
 * Modified version of a-asset-item that adds high-src and low-src options
 * Extracted from https://github.com/aframevr/aframe/blob/master/src/core/a-assets.js
 */

AFRAME.registerElement("a-progressive-asset", {
  prototype: Object.create(AFRAME.ANode.prototype, {
    createdCallback: {
      value() {
        this.data = null;
        this.isAssetItem = true;
      }
    },

    attachedCallback: {
      value() {
        if (!this.parentNode.fileLoader) {
          throw new Error("a-progressive-asset must be the child of an a-assets element.");
        }

        this.fileLoader = this.parentNode.fileLoader;

        const self = this;
        const fallbackSrc = this.getAttribute("src");
        const highSrc = this.getAttribute("high-src");
        const lowSrc = this.getAttribute("low-src");

        let src = fallbackSrc;

        if (window.APP.quality === "high") {
          src = highSrc;
        } else if (window.APP.quality === "low") {
          src = lowSrc;
        }

        this.fileLoader.setResponseType(this.getAttribute("response-type"));
        this.fileLoader.load(
          src,
          function handleOnLoad(response) {
            self.data = response;
            /*
            Workaround for a Chrome bug. If another XHR is sent to the same url before the
            previous one closes, the second request never finishes.
            setTimeout finishes the first request and lets the logic triggered by load open
            subsequent requests.
            setTimeout can be removed once the fix for the bug below ships:
            https://bugs.chromium.org/p/chromium/issues/detail?id=633696&q=component%3ABlink%3ENetwork%3EXHR%20&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
          */
            setTimeout(function load() {
              AFRAME.ANode.prototype.load.call(self);
            });
          },
          function handleOnProgress(xhr) {
            self.emit("progress", {
              loadedBytes: xhr.loaded,
              totalBytes: xhr.total,
              xhr: xhr
            });
          },
          function handleOnError(xhr) {
            self.emit("error", { xhr: xhr });
          }
        );
      }
    }
  })
});
