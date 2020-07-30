export function forEachMaterial(object3D, fn) {
  if (!object3D.material) return;

  if (Array.isArray(object3D.material)) {
    object3D.material.forEach(fn);
  } else {
    fn(object3D.material);
  }
}

export function mapMaterials(object3D, fn) {
  if (!object3D.material) return;

  if (Array.isArray(object3D.material)) {
    return object3D.material.map(fn);
  } else {
    return fn(object3D.material);
  }
}

export function convertStandardMaterial(source, quality) {
  if (!source.isMeshStandardMaterial) {
    return source;
  }

  if (quality === "medium") {
    const material = new THREE.MeshPhongMaterial();

    THREE.Material.prototype.copy.call(material, source);

    material.color.copy(source.color);

    material.map = source.map;

    material.lightMap = source.lightMap;
    material.lightMapIntensity = source.lightMapIntensity;

    material.aoMap = source.aoMap;
    material.aoMapIntensity = source.aoMapIntensity;

    material.emissive.copy(source.emissive);
    material.emissiveMap = source.emissiveMap;
    material.emissiveIntensity = source.emissiveIntensity;

    material.bumpMap = source.bumpMap;
    material.bumpScale = source.bumpScale;

    material.displacementMap = source.displacementMap;
    material.displacementScale = source.displacementScale;
    material.displacementBias = source.displacementBias;

    material.alphaMap = source.alphaMap;

    material.reflectivity = 0.5;
    material.refractionRatio = source.refractionRatio;

    material.wireframe = source.wireframe;
    material.wireframeLinewidth = source.wireframeLinewidth;
    material.wireframeLinecap = source.wireframeLinecap;
    material.wireframeLinejoin = source.wireframeLinejoin;

    material.skinning = source.skinning;
    material.morphTargets = source.morphTargets;
    material.morphNormals = source.morphNormals;

    return material;
  } else if (quality === "low") {
    const material = new THREE.MeshBasicMaterial();

    THREE.Material.prototype.copy.call(material, source);

    material.color.copy(source.color);

    material.onBeforeCompile = shader => {
      shader.uniforms.emissive = { value: source.emissive };
      shader.uniforms.emissiveIntensity = { value: source.emissiveIntensity };
      shader.uniforms.emissiveMap = { value: source.emissiveMap };
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <lightmap_pars_fragment>",
        `#include <lightmap_pars_fragment>
        uniform vec3 emissive;
        uniform sampler2D emissiveMap;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <envmap_fragment>",
        `#include <envmap_fragment>
        vec3 totalEmissiveRadiance = emissive;
        vec4 emissiveColor = texture2D( emissiveMap, vUv );
        emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor ).rgb;
        totalEmissiveRadiance *= emissiveColor.rgb;
        outgoingLight += totalEmissiveRadiance;
        `
      );
    };

    material.map = source.map;

    material.lightMap = source.lightMap;
    material.lightMapIntensity = source.lightMapIntensity;

    material.aoMap = source.aoMap;
    material.aoMapIntensity = source.aoMapIntensity;

    material.alphaMap = source.alphaMap;

    material.wireframe = source.wireframe;
    material.wireframeLinewidth = source.wireframeLinewidth;
    material.wireframeLinecap = source.wireframeLinecap;
    material.wireframeLinejoin = source.wireframeLinejoin;

    material.skinning = source.skinning;
    material.morphTargets = source.morphTargets;

    return material;
  }

  return source;
}
