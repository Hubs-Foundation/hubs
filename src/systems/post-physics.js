import { SpriteSystem } from "./sprites";
import { LobbyCameraSystem } from "./lobby-camera-system";

// wait for aframe physics system to be registered...
const i = window.setInterval(() => {
  if (AFRAME.scenes[0] && AFRAME.scenes[0].systems && AFRAME.scenes[0].systems.physics) {
    AFRAME.registerSystem("post-physics", {
      init() {
        this.spriteSystem = new SpriteSystem(this.el);
        this.lobbyCameraSystem = new LobbyCameraSystem();
      },
      tick(t, dt) {
        this.spriteSystem.tick(t, dt);
        this.lobbyCameraSystem.tick();
      }
    });
    window.clearInterval(i);
  }
}, 1000);
