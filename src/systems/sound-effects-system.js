/* global fetch */
import TICK from "../assets/sfx/tick.mp3";

function getBuffer(url, context) {
  return new Promise(resolve => {
    fetch(url).then(response => {
      response.arrayBuffer().then(arrayBuffer => {
        context.decodeAudioData(arrayBuffer).then(resolve);
      });
    });
  });
}

function playSound(buffer, context) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

function copy(current, previous) {
  previous.held = current.held;
  previous.hovered = current.hovered;
}

export class SoundEffectsSystem {
  constructor() {
    this.previousState = {
      leftHand: {
        hovered: null,
        held: null
      },
      rightHand: {
        hovered: null,
        held: null
      },
      rightRemote: {
        hovered: null,
        held: null
      }
    };
    this.ctx = THREE.AudioContext.getContext();
    this.sounds = {};
    getBuffer(TICK, this.ctx).then(buffer => {
      this.sounds.tick = buffer;
    });
  }

  soundsReady() {
    return this.sounds.tick;
  }

  playSounds(current, previous) {
    if (current.held && current.held !== previous.held) {
      playSound(this.sounds.tick, this.ctx);
    }

    if (current.hovered && current.hovered !== previous.hovered) {
      playSound(this.sounds.tick, this.ctx);
    }
  }

  tick() {
    if (!this.soundsReady()) return;

    const { leftHand, rightHand, rightRemote } = AFRAME.scenes[0].systems.interaction.state;
    this.playSounds(leftHand, this.previousState.leftHand);
    this.playSounds(rightHand, this.previousState.rightHand);
    this.playSounds(rightRemote, this.previousState.rightRemote);

    copy(leftHand, this.previousState.leftHand);
    copy(rightHand, this.previousState.rightHand);
    copy(rightRemote, this.previousState.rightRemote);
  }
}
