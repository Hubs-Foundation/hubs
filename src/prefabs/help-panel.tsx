/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef, ArrayVec3 } from "../utils/jsx-entity";
import spotSrc from "../assets/images/pointer.png";
import { textureLoader } from "../utils/media-utils";
import nametagSrc from "../assets/hud/nametag.9.png";
import { BUTTON_TYPES, TextButton3D } from "./button3D";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { TextureCache } from "../utils/texture-cache";
import { degToRad, radToDeg } from "three/src/math/MathUtils";
import { FollowFov } from "../bit-components";

const tutorialSchema = "https://kontopoulosdm.github.io/tutorial_";

export function HelpImagePanel(slides: Array<string>, ratio: number) {
  const textRef = createRef();
  const panelRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const resetRef = createRef();
  const clickRef = createRef();

  const slideEntities = [] as Array<EntityDef>;

  slides.forEach((slide, index) => {
    slideEntities.push(
      <entity
        name={`slide_${index}`}
        image={{
          texture: textureLoader.load(slide),
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: TextureCache.key(slide, 1)
        }}
        visible={false}
      ></entity>
    );
  });

  return (
    <entity
      name="tutorialPanel"
      floatingTextPanel={{
        textRef: textRef,
        nextRef: nextRef,
        prevRef: prevRef,
        resetRef: resetRef,
        clickRef: clickRef
      }}
      ref={panelRef}
      followFov={{ offset: [0, 0, -2] }}
      scale={[1.5, 1.5, 1.5]}
    >
      {slideEntities}

      <TextButton3D
        ref={nextRef}
        position={[0.5, 0, 0.3]}
        width={0.2}
        height={0.2}
        scale={[0.5, 0.5, 0.5]}
        type={BUTTON_TYPES.DEFAULT}
        text={">"}
      />

      <TextButton3D
        ref={prevRef}
        position={[-0.5, 0, 0.3]}
        scale={[0.5, 0.5, 0.5]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"<"}
      />

      <TextButton3D
        ref={resetRef}
        position={[0, -1, 0.3]}
        width={0.5}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"Click me!"}
      />
    </entity>
  );
}
