import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import { EnvironmentSettings, GameMenu, Interacted, Slice9, TextTag } from "../bit-components";
import { Text as TroikaText } from "troika-three-text";
import { updateSlice9Geometry } from "../update-slice9-geometry";
import { Color, Vector3 } from "three";
import { EnvironmentSettingsParams, inflateEnvironmentSettings } from "../inflators/environment-settings";
import { loadTexture } from "../utils/load-texture";
import { proxiedUrlFor } from "../utils/media-url-utils";
import { EnvironmentSystem } from "../systems/environment-system";

const textSize = new Vector3();
const getTextSize = (function () {
  const size = new THREE.Vector3();
  return function (text: TroikaText, outSize: Vector3) {
    text.geometry.boundingBox!.getSize(size);
    outSize.set(size.x * text.scale.x, size.y * text.scale.y, size.z * text.scale.z);
  };
})();

function testWhite(x: string) {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
}

function wordWrap(str: string, maxWidth: number) {
  const newLineStr = "\n";
  let res = "";
  let found = false;
  while (str.length > maxWidth) {
    found = false;
    for (let i = maxWidth - 1; i >= 0; i--) {
      if (testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join("");
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join("");
      str = str.slice(maxWidth);
    }
  }

  return res + str;
}

enum CommandType {
  Connect = "connect",
  Disconnect = "disconnect",
  Text = "text",
  Options = "options",
  End = "end",
  Skybox = "skybox"
}

export type Options = {
  A: string;
  B: string;
  C: string;
  D: string;
};
export type OptionsResponse = {
  prompt: string;
  description: string;
  player: string;
  options: Options;
};

const text = (msg?: string) => {
  console.log(msg);
  if (menu) {
    msg && updateText(APP.world, menu, msg);
  }
};

const options = (options: OptionsResponse) => {
  console.log(options);
  if (menu) {
    updateStartVisibility(APP.world, menu, false);
    updateText(APP.world, menu, options.prompt, () => {
      updateEndVisibility(APP.world, menu, true);
      updateOptions(APP.world, menu, options.options);
    });
  }
};

const end = (options: OptionsResponse) => {
  console.log(options);
  if (menu) {
    fadeOut();
    updateEndVisibility(APP.world, menu, false);
    updateOptionsVisibility(APP.world, menu, false);
    updateText(APP.world, menu, options.prompt, () => {
      updateStartVisibility(APP.world, menu, true);
    });
  }
};

const updateExp = (envSettingsEid: EntityID, envSettings: EnvironmentSettingsParams, exp: number) => {
  inflateEnvironmentSettings(APP.world, envSettingsEid, { toneMappingExposure: exp });
  environmentSystem.updateEnvironmentSettings(envSettings);
};

let expHandler: NodeJS.Timer | null;
const skybox = async (skybox: string) => {
  const skyboxProxied = proxiedUrlFor(skybox);
  console.log(skyboxProxied);
  const envSettingsEid = anyEntityWith(APP.world, EnvironmentSettings)!;
  const { texture } = await loadTexture(skyboxProxied, 1, "image/jpeg");
  const envMap = texture.clone();
  envMap.flipY = true;

  fadeOut(() => {
    inflateEnvironmentSettings(APP.world, envSettingsEid, {
      backgroundTexture: texture,
      envMapTexture: envMap
    });
    environmentSystem.updateEnvironmentSettings((EnvironmentSettings as any).map.get(envSettingsEid));
    fadeIn();
  });
};

const fadeIn = (callback?: Function) => {
  const envSettingsEid = anyEntityWith(APP.world, EnvironmentSettings)!;
  const envSettings = (EnvironmentSettings as any).map.get(envSettingsEid);
  let exp = envSettings.toneMappingExposure;
  if (expHandler) {
    clearInterval(expHandler);
  }
  expHandler = setInterval(() => {
    if (exp < 1) {
      exp += 0.01;
      updateExp(envSettingsEid, envSettings, exp);
    } else {
      updateExp(envSettingsEid, envSettings, 1);
      clearInterval(expHandler!);
      callback && callback();
    }
  }, 10);
};

const fadeOut = (callback?: Function) => {
  const envSettingsEid = anyEntityWith(APP.world, EnvironmentSettings)!;
  const envSettings = (EnvironmentSettings as any).map.get(envSettingsEid);
  let exp = envSettings.toneMappingExposure;
  if (expHandler) {
    clearInterval(expHandler);
  }
  expHandler = setInterval(() => {
    if (exp > 0) {
      exp -= 0.01;
      updateExp(envSettingsEid, envSettings, exp);
    } else {
      updateExp(envSettingsEid, envSettings, 0);
      clearInterval(expHandler!);
      callback && callback();
    }
  }, 10);
};

const connect = () => {
  menu = anyEntityWith(APP.world, GameMenu)!;
  setupButtons(APP.world, menu);

  const menuObj = APP.world.eid2obj.get(menu)!;
  menuObj.position.set(0, 1.4, 0);
  const obj = APP.world.eid2obj.get(menu)!;
  obj.visible = true;
  updateStartVisibility(APP.world, menu, true);
  updateEndVisibility(APP.world, menu, false);
  updateOptionsVisibility(APP.world, menu, false);
  updateText(APP.world, menu, "");

  fadeOut();
};

const disconnect = () => {
  menu = anyEntityWith(APP.world, GameMenu)!;
  setupButtons(APP.world, menu);

  const obj = APP.world.eid2obj.get(menu)!;
  obj.visible = false;

  fadeOut();
};

const game = (data: any[]) => {
  const command = data.shift();

  if (!Object.values(CommandType).includes(command as CommandType)) return;

  switch (command) {
    case CommandType.Connect:
      connect();
      break;
    case CommandType.Disconnect:
      disconnect();
      break;
    case CommandType.Text:
      text(data.shift());
      break;
    case CommandType.Options:
      options(data.shift() as OptionsResponse);
      break;
    case CommandType.End:
      end(data.shift());
      break;
    case CommandType.Skybox:
      skybox(data.shift());
      break;
  }
};

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function updateButtonVisibility(world: HubsWorld, buttonRef: EntityID, visible: boolean) {
  const buttonObj = world.eid2obj.get(buttonRef)!;
  buttonObj.visible = visible;
}

function updateOptionsVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.AButtonRef[menu], GameMenu.BButtonRef[menu], GameMenu.CButtonRef[menu], GameMenu.DButtonRef[menu]].forEach(
    buttonRef => {
      updateButtonVisibility(world, buttonRef, visible);
    }
  );
}

function updateStartVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.StartButtonRef[menu]].forEach(buttonRef => {
    const buttonObj = world.eid2obj.get(buttonRef)!;
    buttonObj.visible = visible;
  });
}

function updateEndVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.EndButtonRef[menu]].forEach(buttonRef => {
    const buttonObj = world.eid2obj.get(buttonRef)!;
    buttonObj.visible = visible;
  });
}

const TYPEWRITER_SPEED = 100;
let textHandler: NodeJS.Timeout | null;
function updateText(world: HubsWorld, menu: EntityID, msg?: string, callback?: Function) {
  if (!msg) return;

  const textRef = GameMenu.TextRef[menu];
  const text = findChildWithComponent(world, TextTag, textRef)!;
  const textObj = world.eid2obj.get(text)! as TroikaText;

  if (textHandler) {
    clearTimeout(textHandler);
  }

  let i = 1;
  const typewriter = () => {
    if (i <= msg.length) {
      textObj.text = wordWrap(msg.slice(0, i), 50);
      i++;
      textHandler = setTimeout(typewriter, TYPEWRITER_SPEED);
    } else {
      callback && callback();
      textHandler = null;
    }
  };
  textHandler = setTimeout(typewriter, TYPEWRITER_SPEED);
}

function clearText(world: HubsWorld) {
  if (textHandler) {
    clearTimeout(textHandler);
  }

  const textRef = GameMenu.TextRef[menu];
  const text = findChildWithComponent(world, TextTag, textRef)!;
  const textObj = world.eid2obj.get(text)! as TroikaText;
  textObj.text = "";
}

function updateButton(world: HubsWorld, buttonRef: EntityID, msg: string) {
  if (msg) {
    let text = findChildWithComponent(world, TextTag, buttonRef)!;
    let textObj = world.eid2obj.get(text)! as TroikaText;
    textObj.text = msg;
    updateButtonVisibility(world, buttonRef, true);
  } else {
    updateButtonVisibility(world, buttonRef, false);
  }
}

function updateOptions(world: HubsWorld, menu: EntityID, options: Options) {
  updateButton(world, GameMenu.AButtonRef[menu], options.A);
  updateButton(world, GameMenu.BButtonRef[menu], options.B);
  updateButton(world, GameMenu.CButtonRef[menu], options.C);
  updateButton(world, GameMenu.DButtonRef[menu], options.D);
}

function setupButton(world: HubsWorld, ref: EntityID) {
  let text = findChildWithComponent(world, TextTag, ref)!;
  let textObj = world.eid2obj.get(text)! as TroikaText;
  textObj.addEventListener("text-updated", () => {
    getTextSize(textObj, textSize);
    Slice9.size[ref].set([textSize.x + 0.25, Slice9.size[ref][1]]);
    updateSlice9Geometry(world, ref);
  });
}

function setupButtons(world: HubsWorld, menu: EntityID) {
  setupButton(world, GameMenu.AButtonRef[menu]);
  setupButton(world, GameMenu.BButtonRef[menu]);
  setupButton(world, GameMenu.CButtonRef[menu]);
  setupButton(world, GameMenu.DButtonRef[menu]);
}

function handleClicks(world: HubsWorld, menu: EntityID) {
  clearText(world);
  if (clicked(world, GameMenu.StartButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["start", "es"]
    });
    updateStartVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.EndButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["end"]
    });
    updateEndVisibility(world, menu, false);
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.AButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "A"]
    });
    updateEndVisibility(world, menu, false);
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.BButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "B"]
    });
    updateEndVisibility(world, menu, false);
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.CButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "C"]
    });
    clearText(world);
    updateEndVisibility(world, menu, false);
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.DButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "D"]
    });
    updateEndVisibility(world, menu, false);
    updateOptionsVisibility(world, menu, false);
    clearText(world);
  }
}

let initialized = false;
let menu: EntityID;
let environmentSystem: EnvironmentSystem;
export function gameBotSystem(world: HubsWorld) {
  if (!initialized && APP.messageDispatch) {
    environmentSystem = APP.scene?.systems["hubs-systems"].environmentSystem;
    APP.scene?.addEventListener("environment-scene-loaded", event => {
      const scene = (event as any).detail;
      if (!hasComponent(world, EnvironmentSettings, scene)) {
        inflateEnvironmentSettings(world, scene, {
          backgroundColor: new Color("#222222"),
          toneMappingExposure: 1,
          enableHDRPipeline: true
        });
        environmentSystem.updateEnvironmentSettings((EnvironmentSettings as any).map.get(scene));
      }
    });
    APP.messageDispatch!.addEventListener("message", (event: CustomEvent) => {
      const { body, type, sessionId } = event.detail;
      if (sessionId !== NAF.clientId && type === "command" && body.command === "game") {
        game(body.args);
      }
    });
    initialized = true;
  } else {
    handleClicks(world, menu);
  }
}
