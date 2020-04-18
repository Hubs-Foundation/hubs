import { System } from "ecsy";
import { Object3D, Parent } from "ecsy-three";
import { Image } from "../components/Image";
import { Loading } from "../components/Loading";
import { createImageTexture } from "../../utils/media-utils";
import { Mesh, PlaneBufferGeometry, MeshBasicMaterial, DoubleSide } from "three";

export class ImageSystem extends System {
  static queries = {
    images: {
      components: [Image],
      listen: {
        added: true
      }
    }
  };

  execute() {
    const added = this.queries.images.added;

    for (let i = 0; i < added.length; i++) {
      this.onLoad(added[i]);
    }
  }

  async onLoad(entity) {
    const image = entity.getMutableComponent(Image);

    const texture = await createImageTexture(image.src);

    const geometry = new PlaneBufferGeometry(1, 1, 1, 1, texture.flipY);
    const material = new MeshBasicMaterial({ map: texture, side: DoubleSide });

    if (image.contentType === "image/png") {
      material.transparent = true;
    }

    image.entity = this.world
      .createEntity()
      .addComponent(Parent, { value: entity })
      .addComponent(Object3D, { value: new Mesh(geometry, material) });

    entity.removeComponent(Loading);
  }
}
