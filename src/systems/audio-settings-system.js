import { SourceType } from "../components/audio-params";
import { updateAudioSettings } from "../update-audio-settings";

export class AudioSettingsSystem {
  constructor(sceneEl) {
    sceneEl.addEventListener("reset_scene", this.onSceneReset);

    if (window.APP.store.state.preferences.audioNormalization !== 0.0) {
      //hack to always reset to 0.0 (disabled)
      window.APP.store.update({
        preferences: { audioNormalization: 0.0 }
      });
    }
  }

  onSceneReset = () => {
    APP.sceneAudioDefaults.delete(SourceType.AVATAR_AUDIO_SOURCE);
    APP.sceneAudioDefaults.delete(SourceType.MEDIA_VIDEO);
    for (const [el, audio] of APP.audios.entries()) {
      updateAudioSettings(el, audio);
    }
  };
}
