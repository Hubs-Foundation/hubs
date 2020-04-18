import { System } from "ecsy";
import { Object3D } from "ecsy-three";
import { GLTFModel } from "../components/GLTFModel";
import { GLTFLoader, GLTFAnimations } from "../components/GLTFLoader";
import { Animation } from "../components/Animation";
import { loadModel } from "../../components/gltf-model-plus";
import { AnimationMixer, LoopRepeat } from "three";

export class GLTFLoaderSystem extends System {
  static queries = {
    loaders: {
      components: [GLTFLoader],
      listen: {
        added: true
      }
    }
  };

  execute() {
    const added = this.queries.loaders.added;

    for (let i = 0; i < added.length; i++) {
      this.onLoad(added[i]);
    }
  }

  async onLoad(entity) {
    const loader = entity.getComponent(GLTFLoader);

    const gltf = await loadModel(loader.src);

    entity.addComponent(GLTFModel, { value: gltf });
    entity.addComponent(Object3D, { value: gltf.scene });

    if (gltf.animations) {
      const mixer = new AnimationMixer(gltf.scene);
      const actions = gltf.animations.map(clip => mixer.clipAction(clip));

      if (loader.playAnimations === GLTFAnimations.Loop) {
        actions.forEach(action => {
          action.enabled = true;
          action.setLoop(LoopRepeat, Infinity).play();
        });
      }

      entity.addComponent(Animation, { mixer, actions });
    }
  }
}
