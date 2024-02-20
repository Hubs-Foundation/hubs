/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, Ref, createRef } from "../utils/jsx-entity";
import { textureLoader } from "../utils/media-utils";
import selectedTextureSrc from "../assets/images/flags/flag_background_active.png";
import normalTextureSrc from "../assets/images/flags/flag_background.png";
import backgroundTextureSrc from "../assets/images/flags/language_panel_2.png";

import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { FLAGS, FlagButton } from "./lang-button";
import { BUTTON_TYPES } from "./button3D";
import { virtualAgent } from "../bit-systems/agent-system";
import { Color, Vector3 } from "three";
import { COLLISION_LAYERS } from "../constants";

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
  const [deRef, duRef, itRef, elRef, esRef, enRef] = [
    createRef(),
    createRef(),
    createRef(),
    createRef(),
    createRef(),
    createRef()
  ];

  return (
    <entity followFov>
      <entity
        name="hud-lang-panel"
        position={[0, 0, 0.6]}
        image={{
          texture: backgroundTexture,
          ratio: 0.6,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: ""
        }}
        flagPanelManager={{ deRef: deRef, duRef: duRef, itRef: itRef, elRef: elRef, esRef: esRef, enRef: enRef }}
        lookatuser
        cursorRaycastable
        remoteHoverTarget
        handCollisionTarget
        offersRemoteConstraint
        offersHandConstraint
        makeKinematicOnRelease
        holdable
        floatyObject
        rigidbody={{ collisionGroup: COLLISION_LAYERS.INTERACTABLES, collisionMask: COLLISION_LAYERS.HANDS }}
        physicsShape={{ halfExtents: [0.22, 0.14, 0.1] }}
      >
        <FlagButton
          name="de_flag"
          width={0.172}
          ref={deRef}
          position={[-0.246, 0.076, 0.1]}
          flag={FLAGS.DE}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
        <FlagButton
          name="du_flag"
          width={0.172}
          ref={duRef}
          position={[0, 0.076, 0.1]}
          flag={FLAGS.DU}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
        <FlagButton
          name="it_flag"
          width={0.172}
          ref={itRef}
          position={[0.246, 0.076, 0.1]}
          flag={FLAGS.IT}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
        <FlagButton
          name="es_flag"
          width={0.172}
          ref={esRef}
          position={[-0.246, -0.136, 0.1]}
          flag={FLAGS.ES}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
        <FlagButton
          name="el_flag"
          width={0.172}
          ref={elRef}
          position={[0, -0.136, 0.1]}
          flag={FLAGS.EL}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
        <FlagButton
          name="en_flag"
          width={0.172}
          ref={enRef}
          position={[0.246, -0.136, 0.1]}
          flag={FLAGS.EN}
          type={BUTTON_TYPES.MIC}
        ></FlagButton>
      </entity>
    </entity>
  );
}
