import { System } from "ecsy";
import { MeshEntity, SceneTag } from "ecsy-three";
import { BoxBufferGeometry, MeshBasicMaterial, Vector3, Euler } from "three";
import { Rotating } from "../components/Rotating";
import { MediaLoader } from "../components/MediaLoader";
import { Interactable } from "../components/Interactable";
import { Grabbable } from "../components/Grabbable";
import { PhysicsBody } from "../components/PhysicsBody";

export class InitSceneSystem extends System {
  static queries = {
    scenes: {
      components: [SceneTag],
      listen: {
        added: true
      }
    }
  };

  execute() {
    const added = this.queries.scenes.added;

    for (let i = 0; i < added.length; i++) {
      this.onInitScene(added[i]);
    }
  }

  onInitScene(scene) {
    const geometry = new BoxBufferGeometry();
    const material = new MeshBasicMaterial();
    scene.add(new MeshEntity(this.world, geometry, material).addComponent(Rotating));

    // this.world
    //   .createEntity()
    //   .addComponent(MediaLoader, {
    //     src:
    //       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Firefox_Logo,_2017.svg/1200px-Firefox_Logo,_2017.svg.png"
    //   })
    //   .addComponent(Parent, { value: scene })
    //   .addComponent(Transform, { position: new Vector3(0, 3, 0), rotation: new Euler() })
    //   .addComponent(Interactable)
    //   .addComponent(Grabbable)
    //   .addComponent(PhysicsBody);
  }
}
