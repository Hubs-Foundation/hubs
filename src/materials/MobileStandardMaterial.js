console.log(THREE.MeshToonMaterial);

export default class MobileStandardMaterial extends THREE.MeshToonMaterial {
  isMobileStandardMaterial = true;
  static fromStandardMaterial(source) {
    const material = new THREE.MeshPhongMaterial();
    THREE.Material.prototype.copy.call(material, source);

    material.color.copy(source.color);
    //material.shininess = source.shininess;

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

    //material.specularMap = source.specularMap;

    material.alphaMap = source.alphaMap;

    // material.envMap = source.envMap;
    // material.combine = THREE.MixOperation;
    material.reflectivity = 0.5;
    //material.specular.set(0xcccccc);
    material.refractionRatio = source.refractionRatio;

    material.wireframe = source.wireframe;
    material.wireframeLinewidth = source.wireframeLinewidth;
    material.wireframeLinecap = source.wireframeLinecap;
    material.wireframeLinejoin = source.wireframeLinejoin;

    material.skinning = source.skinning;
    material.morphTargets = source.morphTargets;
    material.morphNormals = source.morphNormals;

    return material;
  }
}
