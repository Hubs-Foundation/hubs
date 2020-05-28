const VERTEX_SHADER = `
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
  #include <uv_vertex>
  #include <uv2_vertex>
  #include <color_vertex>
  #include <skinbase_vertex>

  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  #include <logdepthbuf_vertex>

  #include <worldpos_vertex>
  #include <clipping_planes_vertex>
  #include <fog_vertex>
}
`;

const FRAGMENT_SHADER = `
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <aomap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
  #include <clipping_planes_fragment>

  vec4 diffuseColor = vec4(diffuse, opacity);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
  vec3 totalEmissiveRadiance = emissive;

  #include <logdepthbuf_fragment>
  #include <map_fragment>
  #include <color_fragment>
  #include <alphatest_fragment>
  #include <emissivemap_fragment>

  reflectedLight.indirectDiffuse += vec3(1.0);

  #include <aomap_fragment>

  reflectedLight.indirectDiffuse *= diffuseColor.rgb;

  vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

  gl_FragColor = vec4(outgoingLight, diffuseColor.a);

  #include <premultiplied_alpha_fragment>
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
}
`;

export default class MobileStandardMaterial extends THREE.ShaderMaterial {
  type = "MobileStandardMaterial";
  isMobileStandardMaterial = true;
  static fromStandardMaterial(material) {
    const parameters = {
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uvTransform: { value: new THREE.Matrix3() },
        diffuse: { value: material.color },
        opacity: { value: material.opacity },
        map: { value: material.map },
        aoMapIntensity: { value: material.aoMapIntensity },
        aoMap: { value: material.aoMap },
        emissive: { value: material.emissive },
        emissiveMap: { value: material.emissiveMap }
      },
      fog: true,
      lights: false,
      opacity: material.opacity,
      transparent: material.transparent,
      alphaTest: material.alphaTest,
      skinning: material.skinning,
      morphTargets: material.morphTargets,
      vertexColors: material.vertexColors,
      name: material.name,
      side: material.side
    };

    const mobileMaterial = new MobileStandardMaterial(parameters);

    mobileMaterial.color = material.color;
    mobileMaterial.map = material.map;
    mobileMaterial.aoMap = material.aoMap;
    mobileMaterial.aoMapIntensity = material.aoMapIntensity;
    mobileMaterial.emissive = material.emissive;
    mobileMaterial.emissiveIntensity = material.emissiveIntensity;
    mobileMaterial.emissiveMap = material.emissiveMap;

    // TODO this actually needs to get called whenever any of these material properties change
    mobileMaterial.refreshUniforms();

    return mobileMaterial;
  }

  refreshUniforms() {
    this.uniforms.opacity.value = this.opacity;

    if (this.color) {
      this.uniforms.diffuse.value.copy(this.color);
    }

    if (this.emissive) {
      this.uniforms.emissive.value.copy(this.emissive).multiplyScalar(this.emissiveIntensity);
    }

    if (this.map) {
      this.uniforms.map.value = this.map;
    }

    if (this.aoMap) {
      this.uniforms.aoMap.value = this.aoMap;
      this.uniforms.aoMapIntensity.value = this.aoMapIntensity;
    }

    const uvScaleMap = this.map || this.emissiveMap;
    if (uvScaleMap && uvScaleMap.matrixAutoUpdate === true) {
      uvScaleMap.updateMatrix();
      this.uniforms.uvTransform.value.copy(uvScaleMap.matrix);
    }
  }

  clone() {
    return MobileStandardMaterial.fromStandardMaterial(this);
  }
}
