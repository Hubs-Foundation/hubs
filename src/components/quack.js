import { SOUND_QUACK, SOUND_SPECIAL_QUACK } from "../systems/sound-effects-system";

const INTERACTORS = ["rightHand", "leftHand", "rightRemote", "leftRemote"];

AFRAME.registerComponent("quack", {
  schema: {
    quackPercentage: { default: 1 },
    specialQuackPercentage: { default: 0.01 }
  },

  init: function() {
    this.wasInteracting = false;
    NAF.utils.getNetworkedEntity(this.el).then(networkedEntity => {
      this.networkedEntity = networkedEntity;
    });
  },

  tick: function() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    const entity = this.networkedEntity || this.el;
    let isInteracting = false;
    for (let i = 0; i < INTERACTORS.length; i++) {
      if (interaction.state[INTERACTORS[i]].held === entity) {
        isInteracting = true;
        if (!this.wasInteracting) {
          this.quack();
        }
        break;
      }
    }

    this.wasInteracting = isInteracting;
  },

  quack: function() {
    const rand = Math.random();
    if (rand < this.data.specialQuackPercentage) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_SPECIAL_QUACK);
    } else if (rand < this.data.quackPercentage) {
      this.el.sceneEl.systems["hubs-systems"].soundEffectsSystem.playSoundOneShot(SOUND_QUACK);
    }
  }
});
