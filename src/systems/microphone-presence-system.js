const VOLUME_THRESHOLD = 0.00001;
const UPDATE_FREQUENCY = 1000;

export class MicrophonePresenceSystem {
  constructor(sceneEl) {
    this.remountUI = null;
    this.time = 0;
    this.sceneEl = sceneEl;
  }

  tick(dt) {
    this.time += dt;

    if (this.time > UPDATE_FREQUENCY) {
      this.time -= UPDATE_FREQUENCY;

      if (
        !window.APP ||
        !window.APP.componentRegistry ||
        !window.APP.hubChannel ||
        !window.APP.hubChannel.presence ||
        !this.remountUI
      ) {
        return null;
      }

      const microphonePresences = {};

      const playerInfos = window.APP.componentRegistry["player-info"];
      if (playerInfos) {
        for (let i = 0; i < playerInfos.length; i++) {
          const playerInfo = playerInfos[i];
          const playerSessionId = playerInfo.playerSessionId;
          let talking = false;
          if (playerInfo.isLocalPlayerInfo) {
            talking = this.sceneEl.systems["local-audio-analyser"].volume > VOLUME_THRESHOLD;
          }
          microphonePresences[playerSessionId] = { muted: playerInfo.data.muted, talking };
        }
      }

      const networkedAudioAnalysers = window.APP.componentRegistry["networked-audio-analyser"];
      if (networkedAudioAnalysers) {
        for (let i = 0; i < networkedAudioAnalysers.length; i++) {
          const networkedAudioAnalyser = networkedAudioAnalysers[i];
          if (
            microphonePresences.hasOwnProperty(networkedAudioAnalyser.playerSessionId) &&
            networkedAudioAnalyser.volume > VOLUME_THRESHOLD
          ) {
            microphonePresences[networkedAudioAnalyser.playerSessionId].talking = true;
          }
        }
      }

      if (this.remountUI) this.remountUI({ microphonePresences });
    }
  }
}
