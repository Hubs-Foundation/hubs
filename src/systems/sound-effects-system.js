/* global fetch THREE AFRAME */
import TICK from "../assets/sfx/tick.mp3";
import TELEPORT_ARC from "../assets/sfx/teleportArc.mp3";
import QUICK_TURN from "../assets/sfx/quickTurn.mp3";
import TAP_MELLOW from "../assets/sfx/tap_mellow.mp3";
import PEN_SPAWN from "../assets/sfx/PenSpawn.mp3";
import PEN_DRAW from "../assets/sfx/PenDraw1.mp3";
import CAMERA_SNAPSHOT from "../assets/sfx/PicSnapHey.mp3";
import WELCOME from "../assets/sfx/welcome.mp3";
import QUACK from "../assets/sfx/quack.mp3";
import SPECIAL_QUACK from "../assets/sfx/specialquack.mp3";
import POP from "../assets/sfx/pop.mp3";

function getBuffer(url, context) {
  return fetch(url)
    .then(r => r.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer));
}

function playSound(buffer, context) {
  // The nodes are very inexpensive to create, according to
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

function playSoundLooped(buffer, context) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(context.destination);
    source.start();
}

function copy(current, prev) {
  prev.held = current.held;
  prev.hovered = current.hovered;
}

function isUI(el) {
  return (
    el && el.components.tags && (el.components.tags.data.singleActionButton || el.components.tags.data.holdableButton)
  );
}

export class SoundEffectsSystem {
  constructor() {
    this.teleporters = {
      leftHand: null,
      rightHand: null,
      rightRemote: null
    };
    this.prevInteractionState = {
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
    this.teleporterState = {
      leftHand: {
        teleporting: false,
        teleportArcSource: null
      },
      rightHand: {
        teleporting: false,
        teleportArcSource: null
      },
      rightRemote: {
        teleporting: false,
        teleportArcSource: null
      }
    };
    this.ctx = THREE.AudioContext.getContext();
    this.pendingEffects = [];
    this.soundFor = new Map();
    this.sounds = {};
    getBuffer(TICK, this.ctx).then(buffer => {
      this.sounds.tick = buffer;
      this.soundFor.set("pen_stop_draw", buffer);
      this.soundFor.set("pen_undo_draw", buffer);
      this.soundFor.set("pen_stop_draw", buffer);
      this.soundFor.set("pen_change_radius", buffer);
      this.soundFor.set("pen_change_color", buffer);
    });
    getBuffer(TELEPORT_ARC, this.ctx).then(buffer => {
      this.sounds.teleportArc = buffer;
    });
    getBuffer(QUICK_TURN, this.ctx).then(buffer => {
      this.sounds.teleportEnd = buffer;
    });
    getBuffer(TAP_MELLOW, this.ctx).then(buffer => {
      this.sounds.snapRotate = buffer;
      this.soundFor.set("snap_rotate_left", buffer);
      this.soundFor.set("snap_rotate_right", buffer);
    });
    getBuffer(PEN_SPAWN, this.ctx).then(buffer => {
      this.sounds.spawnPen = buffer;
      this.soundFor.set("spawn_pen", buffer);
    });
    getBuffer(PEN_DRAW, this.ctx).then(buffer => {
      this.sounds.penStartDraw = buffer;
      this.soundFor.set("pen_start_draw", buffer);
    });
    getBuffer(CAMERA_SNAPSHOT, this.ctx).then(buffer => {
      this.sounds.cameraSnapshot = buffer;
      this.soundFor.set("camera_tool_took_snapshot", buffer);
    });
    getBuffer(WELCOME, this.ctx).then(buffer => {
      this.sounds.enterScene = buffer;
      this.soundFor.set("enter_scene", buffer);
    });
    getBuffer(QUACK, this.ctx).then(buffer => {
      this.sounds.quack = buffer;
      this.soundFor.set("quack", buffer);
    });
    getBuffer(SPECIAL_QUACK, this.ctx).then(buffer => {
      this.sounds.specialQuack = buffer;
      this.soundFor.set("special_quack", buffer);
    });
    getBuffer(POP, this.ctx).then(buffer => {
      this.sounds.chatMessage = buffer;
      this.soundFor.set("chat_message", buffer);
    });
  }

  shouldTick() {
    this.soundsAreReady =
      this.soundsAreReady ||
      (this.sounds.tick &&
        this.sounds.teleportArc &&
        this.sounds.teleportEnd &&
        this.sounds.snapRotate &&
        this.sounds.spawnPen &&
        this.sounds.penStartDraw &&
        this.sounds.cameraSnapshot &&
        this.sounds.enterScene &&
        this.sounds.quack &&
        this.sounds.specialQuack &&
        this.sounds.chatMessage);
    return this.soundsAreReady;
  }

  tickTeleportSounds(teleporter, state) {
    if (teleporter.isTeleporting && !state.teleporting) {
      state.teleportArcSource = playSoundLooped(this.sounds.teleportArc, this.ctx);
    } else if (!teleporter.isTeleporting && state.teleporting) {
      state.teleportArcSource.stop();
      state.teleportArcSource = null;
      playSound(this.sounds.teleportEnd, this.ctx);
    }
    state.teleporting = teleporter.isTeleporting;
  }

  tick() {
    if (!this.shouldTick()) return;

    const { leftHand, rightHand, rightRemote } = AFRAME.scenes[0].systems.interaction.state;
    if (
      leftHand.held !== this.prevInteractionState.leftHand.held ||
      (isUI(leftHand.hovered) && leftHand.hovered !== this.prevInteractionState.leftHand.hovered) ||
      rightHand.held !== this.prevInteractionState.rightHand.held ||
      (isUI(rightHand.hovered) && rightHand.hovered !== this.prevInteractionState.rightHand.hovered) ||
      rightRemote.held !== this.prevInteractionState.rightRemote.held ||
      (isUI(rightRemote.hovered) && rightRemote.hovered !== this.prevInteractionState.rightRemote.hovered)
    ) {
      playSound(this.sounds.tick, this.ctx);
    }
    copy(leftHand, this.prevInteractionState.leftHand);
    copy(rightHand, this.prevInteractionState.rightHand);
    copy(rightRemote, this.prevInteractionState.rightRemote);

    this.teleporters.leftHand =
      this.teleporters.leftHand || document.querySelector("#player-left-controller").components.teleporter;
    this.teleporters.rightHand =
      this.teleporters.rightHand || document.querySelector("#player-right-controller").components.teleporter;
    this.teleporters.rightRemote =
      this.teleporters.rightRemote || document.querySelector("#gaze-teleport").components.teleporter;
    this.tickTeleportSounds(this.teleporters.leftHand, this.teleporterState.leftHand);
    this.tickTeleportSounds(this.teleporters.rightHand, this.teleporterState.rightHand);
    this.tickTeleportSounds(this.teleporters.rightRemote, this.teleporterState.rightRemote);

    for (let i = 0; i < this.pendingEffects.length; i++) {
      playSound(this.soundFor.get(this.pendingEffects[i]), this.ctx);
    }
    this.pendingEffects.length = 0;
  }
}
