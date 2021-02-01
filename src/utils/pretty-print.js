export function v3String(vec3) {
  return ["", vec3.x, vec3.y, vec3.z, ""].join("\n");
}
export function m4String(mat4) {
  function numString(n) {
    return `${n >= 0 ? " " : ""}${n.toFixed(2)}`;
  }
  return [
    "",
    "_".repeat(30),
    [0, 1, 2, 3].map(i => [0, 4, 8, 12].map(j => numString(mat4.elements[j + i])).join(" | ")).join("\n"),
    "‾".repeat(18),
    ""
  ].join("\n");
}

function traverseWithDepth({ object3D, depth = 0, callback, result }) {
  result.push(callback(object3D, depth));
  const children = object3D.children;
  for (let i = 0; i < children.length; i++) {
    traverseWithDepth({ object3D: children[i], depth: depth + 1, callback, result });
  }
  return result;
}

const describe = (function() {
  const prefix = "  ";
  return function describe(object3D, indentation) {
    const description = `${object3D.type} | ${object3D.name} | ${JSON.stringify(object3D.userData)}`;
    let firstBone = "";
    if (object3D.type === "SkinnedMesh") {
      firstBone = "\n"
        .concat(prefix.repeat(indentation))
        .concat("First bone id: ")
        .concat(object3D.skeleton.bones[0].uuid);
    }
    let boneId = "";
    if (object3D.type === "Bone") {
      boneId = "\n"
        .concat(prefix.repeat(indentation))
        .concat("Bone id: ")
        .concat(object3D.uuid);
    }

    return prefix
      .repeat(indentation)
      .concat(description)
      .concat(firstBone)
      .concat(boneId);
  };
})();

export function describeObject3D(root) {
  return traverseWithDepth({ object3D: root, callback: describe, result: [] }).join("\n");
}
window.describeObject3D = describeObject3D;
