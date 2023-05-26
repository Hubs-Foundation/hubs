import { defineQuery, enterQuery, exitQuery } from "bitecs";
import {
  HoveredRemoteRight,
  MaterialTag,
  Object3DTag,
  RemoteHoverTarget,
  RemoteHoverTargetData
} from "../bit-components";
import { findChildWithComponent } from "../utils/bit-utils";
import { HubsWorld } from "../app";
import { Material, Mesh, MeshStandardMaterial, Object3D, ShaderMaterial, Uniform } from "three";
import { Text } from "troika-three-text";
import { updateMaterials } from "../utils/material-utils";
import { validMaterials } from "../components/hoverable-visuals";
import mediaHighlightFrag from "../utils/media-highlight-frag.glsl";

export type RemoteHoverTargetDatum = {
  geometryRadius: number;
  sweepParams: [number, number];
  uniforms: HoverShaderUniforms[];
};

export type HoverShaderUniforms = {
  hubs_IsFrozen: Uniform;
  hubs_EnableSweepingEffect: Uniform;
  hubs_SweepParams: Uniform;
  hubs_InteractorOnePos: Uniform;
  hubs_InteractorTwoPos: Uniform;
  hubs_HighlightInteractorOne: Uniform;
  hubs_HighlightInteractorTwo: Uniform;
  hubs_Time: Uniform;
};

export function injectCustomShaderChunks(obj: Object3D) {
  const shaderUniforms = [] as Object[];

  obj.traverse((object: Mesh) => {
    if (!object.material) return;

    // TODO this does not really belong here
    object.reflectionProbeMode = "dynamic";

    updateMaterials((object: Object3D, material: Material) => {
      // @ts-ignore
      if (material.hubs_InjectedCustomShaderChunks) return material;
      if (!validMaterials.includes(material.type)) {
        return material;
      }

      // HACK, this routine inadvertently leaves the A-Frame shaders wired to the old, dark
      // material, so maps cannot be updated at runtime. This breaks UI elements who have
      // hover/toggle state, so for now just skip these while we figure out a more correct
      // solution.
      if (
        object.el &&
        (object.el.classList.contains("ui") ||
          object.el.classList.contains("hud") ||
          object.el.getAttribute("text-button"))
      )
        return material;

      const newMaterial = material.clone();
      newMaterial.onBeforeRender = material.onBeforeRender;
      newMaterial.onBeforeCompile = (shader, renderer) => {
        if (shader.vertexShader.indexOf("#include <skinning_vertex>") == -1) return;

        if (material.onBeforeCompile) {
          material.onBeforeCompile(shader, renderer);
        }

        shader.uniforms.hubs_IsFrozen = { value: false };
        shader.uniforms.hubs_EnableSweepingEffect = { value: false };
        shader.uniforms.hubs_SweepParams = { value: [0, 0] };
        shader.uniforms.hubs_InteractorOnePos = { value: [0, 0, 0] };
        shader.uniforms.hubs_InteractorTwoPos = { value: [0, 0, 0] };
        shader.uniforms.hubs_HighlightInteractorOne = { value: false };
        shader.uniforms.hubs_HighlightInteractorTwo = { value: false };
        shader.uniforms.hubs_Time = { value: 0 };

        shader.vertexShader =
          [
            "varying vec3 hubs_WorldPosition;",
            "uniform bool hubs_IsFrozen;",
            "uniform bool hubs_HighlightInteractorOne;",
            "uniform bool hubs_HighlightInteractorTwo;\n"
          ].join("\n") +
          shader.vertexShader.replace(
            "#include <skinning_vertex>",
            `#include <skinning_vertex>
             if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {
              vec4 wt = modelMatrix * vec4(transformed, 1);

              // Used in the fragment shader below.
              hubs_WorldPosition = wt.xyz;
            }`
          );

        shader.fragmentShader =
          [
            "varying vec3 hubs_WorldPosition;",
            "uniform bool hubs_IsFrozen;",
            "uniform bool hubs_EnableSweepingEffect;",
            "uniform vec2 hubs_SweepParams;",
            "uniform bool hubs_HighlightInteractorOne;",
            "uniform vec3 hubs_InteractorOnePos;",
            "uniform bool hubs_HighlightInteractorTwo;",
            "uniform vec3 hubs_InteractorTwoPos;",
            "uniform float hubs_Time;\n"
          ].join("\n") +
          shader.fragmentShader.replace(
            "#include <output_fragment>",
            "#include <output_fragment>\n" + mediaHighlightFrag
          );

        shaderUniforms.push(shader.uniforms);
      };
      newMaterial.needsUpdate = true;
      // @ts-ignore
      newMaterial.hubs_InjectedCustomShaderChunks = true;
      return newMaterial;
    });
  });

  return shaderUniforms;
}

const isHoverableQuery = defineQuery([RemoteHoverTarget]);
const hoveredQuery = defineQuery([HoveredRemoteRight, Object3DTag]);
const hoveredEnterQuery = enterQuery(hoveredQuery);
const hoveredExitQuery = exitQuery(hoveredQuery);

export const objectHoverSystem = (world: HubsWorld, sceneIsFrozen: Boolean) => {
  hoveredExitQuery(world).forEach(eid => {});

  hoveredQuery(world).forEach(eid => {
    const { uniforms, geometryRadius, sweepParams } = RemoteHoverTargetData.get(eid);
    const obj = world.eid2obj.get(eid);

    if (obj) {
      const worldY = obj.matrixWorld.elements[13];
      const ms1 = obj.matrixWorld.elements[4];
      const ms2 = obj.matrixWorld.elements[5];
      const ms3 = obj.matrixWorld.elements[6];
      const worldScale = Math.sqrt(ms1 * ms1 + ms2 * ms2 + ms3 * ms3);
      const scaledRadius = worldScale * geometryRadius;
      sweepParams[0] = worldY - scaledRadius;
      sweepParams[1] = worldY + scaledRadius;
    }

    for (let i = 0; i < uniforms.length; i++) {
      uniforms[i].hubs_IsFrozen.value = true;
      uniforms[i].hubs_EnableSweepingEffect.value = true;
      uniforms[i].hubs_SweepParams.value = sweepParams;
      uniforms[i].hubs_Time.value = performance.now();
    }
  });
};
