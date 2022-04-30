/**
 * plays volumentric performance toolkit stream \
 * @namespace vpt-stream
 * @component vpt-stream
 */

import { isNonCorsProxyDomain, guessContentType, proxiedUrlFor } from "../utils/media-url-utils";
import { buildAbsoluteURL } from "url-toolkit";
import configs from "../utils/configs";
import Hls from "hls.js";

import VPTStream from "vpt-stream";

AFRAME.registerComponent("vpt-stream", {
  schema: {
    src: { type: "string" },
    meta: { type: "string" },
    renderMode: { type: "string", default: "perspective" },
    depthMin: { type: "number", default: 0.0 },
    depthMax: { type: "number", default: 4.0 },
    pointSize: { type: "number", default: 8.0 },
    scale: { type: "number", default: 1.0 },
    startat: { type: "number", default: 0.0 },
    thresholdMin: { type: "vec3", default: { x: -2.0, y: -2.0, z: 0 } },
    thresholdMax: { type: "vec3", default: { x: 2.0, y: 2.0, z: 4.0 } },
    uiPosition: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    uiRotation: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    uiScale: { type: "vec3", default: { x: 1, y: 1, z: 1 } },
    uiDelay: { type: "number", default: 1.0 }
  },

  /**
   * Called once when component is attached. Generally for initial setup.
   */
  init: function() {
    //HACK: the way the vpt-stream library is built, it expects a global HLS object to exist
    window.Hls = Hls;

    this.vptstream = new VPTStream();
    this.vptstream.hls_xhroverride = this.proxyHLS;

    this.vptstream.addEventListener(VPTStream.STREAMEVENTS.PLAY_SUCCESS, function(event) {
      console.log(`STREAMEVENTS.PLAY_SUCCESS ${event.type} ${event.message}`);
    });

    this.vptstream.addEventListener(VPTStream.STREAMEVENTS.PLAY_ERROR, function(event) {
      console.log(`STREAMEVENTS.PLAY_ERROR ${event.type} ${event.message}`);
    });

    this.el.object3D.add(this.vptstream);

    //keep a ref to the video element so we can control it once we are loaded
    const _this = this;

    console.log("vpt-stream data");
    console.log(this.data);

    //TODO move autoplay into it's own AFRAME component

    //we need to have a "play/unmute" button for browsers that have strict autoplay settings
    this.autoplayUi = document.createElement("a-entity");
    //see hubs.html templage
    const template = document.getElementById("vpt-stream-autoplay");
    this.autoplayUi.appendChild(document.importNode(template.content, true));

    const pos = this.data.uiPosition;
    this.autoplayUi.object3D.position.set(pos.x, pos.y, pos.z);

    const rot = this.data.uiRotation;
    const noBillboard = rot.x + rot.y + rot.x > 0;
    if (noBillboard) {
      this.autoplayUi.object3D.rotation.set(rot.x, rot.y, rot.z);
    }

    const scale = this.data.uiScale;
    this.autoplayUi.object3D.scale.set(scale.x, scale.y, scale.z);
    this.el.appendChild(this.autoplayUi);

    this.autoplayUi.addEventListener("loaded", function() {
      if (noBillboard) {
        this.removeAttribute("billboard");
      }

      const btn = this.querySelector(".unmute-ui");
      btn.object3D.addEventListener("interact", function handler() {
        _this.playMedia();
        this.removeEventListener("interact", handler);
      });

      this.setAttribute("visible", false);
    });

    //listen for auto play events from the tool bar button
    this.el.sceneEl.addEventListener("autoplay_clicked", () => {
      _this.playMedia();
    });

    //wait for the environment to finish loading
    this.el.sceneEl.addEventListener("environment-scene-loaded", function() {
      _this.loadMedia();
    });
  },

  playMedia: function() {
    console.log("playMedia");
    this.vptstream.video
      .play()
      .then(() => {
        console.log("playMedia playing success");
        this.vptstream.playing = true;
      })
      .catch(function(error) {
        console.log(`playMedia error, ${error}`);
        this.vptstream.play = false;
      });
  },

  proxyHLS: function(xhr, u) {
    const corsProxyPrefix = `https://${configs.CORS_PROXY_SERVER}/`;
    if (u.startsWith(corsProxyPrefix)) {
      u = u.substring(corsProxyPrefix.length);
    }

    // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
    // TODO extend HLS.js to allow overriding of its internal resolving instead
    if (!u.startsWith("http")) {
      // TODO this never happens when running via MUX which is the only way we have tested vpt-stream in Hubs so far.
      u = buildAbsoluteURL(u, u.startsWith("/") ? u : `/${u}`);
    }

    //console.log("proxyHLS:" + proxiedUrlFor(u));
    xhr.open("GET", proxiedUrlFor(u));
  },

  /**
   * Called when component is attached and when component data changes.
   * Generally modifies the entity based on the data.
   */
  update: function(oldData) {},

  /**
   * Called when a component is removed (e.g., via removeAttribute).
   * Generally undoes all modifications to the entity.
   */
  remove: function() {},

  /**
   * Called on each scene tick.
   */
  tick: function(t) {
    const dT = performance.now() - this.vptstream.LoadTime;

    if (this.vptstream.LoadTime > 0 && dT > this.data.uiDelay) {
      const uiVisible = this.autoplayUi.getAttribute("visible");
      //console.log("loadTime:" + this.videoTexture.LoadTime + " dT:" + dT+ " video currentTime:" +  this.videoTexture.video.currentTime )
      if (this.vptstream.playing) {
        if (uiVisible) {
          this.el.sceneEl.emit("hide_autoplay_dialog", { videoref: this.vptstream.video });
          this.autoplayUi.setAttribute("visible", false);
        }
      } else {
        if (!uiVisible) {
          this.el.sceneEl.emit("show_autoplay_dialog", { videoref: this.vptstream.video });
          this.autoplayUi.setAttribute("visible", true);
        }
      }
    }
  },

  /**
   * Called when entity pauses.
   * Use to stop or remove any dynamic or background behavior such as events.
   */
  pause: function() {},

  /**
   * Called when entity resumes.
   * Use to continue or add any dynamic or background behavior such as events.
   */
  play: function() {},

  setVideoUrl(videoUrl) {
    if (this.vptstream) {
      this.vptstream.setVideoUrl(videoUrl);
    }
  },

  getDataValue(key, defaultValue) {
    if (this.data.hasOwnProperty(key)) {
      return this.data[key];
    } else {
      return defaultValue;
    }
  },

  async loadMedia() {
    if (!this.data.src || this.data.src.length < 5) {
      console.error("vptstream invalid src");
      return;
    }

    let url = this.data.src;
    const fileExtension = url.substr(url.lastIndexOf(".") + 1);

    if (fileExtension != "m3u8") {
      try {
        url = await fetch(url);
        url = await url.text();
      } catch (error) {
        console.error("vptstream Stream Load error", error);
        return;
      }
    }

    const proxySrc = proxiedUrlFor(url);

    const params = {
      videoPath: proxySrc,
      meta: this.data.meta,
      renderMode: this.data.renderMode,
      pointSize: this.data.pointSize,
      scale: this.data.scale,
      startat: this.data.startat,
      thresholdMin: this.data.thresholdMin,
      thresholdMax: this.data.thresholdMax
    };
    this.vptstream.load(params);
  }
});
