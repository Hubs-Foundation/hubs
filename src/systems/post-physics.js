import { SpriteSystem } from "./sprites";

const i = window.setInterval(() => {
  if (AFRAME.scenes[0] && AFRAME.scenes[0].systems && AFRAME.scenes[0].systems.physics) {
    AFRAME.registerSystem("post-physics", {
      init() {
        this.spriteSystem = new SpriteSystem(this.el);
        this.hubsSystems = this.el.sceneEl.systems["hubs-systems"];
      },
      tick(t, dt) {
        this.spriteSystem.tick(t, dt);
        this.hubsSystems.batchManagerSystem.tick(t);
      }
    });
    window.clearInterval(i);
  }
}, 1000);
