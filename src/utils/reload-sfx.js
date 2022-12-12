{
  let soundEnum = 0;
  const SOUND_HOVER_OR_GRAB = soundEnum++;
  const SOUND_THAW = soundEnum++;
  const SOUND_PEN_STOP_DRAW = soundEnum++;
  const SOUND_PEN_UNDO_DRAW = soundEnum++;
  const SOUND_PEN_CHANGE_COLOR = soundEnum++;
  const SOUND_TOGGLE_MIC = soundEnum++;
  const SOUND_TELEPORT_START = soundEnum++;
  const SOUND_TELEPORT_END = soundEnum++;
  const SOUND_WAYPOINT_START = soundEnum++;
  const SOUND_WAYPOINT_END = soundEnum++;
  const SOUND_SNAP_ROTATE = soundEnum++;
  const SOUND_SPAWN_PEN = soundEnum++;
  const SOUND_PEN_START_DRAW = soundEnum++;
  const SOUND_CAMERA_TOOL_TOOK_SNAPSHOT = soundEnum++;
  const SOUND_ENTER_SCENE = soundEnum++;
  const SOUND_QUACK = soundEnum++;
  const SOUND_SPECIAL_QUACK = soundEnum++;
  const SOUND_CHAT_MESSAGE = soundEnum++;
  const SOUND_FREEZE = soundEnum++;
  const SOUND_PIN = soundEnum++;
  const SOUND_MEDIA_LOADING = soundEnum++;
  const SOUND_MEDIA_LOADED = soundEnum++;
  const SOUND_CAMERA_TOOL_COUNTDOWN = soundEnum++;
  const SOUND_PREFERENCE_MENU_HOVER = soundEnum++;
  const SOUND_SPAWN_EMOJI = soundEnum++;
  const SOUND_SPEAKER_TONE = soundEnum++;

  const soundStringToNum = new Map([
    ["SOUND_HOVER_OR_GRAB", SOUND_HOVER_OR_GRAB],
    ["SOUND_THAW", SOUND_THAW],
    ["SOUND_PEN_STOP_DRAW", SOUND_PEN_STOP_DRAW],
    ["SOUND_PEN_UNDO_DRAW", SOUND_PEN_UNDO_DRAW],
    ["SOUND_PEN_CHANGE_COLOR", SOUND_PEN_CHANGE_COLOR],
    ["SOUND_TOGGLE_MIC", SOUND_TOGGLE_MIC],
    ["SOUND_TELEPORT_START", SOUND_TELEPORT_START],
    ["SOUND_TELEPORT_END", SOUND_TELEPORT_END],
    ["SOUND_WAYPOINT_START", SOUND_WAYPOINT_START],
    ["SOUND_WAYPOINT_END", SOUND_WAYPOINT_END],
    ["SOUND_SNAP_ROTATE", SOUND_SNAP_ROTATE],
    ["SOUND_SPAWN_PEN", SOUND_SPAWN_PEN],
    ["SOUND_PEN_START_DRAW", SOUND_PEN_START_DRAW],
    ["SOUND_CAMERA_TOOL_TOOK_SNAPSHOT", SOUND_CAMERA_TOOL_TOOK_SNAPSHOT],
    ["SOUND_ENTER_SCENE", SOUND_ENTER_SCENE],
    ["SOUND_QUACK", SOUND_QUACK],
    ["SOUND_SPECIAL_QUACK", SOUND_SPECIAL_QUACK],
    ["SOUND_CHAT_MESSAGE", SOUND_CHAT_MESSAGE],
    ["SOUND_FREEZE", SOUND_FREEZE],
    ["SOUND_PIN", SOUND_PIN],
    ["SOUND_MEDIA_LOADING", SOUND_MEDIA_LOADING],
    ["SOUND_MEDIA_LOADED", SOUND_MEDIA_LOADED],
    ["SOUND_CAMERA_TOOL_COUNTDOWN", SOUND_CAMERA_TOOL_COUNTDOWN],
    ["SOUND_PREFERENCE_MENU_HOVER", SOUND_PREFERENCE_MENU_HOVER],
    ["SOUND_SPAWN_EMOJI", SOUND_SPAWN_EMOJI],
    ["SOUND_SPEAKER_TONE", SOUND_SPEAKER_TONE]
  ]);

  const prefix = `✖ Skipping line from sound config file:`;
  function skipInfo(line, reason) {
    return [prefix, line, `Reason: ${reason}`].join("\n");
  }

  // Safari doesn't support the promise form of decodeAudioData, so we polyfill it.
  function decodeAudioData(audioContext, arrayBuffer) {
    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    });
  }

  function proxiedUrlFor(url) {
    return `https://hubs-proxy.com/${url}?${Date.now()}`;
  }

  function githubUrlFor(soundName) {
    return `https://raw.githubusercontent.com/johnshaughnessy/sfx/main/${soundName}`;
  }

  function urlFor(filename) {
    return proxiedUrlFor(githubUrlFor(filename));
  }

  async function downloadConfig() {
    const response = await fetch(urlFor("sounds.config"));
    const text = await response.text();
    return text;
  }

  async function parseConfig(text) {
    console.log(`🔊 Parsing sound config file:\n${text}`);

    return text
      .split("\n")
      .map(line => {
        if (line.trim().length === 0) {
          return null;
        }

        const parts = line.split("=").map(word => word.trim());

        if (parts.length !== 2 || parts[0].length === 0) {
          console.warn(skipInfo(line, 'Invalid format. Line should be "SOUND_NAME = filename "'));
          return null;
        }
        if (parts[1].length === 0) {
          console.warn(skipInfo(line, `URL not specified for sound ${parts[0]}.`));
          return null;
        }

        if (!soundStringToNum.has(parts[0])) {
          console.error(skipInfo(line, `Sound name not recognized (${parts[0]})`));
          return null;
        }

        const name = parts[0];
        const filename = parts[1];
        const id = soundStringToNum.get(parts[0]);
        const url = urlFor(`assets/${parts[1]}`);
        return [id, url, name, filename];
      })
      .filter(n => n);
  }

  async function loadSFX(config) {
    console.log(`📥 Downloading sounds...`, { config });

    const sfx = AFRAME.scenes[0].systems["hubs-systems"].soundEffectsSystem;
    const loading = new Map();
    const load = url => {
      let audioBufferPromise = loading.get(url);
      if (!audioBufferPromise) {
        audioBufferPromise = fetch(url)
          .then(r => {
            if (r.ok) {
              return r.arrayBuffer();
            } else {
              throw new Error(`Failed to load ${url}`);
            }
          })
          .then(arrayBuffer => {
            decodeAudioData(sfx.audioContext, arrayBuffer);
          });
        loading.set(url, audioBufferPromise);
      }
      return audioBufferPromise;
    };
    sfx.sounds = new Map();
    config.map(([sound, url, name, filename]) => {
      load(url)
        .then(audioBuffer => {
          sfx.sounds.set(sound, audioBuffer);
          console.log(`🔃 ${name} set to ${filename}`);
        })
        .catch(e => {
          console.error(`❌ Failed to set ${name} to ${filename}`);
          console.error(e);
        });
    });
  }

  //   const example = `SOUND_PEN_STOP_DRAW = tick.mp3
  // SOUND_THAW = not_a_real_sound.mp3
  // THIS_IS_A_MALFORMED_LINE woohoo! bla bla bla
  // SOME_MADE_UP_SOUND = tick.mp3
  // SOUND_PEN_START_DRAW = PenDraw1.mp3
  // `;

  async function reloadSFX() {
    const text = await downloadConfig();
    const config = await parseConfig(text);
    loadSFX(config);
  }

  reloadSFX();
}
