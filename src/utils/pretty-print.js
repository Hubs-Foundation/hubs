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
export function qString(q) {
  return ["", q.x, q.y, q.z, q.w, ""].join("\n");
}
if (new URL(location.href).hostname.indexOf("local") !== -1) {
  window.prettyPrint = {
    v3String,
    m4String,
    qString
  };
}
