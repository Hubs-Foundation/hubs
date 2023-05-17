import { addComponent, addEntity, hasComponent, removeComponent, removeEntity } from "bitecs";
import { HubsWorld } from "../app";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import {
  CursorRaycastable,
  DisableButton,
  GameMenu,
  Interacted,
  ParticleEmitterTag,
  Slice9,
  TextTag
} from "../bit-components";
import { Text as TroikaText } from "troika-three-text";
import { updateSlice9Geometry } from "../update-slice9-geometry";
import {
  BackSide,
  Group,
  LinearEncoding,
  Mesh,
  Object3D,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  Vector3
} from "three";
import { loadTexture } from "../utils/load-texture";
import { proxiedUrlFor } from "../utils/media-url-utils";
import gameScene from "../assets/models/GameScene.glb";
import { swapActiveScene } from "./scene-loading";
import bgSkyboxSrc from "../assets/images/GameScene_bg.png";
import noiseSrc from "../assets/images/noise.png";
import { textureLoader } from "../utils/media-utils";
import { inflateParticleEmitter } from "../inflators/particle-emitter";
import { inflateMediaLoader } from "../inflators/media-loader";
import { addObject3DComponent } from "../utils/jsx-entity";
var anime = require("animejs").default;

const bgSkyboxTexture = textureLoader.load(bgSkyboxSrc);
bgSkyboxTexture.encoding = LinearEncoding;
bgSkyboxTexture.wrapS = RepeatWrapping;
bgSkyboxTexture.wrapT = RepeatWrapping;
const noiseTexture = textureLoader.load(noiseSrc);
noiseTexture.encoding = LinearEncoding;
noiseTexture.wrapS = RepeatWrapping;
noiseTexture.wrapT = RepeatWrapping;

const skybox_vert = `
varying vec2 vUv;
void main()
{
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;
  vUv.y = 1.0 - vUv.y;
}
`;

const skybox_frag = `
precision highp float;
varying vec2 vUv;

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform float iMix;
uniform float iTime;
 
#include <common>
const float kPi = 3.141592;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  // Four corner gradients
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  // Smooth interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec4 sRGBToLinear( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}

#define mask_tile 0.3

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = vec2(fragCoord);
  
  uv.x += sin(uv.y*50.0+iTime/2500.0)*(uv.y*(1.0 - uv.y))/200.0;

  // color textures
  vec4 clrA = sRGBToLinear(texture(iChannel0, uv));
  
  // color textures
  vec4 clrBG = sRGBToLinear(texture(iChannel1, uv));

  // set these to increase/decrease the edge width
  float edge_width_start = 0.15; // width at the start of the dissolve (alpha = 1)
  float edge_width_end = 0.05; // width at the end of the dissolve (alpha = 0)
  
  float edge_width = mix(edge_width_start, edge_width_end, smoothstep(0., 1., iMix)); // 
  
  // increase the alpha range by the edge width so we are not left with only glowy edges 
  float myAlpha = mix(0. - edge_width, 1., iMix); 
  
  // fade mask uv
  vec2 uv_mask = fragCoord.xy;
  
  // fade mask texture
  // use a linear texture that has values between 0-1
  float r = noise(fragCoord * 10.);
  vec4 alphaTex = vec4(r, r, r, r);
  // vec4 alphaTex = texture(iChannel2, uv_mask * mask_tile);

  // alpha mask (1-bit)
  float a = step(alphaTex.r, myAlpha);

  // edge mask which is a slightly progressed version of the alpha
  // this mask doesn't need to be 1 bit as it will just be added to the color
  float edge = smoothstep(alphaTex.r - edge_width, alphaTex.r, myAlpha);

  vec4 edgeColor = vec4(0., 0.1, 1.0, 1.0);
  edgeColor *= edge * 10.;
  
  // add edge color to the color
  clrA += edgeColor;

  fragColor = mix(clrA, clrBG, a);
}
 
void main() {
  mainImage(gl_FragColor, vUv);
	#include <encodings_fragment>
}
`;

const AUDIOS = {
  fantasy:
    "https://cf.harvestmedia.net/assets/samples/4f76c3819105b600966fd4d096dd5d23325d1348/2891b0c8edb761b184cc217eda25d8db",
  action: "https://cf.harvestmedia.net/assets/samples/4f76c3819105b600966fd4d096dd5d23325d1348/fadeffb4003629eb",
  terror:
    "https://cf.harvestmedia.net/assets/samples/4f76c3819105b600966fd4d096dd5d23325d1348/44f092c79972fa908372f9f4d6c31c6c"
};

const RAIN = {
  particleCount: 500,
  src: "https://uploads-prod.reticulum.io/files/fdc153ae-3fbb-48e5-b2dd-08fc29988f53.png",
  ageRandomness: 6,
  lifetime: 2,
  lifetimeRandomness: 0,
  sizeCurve: "exponentialOut",
  startSize: 0.10000000149011612,
  endSize: 0.10000000149011612,
  sizeRandomness: 0,
  colorCurve: "linear",
  startColor: "#ffffff",
  startOpacity: 1,
  middleColor: "#ffffff",
  middleOpacity: 1,
  endColor: "#ffffff",
  endOpacity: 0.5,
  velocityCurve: "linear",
  startVelocity: {
    x: 0,
    y: 0,
    z: 10
  },
  endVelocity: {
    x: 0,
    y: 0,
    z: 10
  },
  angularVelocity: 0
};

const SNOW = {
  particleCount: 200,
  src: "https://uploads-prod.reticulum.io/files/b32768fb-952d-458d-8a2b-ca7c5490eaf3.png",
  ageRandomness: 6,
  lifetime: 2,
  lifetimeRandomness: 2,
  sizeCurve: "exponentialOut",
  startSize: 0.10000000149011612,
  endSize: 0.10000000149011612,
  sizeRandomness: 0.10000000149011612,
  colorCurve: "linear",
  startColor: "#ffffff",
  startOpacity: 1,
  middleColor: "#ffffff",
  middleOpacity: 1,
  endColor: "#ffffff",
  endOpacity: 1,
  velocityCurve: "linear",
  startVelocity: {
    x: 0,
    y: 0,
    z: 3
  },
  endVelocity: {
    x: 0,
    y: 0,
    z: 2
  },
  angularVelocity: 3
};

const GAMES = ["es", "hp", "cj", "lotr", "sw"];

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

enum CommandE {
  Connect = "connect",
  Disconnect = "disconnect",
  Text = "text",
  Options = "options",
  Skybox = "skybox",
  Start = "start"
}

export type GameOptionsI = {
  A: string;
  B: string;
  C: string;
  D: string;
};

enum WeatherE {
  Clear = "Clear",
  Rain = "Rain",
  Wind = "Wind",
  Snow = "Snow"
}

enum TypeE {
  Fantasy = "fantasy",
  Action = "action",
  Terror = "terror"
}

export interface OptionsResponseI {
  prompt: string;
  description: string;
  options: GameOptionsI;
  player: string;
  state: "started" | "ended";
  weather: WeatherE;
  type: TypeE;
}

const text = (msg?: string) => {
  console.log(msg);
  if (menu) {
    updateText(APP.world, menu, msg);
    updateStartVisibility(APP.world, menu, false);
    updateTurnVisibility(APP.world, menu, false);
    updateEndVisibility(APP.world, menu, false);
    updateOptionsVisibility(APP.world, menu, false);
    animateObjectScale(character, 1.0);
  }
};

let lastOptions: OptionsResponseI | null = null;
const options = (options: OptionsResponseI) => {
  console.log(options);
  if (menu) {
    animateObjectScale(character, 1.0);
    updateStartVisibility(APP.world, menu, options.state === "ended");
    updateTurnVisibility(APP.world, menu, NAF.clientId === options.player ? true : false);
    updateEndVisibility(APP.world, menu, NAF.clientId === options.player ? true : false);
    updateText(APP.world, menu, options.prompt, () => {
      updateOptionsVisibility(APP.world, menu, true);
      updateOptionsEnabled(APP.world, menu, NAF.clientId === options.player);
      updateOptions(APP.world, menu, options.options);
      animateObjectScale(character, 0.0);
    });
    if (options.weather === WeatherE.Rain) {
      hasComponent(APP.world, ParticleEmitterTag, weatherEid) &&
        removeComponent(APP.world, ParticleEmitterTag, weatherEid);
      inflateParticleEmitter(APP.world, weatherEid, RAIN);
    } else if (options.weather === WeatherE.Snow) {
      hasComponent(APP.world, ParticleEmitterTag, weatherEid) &&
        removeComponent(APP.world, ParticleEmitterTag, weatherEid);
      inflateParticleEmitter(APP.world, weatherEid, SNOW);
    } else {
      hasComponent(APP.world, ParticleEmitterTag, weatherEid) &&
        removeComponent(APP.world, ParticleEmitterTag, weatherEid);
    }
    if (lastOptions?.type !== options.type) {
      removeEntity(APP.world, audioEid);
      audioEid = addEntity(APP.world);
      addObject3DComponent(APP.world, audioEid, new Group());
      inflateMediaLoader(APP.world, audioEid, {
        src: AUDIOS[options.type].toLowerCase(),
        resize: false,
        recenter: false,
        animateLoad: false,
        isObjectMenuTarget: false
      });
    }
    lastOptions = options;
  }
};

const updateSkybox = (texture: Texture) => {
  const shader = sky.material as ShaderMaterial;
  const current = shader.uniforms.iMix.value;
  let prevTexture: Texture;
  if (current === 0) {
    prevTexture = shader.uniforms.iChannel0.value;
    shader.uniforms.iChannel1.value = texture;
  } else {
    prevTexture = shader.uniforms.iChannel1.value;
    shader.uniforms.iChannel0.value = texture;
  }
  anime({
    duration: 2000,
    easing: "linear",
    targets: [shader.uniforms.iMix],
    value: Math.abs(1 - current),
    complete: () => {
      if (current === 0) {
        shader.uniforms.iChannel0.value = prevTexture;
      } else {
        shader.uniforms.iChannel1.value = prevTexture;
      }
    }
  });
};

const start = (msg?: string) => {
  if (menu) {
    hasComponent(APP.world, ParticleEmitterTag, weatherEid) &&
      removeComponent(APP.world, ParticleEmitterTag, weatherEid);
    removeEntity(APP.world, audioEid);

    updateTurnVisibility(APP.world, menu, false);
    updateStartVisibility(APP.world, menu, true);
    updateEndVisibility(APP.world, menu, false);
    updateOptionsVisibility(APP.world, menu, false);
    updateText(APP.world, menu, msg);
    updateSkybox(bgSkyboxTexture);

    character && animateObjectScale(character, 0.0);
  }
};

const skybox = async (skybox: string) => {
  const proxiedSrc = proxiedUrlFor(skybox);
  if (lastSkySrc !== proxiedSrc) {
    lastSkySrc = proxiedSrc;
    console.log(lastSkySrc);
    const { texture } = await loadTexture(lastSkySrc, 1, "image/jpeg");
    texture.encoding = LinearEncoding;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    updateSkybox(texture);
  }
};

const animateObjectScale = (obj: Object3D, scale: number) => {
  anime({
    targets: {
      x: obj.scale.x,
      y: obj.scale.y,
      z: obj.scale.z
    },
    x: scale,
    y: scale,
    z: scale,
    easing: "easeInOutSine",
    duration: 500,
    update: (anim: any) => {
      obj.scale.set(anim.animatables[0].target.x, anim.animatables[0].target.y, anim.animatables[0].target.z);
      obj.matrixNeedsUpdate = true;
    }
  });
};

const connect = () => {
  if (!sceneSet) {
    menu = anyEntityWith(APP.world, GameMenu)!;
    setupButtons(APP.world, menu);

    const menuObj = APP.world.eid2obj.get(menu)!;
    menuObj.position.set(0, 1.4, 0);
    menuObj.visible = false;

    APP.world.scene.add(sky);
    sky.position.setY(10);
    const characterUpdate = (event: any) => {
      const sceneObj = APP.world.eid2obj.get(event.detail)!;
      sceneObj.traverse(obj => {
        if (obj.name === "Character") {
          character = obj;
        }
      });
      character.scale.set(0, 0, 0);
      weatherEid = addEntity(APP.world);
      APP.scene?.removeEventListener("environment-scene-loaded", characterUpdate);

      menuObj.visible = true;
      sceneSet = true;
      pendingCommands.forEach(command => game(command));
    };
    APP.scene?.addEventListener("environment-scene-loaded", characterUpdate);
    swapActiveScene(APP.world, gameScene);
  }
};

const disconnect = () => {
  menu = anyEntityWith(APP.world, GameMenu)!;
  setupButtons(APP.world, menu);

  const obj = APP.world.eid2obj.get(menu)!;
  obj.visible = false;
};

const pendingCommands = new Array<any[]>();
const game = (data: any[]) => {
  const command = data.shift();

  if (!Object.values(CommandE).includes(command as CommandE)) return;

  switch (command) {
    case CommandE.Connect:
      connect();
      break;
    case CommandE.Disconnect:
      disconnect();
      break;
    case CommandE.Text:
      if (sceneSet) {
        text(data.shift());
      } else {
        pendingCommands.push([command, data.shift()]);
      }
      break;
    case CommandE.Options:
      if (sceneSet) {
        options(data.shift() as OptionsResponseI);
      } else {
        pendingCommands.push([command, data.shift()]);
      }
      break;
    case CommandE.Start:
      if (sceneSet) {
        start(data.shift());
      } else {
        pendingCommands.push([command, data.shift()]);
      }
      break;
    case CommandE.Skybox:
      if (sceneSet) {
        skybox(data.shift());
      } else {
        pendingCommands.push([command, data.shift()]);
      }
      break;
  }
};

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function updateButtonVisibility(world: HubsWorld, buttonRef: EntityID, visible: boolean) {
  const buttonObj = world.eid2obj.get(buttonRef)!;
  animateObjectScale(buttonObj, visible ? 0.75 : 0.0);
}

function updateOptionsVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.AButtonRef[menu], GameMenu.BButtonRef[menu], GameMenu.CButtonRef[menu], GameMenu.DButtonRef[menu]].forEach(
    buttonRef => {
      updateButtonVisibility(world, buttonRef, visible);
    }
  );
}

function updateOptionsEnabled(world: HubsWorld, menu: EntityID, enabled: boolean) {
  [GameMenu.AButtonRef[menu], GameMenu.BButtonRef[menu], GameMenu.CButtonRef[menu], GameMenu.DButtonRef[menu]].forEach(
    buttonRef => {
      if (enabled) {
        addComponent(world, CursorRaycastable, buttonRef);
        removeComponent(world, DisableButton, buttonRef);
      } else {
        removeComponent(world, CursorRaycastable, buttonRef);
        addComponent(world, DisableButton, buttonRef);
      }
    }
  );
}

function updateStartVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.StartButtonRef[menu]].forEach(buttonRef => {
    const buttonObj = world.eid2obj.get(buttonRef)!;
    animateObjectScale(buttonObj, visible ? 0.75 : 0.0);
  });
}

function updateEndVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  [GameMenu.EndButtonRef[menu]].forEach(buttonRef => {
    const buttonObj = world.eid2obj.get(buttonRef)!;
    animateObjectScale(buttonObj, visible ? 0.75 : 0.0);
  });
}

const TYPEWRITER_SPEED = 50;
let textHandler: NodeJS.Timeout | null;
function updateText(world: HubsWorld, menu: EntityID, msg?: string, callback?: Function) {
  if (!msg) {
    callback && callback();
    return;
  }

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

function updateTurnVisibility(world: HubsWorld, menu: EntityID, visible: boolean) {
  const nameRef = GameMenu.TurnRef[menu];
  const textObj = world.eid2obj.get(nameRef)!;
  animateObjectScale(textObj, visible ? 0.75 : 0.0);
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

function updateOptions(world: HubsWorld, menu: EntityID, options: GameOptionsI) {
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
      args: ["start", GAMES[Math.floor(Math.random() * GAMES.length)]]
    });
  } else if (clicked(world, GameMenu.EndButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["end"]
    });
  } else if (clicked(world, GameMenu.AButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "A", lastOptions?.options.A]
    });
  } else if (clicked(world, GameMenu.BButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "B", lastOptions?.options.B]
    });
  } else if (clicked(world, GameMenu.CButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "C", lastOptions?.options.C]
    });
  } else if (clicked(world, GameMenu.DButtonRef[menu])) {
    APP.hubChannel?.sendCommand({
      command: "game",
      args: ["option", "D", lastOptions?.options.D]
    });
  }
}

let initialized = false;
let menu: EntityID;
let sky: Mesh;
let lastSkySrc: string;
let sceneSet: boolean = false;
let character: Object3D;
let weatherEid: EntityID;
let audioEid: EntityID;
export function gameBotSystem(world: HubsWorld) {
  if (!initialized && APP.messageDispatch) {
    APP.messageDispatch!.addEventListener("message", (event: CustomEvent) => {
      const { body, type, sessionId } = event.detail;
      if (sessionId !== NAF.clientId && type === "command" && body.command === "game" && APP.scene?.is("entered")) {
        game(body.args);
      }
    });
    const geometry = new SphereGeometry(15, 32, 16);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iChannel0: {
          value: bgSkyboxTexture
        },
        iChannel1: {
          value: bgSkyboxTexture
        },
        iChannel2: {
          value: noiseTexture
        },
        iMix: { value: 0.0 },
        iTime: { value: world.time.elapsed }
      },
      vertexShader: skybox_vert,
      fragmentShader: skybox_frag,
      side: BackSide
    });
    sky = new Mesh(geometry, material);
    initialized = true;
  } else if (initialized) {
    const shader = sky.material as ShaderMaterial;
    shader.uniforms.iTime.value = world.time.elapsed;
    handleClicks(world, menu);
  }
}
