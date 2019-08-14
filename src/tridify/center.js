import { Vector3 } from "three";

export function centerModel(scene) {
  const getNodes = (element, previous) => {
    if (element.childNodes.length <= 0) {
      return previous;
    } else {
      const list = [...previous];
      list.push(element);
      const arr = Array.from(element.childNodes)
        .map(el => getNodes(el, list))
        .flat();
      return Array.from(new Set(arr));
    }
  };

  // All inner nodes of scene-element
  const nodes = [];
  scene.childNodes.forEach(node => {
    getNodes(node, []).forEach(n => nodes.push(n));
  });

  const points = [];
  nodes.forEach(node => {
    node.object3D.traverse(mesh => {
      if (mesh.geometry && mesh.geometry.boundingBox) {
        const n = mesh.geometry.attributes.position.count;
        const arr = mesh.geometry.attributes.position.array;
        const pos = new Vector3().setFromMatrixPosition(mesh.matrixWorld);
        pos.y = 0;
        for (let i = 0; i < n; i++) {
          const x = arr[i * 3];
          const z = arr[i * 3 + 2];
          points.push(pos.clone().add(new Vector3(x, 0, z)));
        }
      }
    });
  });

  const average = (l, r, i) => {
    const x = l.x / (i + 1) + r.x;
    const y = l.y / (i + 1) + r.y;
    const z = l.z / (i + 1) + r.z;
    return new Vector3(x, y, z);
  };

  // Move whole scene to the average point of geometry
  const averagePoint = points.reduce(average);
  scene.setAttribute("position", averagePoint.clone().negate());
  // Bring Tridifys default environment back
  document.querySelector(".TridifyDefault").setAttribute("position", averagePoint);
}
