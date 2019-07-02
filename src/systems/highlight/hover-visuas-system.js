import vertexShader from "./highlight.vert";
import fragmentShader from "./highlight.frag";

export default class HoverVisualsSystem {
  constructor(scene) {
    const geometry = new THREE.BufferGeometry();

    this.meshes = [];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          hubs_Time: { value: 0 },
          hubs_SweepParams: { value: [0, 0] },

          hubs_HighlightInteractorOne: { value: false },
          hubs_InteractorOnePos: { value: [0, 0, 0] }
        }
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.matrixIsModified = true;
      mesh.visible = false;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  updateMesh(mesh, hand, time) {
    let meshToHighlight;
    const interactionSystem = AFRAME.scenes[0].systems.interaction;
    const interaction = interactionSystem.state[hand];
    const interactor = interactionSystem.options[hand].entity.object3D;
    const hideDueToPinning = false;

    if (
      (interaction.hovered && interaction.hovered.object3D && interaction.hovered.components["hoverable-visuals"]) ||
      (interaction.held && interaction.held.object3D && interaction.held.components["hoverable-visuals"])
    ) {
      (interaction.hovered || interaction.held).object3D.traverseVisible(o => {
        if (!o.isMesh) return;
        meshToHighlight = o;
      });
    }

    if (meshToHighlight) {
      mesh.visible = true;
      mesh.geometry = meshToHighlight.geometry;
      mesh.matrixWorld.copy(meshToHighlight.matrixWorld);

      const worldY = mesh.matrixWorld.elements[13];
      if (!meshToHighlight.geometry.boundingSphere) meshToHighlight.geometry.computeBoundingSphere();
      const scaledRadius = interaction.hovered.object3D.scale.y * meshToHighlight.geometry.boundingSphere.radius;
      mesh.material.uniforms.hubs_SweepParams.value[0] = worldY - scaledRadius;
      mesh.material.uniforms.hubs_SweepParams.value[1] = worldY + scaledRadius;

      mesh.material.uniforms.hubs_HighlightInteractorOne.value = !!interactor && !hideDueToPinning;
      mesh.material.uniforms.hubs_InteractorOnePos.value[0] = interactor.matrixWorld.elements[12];
      mesh.material.uniforms.hubs_InteractorOnePos.value[1] = interactor.matrixWorld.elements[13];
      mesh.material.uniforms.hubs_InteractorOnePos.value[2] = interactor.matrixWorld.elements[14];
    } else {
      mesh.visible = false;
    }

    mesh.material.uniforms.hubs_Time.value = time;
  }

  tick(time) {
    this.updateMesh(this.meshes[0], "rightRemote", time);
    this.updateMesh(this.meshes[1], "rightHand", time);
    this.updateMesh(this.meshes[2], "leftHand", time);
  }
}
