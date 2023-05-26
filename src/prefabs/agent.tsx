/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, createRef } from "../utils/jsx-entity";
import { preload } from "../utils/preload";
import { loadModel } from "../components/gltf-model-plus";
import agentModelSrc from "../assets/models/cute_agent.glb";
import { HubsWorld } from "../app";
import { MediaLoaderParams } from "../inflators/media-loader";
import nametagSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { AgentPanel } from "./agent-panel";
import { greetingPhrases } from "../bit-systems/text-paradigms";
import { getRandomInt } from "../bit-systems/agent-system";
import { FromatNewText } from "../bit-systems/agent-slideshow-system";

preload(loadModel(agentModelSrc, null, true));
const panelTexture = textureLoader.load(nametagSrc);

const agentMediaParams: MediaLoaderParams = {
  src: agentModelSrc,
  recenter: true,
  resize: true,
  animateLoad: true,
  isObjectMenuTarget: true
};

export function AgentEntity() {
  const language = 0;
  const agentRef = createRef();
  const panelRef = createRef();
  const modelRef = createRef();
  const textRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const text = FromatNewText(greetingPhrases[getRandomInt(greetingPhrases.length)]);

  return (
    <entity
      name="Agent"
      agent={{ language, panelRef, modelRef, textRef, nextRef, prevRef }}
      scale={[1, 1, 1]}
      ref={agentRef}
      lookatuser
    >
      <entity lookatuser name="agentObject" mediaLoader={agentMediaParams} ref={modelRef} scale={[1, 1, 1]} />
      <AgentPanel textRef={textRef} text={text} panelRef={panelRef} nextRef={nextRef} prevRef={prevRef} />
    </entity>
  );
}

export function addAgentToScene(world: HubsWorld) {
  const eid = renderAsEntity(world, AgentEntity());
  const obj = world.eid2obj.get(eid)!;
  AFRAME.scenes[0].object3D.add(obj);
  return eid;
}
