import { System } from "ecsy";
import { Transform, Parent } from "ecsy-three";
import { Loading } from "../components/Loading";
import { LoadingCube } from "../components/LoadingCube";
import { GLTFLoader, GLTFAnimations } from "../components/GLTFLoader";
import loadingObjectSrc from "../../assets/models/LoadingObject_Atom.glb";

export class LoadingCubeSystem extends System {
  static queries = {
    entities: {
      components: [Loading, Transform],
      listen: {
        added: true,
        removed: true
      }
    }
  };

  execute() {
    const added = this.queries.entities.added;

    for (let i = 0; i < added.length; i++) {
      this.onAdded(added[i]);
    }

    const removed = this.queries.entities.removed;

    for (let i = 0; i < removed.length; i++) {
      this.onRemoved(removed[i]);
    }
  }

  onAdded(entity) {
    const loadingCube = this.world
      .createEntity()
      .addComponent(Parent, { value: entity })
      .addComponent(Transform)
      .addComponent(GLTFLoader, { src: loadingObjectSrc, playAnimations: GLTFAnimations.Loop });

    entity.addComponent(LoadingCube, { value: loadingCube });
  }

  onRemoved(entity) {
    const loadingCube = entity.getComponent(LoadingCube);

    if (loadingCube) {
      const loadingCubeEntity = loadingCube.value;
      loadingCubeEntity.remove();
      entity.removeComponent(LoadingCube);
    }
  }
}
