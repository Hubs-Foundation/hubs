/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity, Ref, createRef, EntityDef, ArrayVec3 } from "../utils/jsx-entity";
import spotSrc from "../assets/images/pointer.png";
import { resolveMediaInfo, textureLoader } from "../utils/media-utils";
import nametagSrc from "../assets/hud/nametag.9.png";
import { BUTTON_TYPES, TextButton3D, StaticButton3D } from "./button3D";
import { ProjectionMode } from "../utils/projection-mode";
import { AlphaMode } from "../utils/create-image-mesh";
import { TextureCache } from "../utils/texture-cache";
import { degToRad, radToDeg } from "three/src/math/MathUtils";
import { FollowFov } from "../bit-components";
import { createTexture, loadTexture, loadTextureFromCache } from "../utils/load-texture";
import { createKTX2Texture } from "../utils/create-basis-texture";
import { preload } from "../utils/preload";
import { roomPropertiesReader } from "../utils/rooms-properties";

const tutorialSchema = "https://kontopoulosdm.github.io/tutorial_";

export async function MovingTutorialImagePanel(
  slides: Array<string>,
  cSlides: Array<string>,
  gifSlides: Array<string>,
  pos: ArrayVec3,
  rot: ArrayVec3,
  ratio: number,
  scale: number
) {
  const textRef = createRef();
  const panelRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const resetRef = createRef();
  const clickRef = createRef();

  const [slideEntities, cSlideEntities] = await TutorialPanelInit(slides, cSlides, gifSlides, ratio, scale);
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
      position={pos}
      rotation={rot}
      followFov={{ offset: [0, 0, -2] }}
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
      <TextButton3D
        ref={nextRef}
        position={[2, 0, 0.3]}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        scale={[2, 2, 2]}
        text={">"}
      />

      <TextButton3D
        ref={prevRef}
        position={[-2, 0, 0.3]}
        scale={[2, 2, 2]}
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

export async function StaticTutorialImagePanel(
  slides: Array<string>,
  cSlides: Array<string>,
  gifSlides: Array<string>,
  pos: ArrayVec3,
  rot: ArrayVec3,
  ratio: number,
  scale: number
) {
  const textRef = createRef();
  const panelRef = createRef();
  const nextRef = createRef();
  const prevRef = createRef();
  const resetRef = createRef();
  const clickRef = createRef();

  const [slideEntities, cSlideEntities] = await TutorialPanelInit(slides, cSlides, gifSlides, ratio, scale);

  const prevIcon = `${roomPropertiesReader.serverURL}/assets/prev_icon.png`;
  const nextIcon = `${roomPropertiesReader.serverURL}/assets/next_icon.png`;
  const resetIcon = `${roomPropertiesReader.serverURL}/assets/reset_icon.png`;
  const clickIcon = `${roomPropertiesReader.serverURL}/assets/click_icon.png`;

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
      position={pos}
      rotation={rot}
    >
      {slideEntities}
      {cSlideEntities}
      <entity
        name={`text`}
        position={[0, 0, -0.03]}
        ref={textRef}
        text={{
          value: "This should not be visible",
          color: "#000000",
          textAlign: "center",
          anchorX: "center",
          anchorY: "middle",
          fontSize: 0.05,
          maxWidth: 1
        }}
        visible={false}
      />
      <StaticButton3D
        ref={nextRef}
        position={[2.25, 0, 0]}
        name={"next_button"}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        ratio={1}
        image={nextIcon}
      />
      <StaticButton3D
        ref={prevRef}
        position={[-2.25, 0, 0]}
        name={"prev_button"}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        ratio={1}
        image={prevIcon}
      />
      <StaticButton3D
        ref={resetRef}
        position={[0, -1, 0.3]}
        name={"reset_button"}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        ratio={1}
        image={resetIcon}
      />
      <StaticButton3D
        ref={clickRef}
        position={[0, -1, 0.3]}
        name={"click_button"}
        width={0.2}
        height={0.2}
        type={BUTTON_TYPES.DEFAULT}
        ratio={1}
        image={clickIcon}
      />
    </entity>
  );
}

async function TutorialPanelInit(
  slides: Array<string>,
  congratsSlides: Array<string>,
  gifSlides: Array<string>,
  ratio: number,
  scale: number
) {
  const slideEntities = [] as Array<EntityDef>;
  const cSlideEntities = [] as Array<EntityDef>;

  for (let index = 0; index < slides.length; index++) {
    const slide = slides[index];
    const gifSlide = gifSlides[index];

    const contentType = slide.includes(".gif") ? "image/gif" : "image/png";
    const texture = await createTexture(contentType, slide);

    const slideEntity: EntityDef = (
      <entity
        name={`slide_${index}`}
        image={{
          texture: texture,
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: slide
        }}
        visible={false}
        scale={[scale, scale, scale]}
      ></entity>
    );

    if (gifSlide.length > 0) {
      const gifContentType = gifSlide.includes(".gif") ? "image/gif" : "image/png";
      const gifTexture = await createTexture(gifContentType, gifSlide);

      slideEntity.children.push(
        <entity
          name={`gif_slide_slide_${index}`}
          image={{
            texture: gifTexture,
            ratio: ratio,
            projection: ProjectionMode.FLAT,
            alphaMode: AlphaMode.Blend,
            cacheKey: slide
          }}
          visible={true}
          position={[0, 0, 0.001]}
        ></entity>
      );
    }

    slideEntities.push(slideEntity);

    /*<entity
        name={`slide_${index}`}
        image={{
          texture: texture,
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: slide
        }}
        visible={false}
        scale={[scale, scale, scale]}
      >
        <entity
          name={`gif_slide_slide_${index}`}
          image={{
            texture: gifTexture,
            ratio: ratio,
            projection: ProjectionMode.FLAT,
            alphaMode: AlphaMode.Blend,
            cacheKey: slide
          }}
          visible={true}
          position={[0, 0, 0.001]}
        ></entity>
      </entity>*/
  }

  for (let index = 0; index < congratsSlides.length; index++) {
    const cSlide = congratsSlides[index];
    // const texture = textureLoader.load(cSlide, null, null, () => {
    //   console.log(`error`);
    // });

    const contentType = cSlide.includes(".gif") ? "image/gif" : "image/png";
    const texture = await createTexture(contentType, cSlide);
    // const { texture, cacheKey } = loadTextureFromCache(cSlide, 1);
    cSlideEntities.push(
      <entity
        name={`congrats_slide_${index}`}
        image={{
          texture: texture,
          ratio: ratio,
          projection: ProjectionMode.FLAT,
          alphaMode: AlphaMode.Blend,
          cacheKey: cSlide
        }}
        visible={false}
        scale={[scale, scale, scale]}
      ></entity>
    );
  }

  return [slideEntities, cSlideEntities];
}

export function SimpleImagePanel(
  textureUrl: string,
  name: string,
  position: ArrayVec3,
  rotation: ArrayVec3,
  scale: number,
  ratio: number
) {
  return (
    <entity
      name={`name`}
      image={{
        texture: textureLoader.load(textureUrl),
        ratio: ratio,
        projection: ProjectionMode.FLAT,
        alphaMode: AlphaMode.Blend,
        cacheKey: TextureCache.key(textureUrl, 1)
      }}
      position={position}
      scale={[scale, scale, 1]}
      rotation={rotation}
    ></entity>
  );
}
