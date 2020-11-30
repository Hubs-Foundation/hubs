import "./stats-plus.css";
import qsTruthy from "../utils/qs_truthy";

// Adapted from https://github.com/aframevr/aframe/blob/master/src/components/scene/stats.js

function createStats(scene) {
  const threeStats = new window.threeStats(scene.renderer);
  const aframeStats = new window.aframeStats(scene);
  const plugins = scene.isMobile ? [] : [threeStats, aframeStats];
  return new window.rStats({
    css: [], // Our stylesheet is injected from AFrame.
    values: {
      fps: { caption: "fps", below: 30 },
      batchdraws: { caption: "Draws" },
      batchinstances: { caption: "Instances" },
      batchatlassize: { caption: "Atlas Size" }
    },
    groups: [
      { caption: "Framerate", values: ["fps", "raf", "physics"] },
      { caption: "Batching", values: ["batchdraws", "batchinstances", "batchatlassize"] }
    ],
    plugins: plugins
  });
}

const HIDDEN_CLASS = "a-hidden";

AFRAME.registerComponent("stats-plus", {
  // Whether or not the stats panel is expanded.
  // Shows FPS counter when collapsed.
  schema: { default: false },
  init() {
    this.onExpand = this.onExpand.bind(this);
    this.onCollapse = this.onCollapse.bind(this);
    this.onEnterVr = this.onEnterVr.bind(this);
    this.onExitVr = this.onExitVr.bind(this);

    const scene = this.el.sceneEl;
    this.stats = createStats(scene);
    this.statsEl = document.querySelector(".rs-base");
    // HACK for now in rare case where dom isn't ready, just bail
    if (!this.statsEl) return;

    // Add header to stats panel so we can collapse it
    const statsHeaderEl = document.createElement("div");
    statsHeaderEl.classList.add("rs-header");

    const statsTitleEl = document.createElement("h1");
    statsTitleEl.innerHTML = "Stats";
    statsHeaderEl.appendChild(statsTitleEl);

    const collapseEl = document.createElement("div");
    collapseEl.classList.add("rs-collapse-btn");
    collapseEl.innerHTML = "X";
    collapseEl.addEventListener("click", this.onCollapse);
    statsHeaderEl.appendChild(collapseEl);

    this.statsEl.insertBefore(statsHeaderEl, this.statsEl.firstChild);

    // Add fps counter to the page
    this.fpsEl = document.createElement("div");
    this.fpsEl.addEventListener("click", this.onExpand);
    this.fpsEl.classList.add("rs-fps-counter");
    document.body.appendChild(this.fpsEl);
    this.lastFpsUpdate = performance.now();
    this.lastFps = 0;
    this.frameCount = 0;
    this.inVR = scene.is("vr-mode");
    this.showFPSCounter = window.APP.store.state.preferences.showFPSCounter;
    this.fpsEl.style.display = this.showFPSCounter ? "block" : "none";

    if (scene.isMobile) {
      this.statsEl.classList.add("rs-mobile");
      this.fpsEl.classList.add("rs-mobile");
    }

    scene.addEventListener("enter-vr", this.onEnterVr);
    scene.addEventListener("exit-vr", this.onExitVr);

    this.vrStatsEnabled = qsTruthy("vrstats");
    if (this.vrStatsEnabled) {
      this.initVRStats();
    }
    this.lastUpdate = 0;
  },
  initVRStats() {
    this.vrPanel = document.createElement("a-entity");
    this.vrPanel.setAttribute("text", { width: 0.5, whiteSpace: "pre", value: "_", baseline: "bottom" });
    this.vrPanel.addEventListener(
      "loaded",
      () =>
        this.vrPanel.object3D.traverse(x => {
          if (x.material) x.material.depthTest = false;
        }),
      { once: true }
    );
    this.el.append(this.vrPanel);
    const background = document.createElement("a-plane");
    background.setAttribute("color", "#333333");
    background.setAttribute("material", "shader", "flat");
    background.setAttribute("material", "depthTest", false);
    background.setAttribute("width", 0.1);
    background.setAttribute("height", 0.12);
    background.setAttribute("position", "-0.2 0.055 0");
    this.el.append(background);
  },
  toggleVRStats() {
    if (this.vrStatsEnabled) {
      this.el.object3D.visible = false;
      this.vrStatsEnabled = false;
    } else {
      if (!this.vrPanel) {
        this.initVRStats();
      }
      this.el.object3D.visible = true;
      this.vrStatsEnabled = true;
    }
  },
  update(oldData) {
    if (oldData !== this.data) {
      if (this.data) {
        this.statsEl.classList.remove(HIDDEN_CLASS);
        this.fpsEl.classList.add(HIDDEN_CLASS);
      } else {
        this.statsEl.classList.add(HIDDEN_CLASS);
        this.fpsEl.classList.remove(HIDDEN_CLASS);
      }
    }
  },
  tick(time) {
    const stats = this.stats;
    if (!this.statsEl) return;
    if (this.showFPSCounter !== window.APP.store.state.preferences.showFPSCounter) {
      this.showFPSCounter = window.APP.store.state.preferences.showFPSCounter;
      this.fpsEl.style.display = this.showFPSCounter ? "block" : "none";
    }
    if (!this.showFPSCounter) {
      return;
    }
    if (this.data || this.vrStatsEnabled) {
      // Update rStats
      stats("rAF").tick();
      stats("FPS").frame();
      stats("physics").set(this.el.sceneEl.systems["hubs-systems"].physicsSystem.stepDuration);

      const batchManagerSystem = this.el.sceneEl.systems["hubs-systems"].batchManagerSystem;
      if (batchManagerSystem.batchingEnabled) {
        const batchManager = batchManagerSystem.batchManager;
        stats("batchdraws").set(batchManager.batches.length);
        stats("batchinstances").set(batchManager.instanceCount);
        stats("batchatlassize").set(batchManager.atlas.arrayDepth);
      }

      stats().update();
    } else if (!this.inVR) {
      // Update the fps counter
      const now = performance.now();
      this.frameCount++;

      // Update the fps counter text once a second
      if (now >= this.lastFpsUpdate + 1000) {
        const fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
        if (fps !== this.lastFps) {
          this.fpsEl.innerHTML = Math.round(fps) + " FPS";
          this.lastFps = fps;
        }
        this.lastFpsUpdate = now;
        this.frameCount = 0;
      }
    }
    if (this.vrStatsEnabled && time - this.lastUpdate > 100) {
      this.vrPanel.setAttribute(
        "text",
        "value",
        [
          `f ${stats("fps")
            .value()
            .toFixed(0)}`,
          `r ${stats("raf")
            .value()
            .toFixed(0)}`,
          `p ${stats("physics")
            .value()
            .toFixed(0)}`,
          `c ${this.el.sceneEl.renderer.info.render.calls}`,
          `t ${(this.el.sceneEl.renderer.info.render.triangles / 1000).toFixed(0)}k`
        ].join("\n")
      );
      this.lastUpdate = time;
    }
  },
  onEnterVr() {
    this.inVR = true;
    // Hide all stats elements when entering VR on mobile
    if (this.el.sceneEl.isMobile) {
      this.statsEl.classList.add(HIDDEN_CLASS);
      this.fpsEl.classList.add(HIDDEN_CLASS);
    }
  },
  onExitVr() {
    this.inVR = false;
    // Revert to previous state whe exiting VR on mobile
    if (this.el.sceneEl.isMobile) {
      if (this.data) {
        this.statsEl.classList.remove(HIDDEN_CLASS);
      } else {
        this.fpsEl.classList.remove(HIDDEN_CLASS);
      }
    }
  },
  onExpand() {
    this.el.setAttribute(this.name, true);
  },
  onCollapse() {
    this.el.setAttribute(this.name, false);
  },
  remove() {
    this.el.sceneEl.removeEventListener("enter-vr", this.hide);
    this.el.sceneEl.removeEventListener("exit-vr", this.show);

    if (this.statsEl) {
      this.statsEl.parentNode.removeChild(this.statsEl);
      this.fpsEl.parentNode.removeChild(this.fpsEl);
    }
  }
});
