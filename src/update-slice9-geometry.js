import { Slice9 } from "./bit-components";

export function updateSlice9Geometry(world, eid) {
  const geometry = world.eid2obj.get(eid).geometry;
  const pos = geometry.attributes.position.array;
  const uvs = geometry.attributes.uv.array;

  const [width, height] = Slice9.size[eid];
  const [top, bottom, left, right] = Slice9.insets[eid];

  /*
      0--1------------------------------2--3
      |  |                              |  |
      4--5------------------------------6--7
      |  |                              |  |
      |  |                              |  |
      |  |                              |  |
      8--9-----------------------------10--11
      |  |                              |  |
      12-13----------------------------14--15
    */
  function setPos(id, x, y) {
    pos[3 * id] = x;
    pos[3 * id + 1] = y;
  }

  function setUV(id, u, v) {
    uvs[2 * id] = u;
    uvs[2 * id + 1] = v;
  }

  // Update UVS
  // TODO hardcoded
  const textureHeight = 128;
  const textureWidth = 128;

  const uv = {
    left: left / textureWidth,
    right: right / textureWidth,
    top: top / textureHeight,
    bottom: bottom / textureHeight
  };

  setUV(1, uv.left, 1);
  setUV(2, uv.right, 1);

  setUV(4, 0, uv.bottom);
  setUV(5, uv.left, uv.bottom);
  setUV(6, uv.right, uv.bottom);
  setUV(7, 1, uv.bottom);

  setUV(8, 0, uv.top);
  setUV(9, uv.left, uv.top);
  setUV(10, uv.right, uv.top);
  setUV(11, 1, uv.top);

  setUV(13, uv.left, 0);
  setUV(14, uv.right, 0);

  // Update vertex positions
  const w2 = width / 2;
  const h2 = height / 2;
  const leftPadded = -w2 + 0.1;
  const rightPadded = w2 - 0.1;
  const topPadded = h2 - 0.1;
  const bottomPadded = -h2 + 0.1;

  setPos(0, -w2, h2);
  setPos(1, leftPadded, h2);
  setPos(2, rightPadded, h2);
  setPos(3, w2, h2);

  setPos(4, -w2, topPadded);
  setPos(5, leftPadded, topPadded);
  setPos(6, rightPadded, topPadded);
  setPos(7, w2, topPadded);

  setPos(8, -w2, bottomPadded);
  setPos(9, leftPadded, bottomPadded);
  setPos(10, rightPadded, bottomPadded);
  setPos(11, w2, bottomPadded);

  setPos(13, leftPadded, -h2);
  setPos(14, rightPadded, -h2);
  setPos(12, -w2, -h2);
  setPos(15, w2, -h2);

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
}
