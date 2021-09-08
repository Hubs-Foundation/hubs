import { SourceType } from "../components/audio-params";
import { updateAudioSettings } from "../update-audio-settings";

export class AudioSettingsSystem {
  constructor(sceneEl) {
    sceneEl.addEventListener("reset_scene", this.onSceneReset);

    // HACK We are scared that users are going to set this preference and then
    // forget about it and have a bad time, so we always remove the preference
    // whenever the user refreshes the page.
    // TODO: This is pretty weird and surprising. If the preference is exposed
    // in the preference screen, then we would not be so scared about this.
    // Also, if we feel so concerned about people using it, we should consider
    // ways to make it safer or remove it.
    window.APP.store.update({
      preferences: { audioOutputMode: undefined }
    });

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
