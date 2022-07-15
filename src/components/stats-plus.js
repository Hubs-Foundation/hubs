import "./stats-plus.css";
import qsTruthy from "../utils/qs_truthy";

function ThreeStats(renderer) {
  let _rS = null;

  const _values = {
    "renderer.info.memory.geometries": {
      caption: "Geometries"
    },
    "renderer.info.memory.textures": {
      caption: "Textures"
    },
    "renderer.info.programs": {
      caption: "Programs"
    },
    "renderer.info.render.calls": {
      caption: "Calls"
    },
    "renderer.info.render.triangles": {
      caption: "Triangles",
      over: 100000
    },
    "renderer.info.render.points": {
      caption: "Points"
    }
  };

  const _groups = [
    {
      caption: "Three.js - Memory",
      values: ["renderer.info.memory.geometries", "renderer.info.programs", "renderer.info.memory.textures"]
    },
    {
      caption: "Three.js - Render",
      values: ["renderer.info.render.calls", "renderer.info.render.triangles", "renderer.info.render.points"]
    }
  ];

  const _fractions = [];

  function _update() {
    _rS("renderer.info.memory.geometries").set(renderer.info.memory.geometries);
    _rS("renderer.info.programs").set(renderer.info.programs.length);
    _rS("renderer.info.memory.textures").set(renderer.info.memory.textures);
    _rS("renderer.info.render.calls").set(renderer.info.render.calls);
    _rS("renderer.info.render.triangles").set(renderer.info.render.triangles);
    _rS("renderer.info.render.points").set(renderer.info.render.points);
  }

  function _start() {}

  function _end() {}

  function _attach(r) {
    _rS = r;
  }

  return {
    update: _update,
    start: _start,
    end: _end,
    attach: _attach,
    values: _values,
    groups: _groups,
    fractions: _fractions
  };
}

// Adapted from https://github.com/aframevr/aframe/blob/master/src/components/scene/stats.js
function createStats(scene) {
  const plugins = scene.isMobile ? [] : [new ThreeStats(scene.renderer)];
  return new window.rStats({
    css: [],
    values: {
      fps: { caption: "fps", below: 30 }
    },
    groups: [{ caption: "Framerate", values: ["fps", "raf", "physics"] }],
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
    this.vrPanel.setAttribute("text", { maxWidth: 0.5, value: "_", anchorY: "bottom" });
    this.vrPanel.addEventListener(
      "loaded",
      () =>
        this.vrPanel.object3D.traverse(x => {
          if (x.material) x.material.depthTest = false;
        }),
      { once: true }
    );
    this.el.append(this.vrPanel);
    const background = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.1, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x333333, depthTest: false })
    );
    background.position.set(-0.2, 0.055, 0);
    this.el.object3D.add(background);
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
