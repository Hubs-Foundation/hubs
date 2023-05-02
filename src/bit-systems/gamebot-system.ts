import { hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import { EnvironmentSettings, GameMenu, Interacted, Slice9, TextTag } from "../bit-components";
import { Text as TroikaText } from "troika-three-text";
import { updateSlice9Geometry } from "../update-slice9-geometry";
import { Vector3 } from "three";
import { inflateEnvironmentSettings } from "../inflators/environment-settings";
import { loadTexture } from "../utils/load-texture";

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
    updateEndVisibility(APP.world, menu, true);
    updateText(APP.world, menu, options.prompt);
    setTimeout(() => {
      updateOptions(APP.world, menu, options.options);
    }, TYPEWRITER_SPEED * options.prompt.length);
  }
};

const end = (msg?: string) => {
  console.log(msg);
  if (menu) {
    updateEndVisibility(APP.world, menu, false);
    updateOptionsVisibility(APP.world, menu, false);
    if (msg) {
      updateText(APP.world, menu, msg);
      setTimeout(() => {
        updateStartVisibility(APP.world, menu, true);
      }, TYPEWRITER_SPEED * msg.length);
    }
  }
};

let expHandler: NodeJS.Timer | null;
const skybox = async (skybox: string) => {
  console.log(skybox);
  const envSettingsEid = anyEntityWith(APP.world, EnvironmentSettings);
  if (envSettingsEid) {
    const environmentSystem = APP.scene?.systems["hubs-systems"].environmentSystem;
    const { texture } = await loadTexture(skybox, 1, "image/jpeg");
    const envMap = texture.clone();
    envMap.flipY = true;
    if (expHandler) {
      clearInterval(expHandler);
    }
    const envSettings = (EnvironmentSettings as any).map.get(envSettingsEid);
    const updateExp = (exp: number) => {
      inflateEnvironmentSettings(APP.world, envSettingsEid, { toneMappingExposure: exp });
      environmentSystem.updateEnvironmentSettings(envSettings);
    };
    let exp = envSettings.toneMappingExposure;
    expHandler = setInterval(() => {
      if (exp > 0) {
        exp -= 0.01;
        updateExp(exp);
      } else {
        clearInterval(expHandler!);
        inflateEnvironmentSettings(APP.world, envSettingsEid, {
          backgroundTexture: texture,
          envMapTexture: envMap
        });
        environmentSystem.updateEnvironmentSettings((EnvironmentSettings as any).map.get(envSettingsEid));
        expHandler = setInterval(() => {
          if (exp < 1) {
            exp += 0.01;
            updateExp(exp);
          } else {
            clearInterval(expHandler!);
          }
        }, 10);
      }
    }, 10);
  }
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
};

const disconnect = () => {
  menu = anyEntityWith(APP.world, GameMenu)!;
  setupButtons(APP.world, menu);

  const obj = APP.world.eid2obj.get(menu)!;
  obj.visible = false;
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
let handler: NodeJS.Timeout | null;
function updateText(world: HubsWorld, menu: EntityID, msg: string) {
  const textRef = GameMenu.TextRef[menu];
  const text = findChildWithComponent(world, TextTag, textRef)!;
  const textObj = world.eid2obj.get(text)! as TroikaText;

  if (handler) {
    clearTimeout(handler);
  }

  let i = 1;
  const typewriter = () => {
    if (i <= msg.length) {
      textObj.text = wordWrap(msg.slice(0, i), 50);
      i++;
      handler = setTimeout(typewriter, TYPEWRITER_SPEED);
    } else {
      handler = null;
    }
  };
  handler = setTimeout(typewriter, TYPEWRITER_SPEED);
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
  } else if (clicked(world, GameMenu.AButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "A"]
    });
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.BButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "B"]
    });
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.CButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "C"]
    });
    updateOptionsVisibility(world, menu, false);
  } else if (clicked(world, GameMenu.DButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "D"]
    });
    updateOptionsVisibility(world, menu, false);
  }
}

let initialized = false;
let menu: EntityID;
export function gameBotSystem(world: HubsWorld) {
  if (!initialized && APP.messageDispatch) {
    APP.messageDispatch!.addEventListener("message", (event: CustomEvent) => {
      const { body, type, session } = event.detail;
      if (type === "command" && body.command === "game") {
        game(body.args);
      }
    });
    initialized = true;
  } else {
    handleClicks(world, menu);
  }
}
