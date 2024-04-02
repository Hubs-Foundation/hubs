/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef, ArrayVec3 } from "../utils/jsx-entity";
import spotSrc from "../assets/images/pointer.png";
import { textureLoader } from "../utils/media-utils";
import nametagSrc from "../assets/hud/nametag.9.png";
import { BUTTON_TYPES, Button3D } from "./button3D";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { TextureCache } from "../utils/texture-cache";
import { degToRad, radToDeg } from "three/src/math/MathUtils";

const tutorialSchema = "https://kontopoulosdm.github.io/tutorial_";

export function TutorialPanel() {
  const textRef = createRef();
  const panelRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const testRef = createRef();
  const panelTexture = textureLoader.load(nametagSrc);

  return (
    <entity
      name="tutorialPanel"
      floatingTextPanel={{ textRef: textRef, nextRef: nextRef, prevRef: prevRef, testRef: testRef }}
      ref={panelRef}
      slice9={{ size: [0.5, 0.5], insets: [64, 66, 64, 66], texture: panelTexture }}
      position={[-9.8, 2.0, -10]}
      rotation={[0, 90, 0]}
      scale={[1, 1, 1]}
    >
      <entity
        name={`text`}
        position={[0, 0, 0.01]}
        ref={textRef}
        text={{
          value: "This is a test",
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 1
        }}
      />
      <Button3D
        ref={nextRef}
        scale={[0.5, 0.5, 0.5]}
        position={[-0.8, 0, 0.3]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={">"}
      />
      <Button3D
        ref={prevRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0.8, 0, 0.3]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"<"}
      />
      <Button3D
        ref={testRef}
        scale={[0.5, 0.5, 0.5]}
        position={[0, -0.5, 0.3]}
        width={0.5}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"Click me!"}
      />
    </entity>
  );
}
export function TutorialImagePanel(
  slides: Array<string>,
  congratsSlides: Array<string>,
  position: ArrayVec3,
  rotation: ArrayVec3,
  ratio: number
) {
  const textRef = createRef();
  const panelRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const testRef = createRef();

  const slideEntities = [] as Array<EntityDef>;
  const cSlideEntities = [] as Array<EntityDef>;

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
        scale={[4, 4, 4]}
      ></entity>
    );
  });

  congratsSlides.forEach((cSlide, index) => {
    const texture = textureLoader.load(cSlide, null, null, () => {
      console.log(`error`);
    });
    cSlideEntities.push(
      <entity
        name={`congrats_slide_${index}`}
        image={{
          texture: texture,
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: TextureCache.key(cSlide, 1)
        }}
        visible={false}
        scale={[4, 4, 4]}
      ></entity>
    );
  });

  return (
    <entity
      name="tutorialPanel"
      floatingTextPanel={{ textRef: textRef, nextRef: nextRef, prevRef: prevRef, testRef: testRef }}
      ref={panelRef}
      position={position}
      rotation={rotation}
    >
      {slideEntities}
      {cSlideEntities}
      <entity
        name={`text`}
        position={[0, 0, -0.03]}
        ref={textRef}
        text={{
          value: "This is a test",
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 1
        }}
        visible={false}
      />
      <Button3D
        ref={nextRef}
        position={[2, 0, 0.3]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        scale={[2, 2, 2]}
        text={">"}
      />

      <Button3D
        ref={prevRef}
        position={[-2, 0, 0.3]}
        scale={[2, 2, 2]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"<"}
      />
      <Button3D
        ref={testRef}
        position={[0, -1, 0.3]}
        width={0.5}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        text={"Click me!"}
      />
    </entity>
  );
}
