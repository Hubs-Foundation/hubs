/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, Ref, createRef } from "../utils/jsx-entity";
import { textureLoader } from "../utils/media-utils";
import selectedTextureSrc from "../assets/images/flags/flag_background-selected.png";
import normalTextureSrc from "../assets/images/flags/flag_background.png";
import backgroundTextureSrc from "../assets/images/flags/plane_background.png";

import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { FLAGS, FlagButton } from "./lang-button";
import { BUTTON_TYPES } from "./button3D";
import { virtualAgent } from "../bit-systems/agent-system";
import { Color, Vector3 } from "three";

const selectedTexture = textureLoader.load(selectedTextureSrc);
const normalTexture = textureLoader.load(normalTextureSrc);
const backgroundTexture = textureLoader.load(backgroundTextureSrc);

export const selectMaterial = new THREE.MeshBasicMaterial({
  map: selectedTexture,
  transparent: true,
  alphaToCoverage: false,
  alphaTest: 0.5,
  color: new Color("FFFFFF")
});
export const normalMaterial = new THREE.MeshBasicMaterial({
  map: normalTexture,
  transparent: true,
  alphaToCoverage: false,
  alphaTest: 0.5,
  color: new Color("FFFFFF")
});

export function HUDLangPanel() {
  const [deRef, duRef, itRef, elRef, esRef] = [createRef(), createRef(), createRef(), createRef(), createRef()];
  const agentPos = virtualAgent.avatarPos;
  const agentdir = virtualAgent.flatAvatarDirection;
  const pos = new Vector3().addVectors(agentPos, agentdir.multiplyScalar(2));

  return (
    <entity position={pos.toArray()} lookatuser>
      <entity
        name="hud-lang-panel"
        scale={[2, 1.3 / 0.65, 1]}
        image={{
          texture: backgroundTexture,
          ratio: 0.65,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: ""
        }}
        flagPanelManager={{ deRef: deRef, duRef: duRef, itRef: itRef, elRef: elRef, esRef: esRef }}
      ></entity>
      <FlagButton
        name="de_flag"
        width={0.5}
        ref={deRef}
        position={[0.62, 0.31, 0.1]}
        flag={FLAGS.DE}
        type={BUTTON_TYPES.MIC}
      ></FlagButton>
      <FlagButton
        name="du_flag"
        width={0.5}
        ref={duRef}
        position={[0, 0.31, 0.1]}
        flag={FLAGS.DU}
        type={BUTTON_TYPES.MIC}
      ></FlagButton>
      <FlagButton
        name="it_flag"
        width={0.5}
        ref={itRef}
        position={[-0.62, 0.31, 0.1]}
        flag={FLAGS.IT}
        type={BUTTON_TYPES.MIC}
      ></FlagButton>
      <FlagButton
        name="es_flag"
        width={0.5}
        ref={esRef}
        position={[-0.31, -0.31, 0.1]}
        flag={FLAGS.ES}
        type={BUTTON_TYPES.MIC}
      ></FlagButton>
      <FlagButton
        name="el_flag"
        width={0.5}
        ref={elRef}
        position={[0.31, -0.31, 0.1]}
        flag={FLAGS.EL}
        type={BUTTON_TYPES.MIC}
      ></FlagButton>
    </entity>
  );
}
