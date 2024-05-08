import { addObject3DComponent } from "../utils/jsx-entity";
import { NetworkedMediaFrame, MediaFrame, Networked } from "../bit-components";
import { addComponent, addEntity, hasComponent } from "bitecs";
import { MediaType } from "../utils/media-utils";
import { COLLISION_LAYERS } from "../constants";
import { Layers } from "../camera-layers";
import { inflateRigidBody, Type } from "./rigid-body";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";
import { Mesh, BoxBufferGeometry, ShaderMaterial, Color, DoubleSide } from "three";

export const AxisAlignType = {
  MIN: 1 << 0,
  CENTER: 1 << 1,
  MAX: 1 << 2
};

export const MEDIA_FRAME_FLAGS = {
  SCALE_TO_BOUNDS: 1 << 0,
  ACTIVE: 1 << 1,
  SNAP_TO_CENTER: 1 << 2,
  LOCKED: 1 << 3
};

export const MediaTypes = {
  all: MediaType.ALL,
  "all-2d": MediaType.ALL_2D,
  model: MediaType.MODEL,
  image: MediaType.IMAGE,
  video: MediaType.VIDEO,
  pdf: MediaType.PDF
};

const DEFAULTS = {
  bounds: { x: 1, y: 1, z: 1 },
  mediaType: "all",
  scaleToBounds: true,
  align: { x: "center", y: "center", z: "center" },
  active: true,
  locked: false
};
export function inflateMediaFrame(world, eid, componentProps) {
  componentProps = Object.assign({}, DEFAULTS, componentProps);
  const guide = new Mesh(
    new BoxBufferGeometry(componentProps.bounds.x, componentProps.bounds.y, componentProps.bounds.z),
    new ShaderMaterial({
      uniforms: {
        color: { value: new Color(0x2f80ed) }
      },
      vertexShader: `
            varying vec2 vUv;
            void main()
            {
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
              vUv = uv;
            }
          `,
      fragmentShader: `
            // adapted from https://www.shadertoy.com/view/Mlt3z8
            float bayerDither2x2( vec2 v ) {
              return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
            }
            float bayerDither4x4( vec2 v ) {
              vec2 P1 = mod( v, 2.0 );
              vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
              return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
            }

            varying vec2 vUv;
            uniform vec3 color;
            void main() {
              float alpha = max(step(0.45, abs(vUv.x - 0.5)), step(0.45, abs(vUv.y - 0.5))) - 0.5;
              if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha ) discard;
              gl_FragColor = vec4(color, 1.0);
            }
          `,
      side: DoubleSide
    })
  );
  guide.layers.set(Layers.CAMERA_LAYER_UI);
  const guideEid = addEntity(world);
  addObject3DComponent(world, guideEid, guide);
  addComponent(world, MediaFrame, eid, true);
  addComponent(world, NetworkedMediaFrame, eid, true);

  NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.ACTIVE;
  if (componentProps.snapToCenter) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.SNAP_TO_CENTER;
  }

  if (!hasComponent(world, Networked, eid)) addComponent(world, Networked, eid);

  // Media types accepted
  MediaFrame.mediaType[eid] = MediaTypes[componentProps.mediaType];
  NetworkedMediaFrame.mediaType[eid] = MediaFrame.mediaType[eid];
  // Bounds
  MediaFrame.bounds[eid].set([componentProps.bounds.x, componentProps.bounds.y, componentProps.bounds.z]);
  // Axis alignment
  const mapAlignProp = alignPropValue => {
    return {
      min: AxisAlignType.MIN,
      center: AxisAlignType.CENTER,
      max: AxisAlignType.MAX
    }[alignPropValue];
  };
  MediaFrame.align[eid].set([
    mapAlignProp(componentProps.align.x),
    mapAlignProp(componentProps.align.y),
    mapAlignProp(componentProps.align.z)
  ]);
  // Preview guide
  MediaFrame.guide[eid] = guideEid;
  // Flags: scaleToBounds
  let flags = 0;
  if (componentProps.scaleToBounds) flags |= MEDIA_FRAME_FLAGS.SCALE_TO_BOUNDS;
  MediaFrame.flags[eid] = flags;

  if (componentProps.active) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.ACTIVE;
    MediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.ACTIVE;
  }
  if (componentProps.locked) {
    NetworkedMediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.LOCKED;
    MediaFrame.flags[eid] |= MEDIA_FRAME_FLAGS.LOCKED;
  }

  inflateRigidBody(world, eid, {
    type: Type.KINEMATIC,
    collisionGroup: COLLISION_LAYERS.MEDIA_FRAMES,
    collisionMask: COLLISION_LAYERS.INTERACTABLES,
    disableCollision: true
  });
  inflatePhysicsShape(world, eid, {
    type: Shape.BOX,
    fit: Fit.MANUAL,
    halfExtents: [componentProps.bounds.x / 2, componentProps.bounds.y / 2, componentProps.bounds.z / 2]
  });
}
