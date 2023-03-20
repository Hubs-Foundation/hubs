import { addObject3DComponent } from "../utils/jsx-entity";
import { NetworkedMediaFrame, MediaFrame, Networked } from "../bit-components";
import { addComponent, hasComponent } from "bitecs";
import { MediaType } from "../utils/media-utils";
import { COLLISION_LAYERS } from "../constants";
import { Layers } from "../camera-layers";
import { inflateRigidBody, Type } from "./rigid-body";
import { Fit, inflatePhysicsShape, Shape } from "./physics-shape";
import { Mesh, BoxBufferGeometry, ShaderMaterial, Color, DoubleSide, Group } from "three";

const DEFAULTS = {
  bounds: { x: 1, y: 1, z: 1 },
  mediaType: "all"
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
  // TODO: This is a hack around the physics system addBody call requiring its body to have parent
  guide.parent = new Group();
  addObject3DComponent(world, eid, guide);
  addComponent(world, MediaFrame, eid, true);
  addComponent(world, NetworkedMediaFrame, eid, true);

  if (!hasComponent(world, Networked, eid)) addComponent(world, Networked, eid);

  MediaFrame.mediaType[eid] = {
    all: MediaType.ALL,
    "all-2d": MediaType.ALL_2D,
    model: MediaType.MODEL,
    image: MediaType.IMAGE,
    video: MediaType.VIDEO,
    pdf: MediaType.PDF
  }[componentProps.mediaType];
  MediaFrame.bounds[eid].set([componentProps.bounds.x, componentProps.bounds.y, componentProps.bounds.z]);

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
