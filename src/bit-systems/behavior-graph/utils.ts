import { NodeCategory, NodeDefinition, NodeDefinitionsMap, NodeSpecJSON } from "@oveddan-behave-graph/core";

export function definitionListToMap(list: NodeDefinition[]): NodeDefinitionsMap {
  return list.reduce(function (o, node, _i) {
    o[node.typeName] = node;
    return o;
  }, {} as { [t: string]: NodeDefinition });
}

const skipExport = [
  "customEvent/onTriggered",
  "customEvent/trigger",
  "debug/expectTrue",
  "flow/sequence",
  "flow/waitAll"
];
export function cleanupNodespac(nodeSpec: NodeSpecJSON[]) {
  nodeSpec = nodeSpec.filter(node => {
    return !(
      node.type.startsWith("hubs/entity/set/") ||
      node.type.startsWith("flow/switch/") ||
      skipExport.includes(node.type)
    );
  });
  for (const node of nodeSpec) {
    let cat = node.category as string;
    if (cat === NodeCategory.Logic && node.type.endsWith("string")) {
      cat = "String Logic";
    }
    if (node.type.startsWith("debug/")) cat = "Debug";
    if (cat === NodeCategory.None) {
      if (node.type.startsWith("math/") && node.type.endsWith("float")) cat = "Float Math";
      else if (node.type.startsWith("math/") && node.type.endsWith("boolean")) cat = "Bool Math";
      else if (node.type.startsWith("math/") && node.type.endsWith("integer")) cat = "Int Math";
      else if (node.type.startsWith("math/") && node.type.endsWith("string")) cat = "String Math";
      else if (node.type.startsWith("logic/") && node.type.endsWith("string")) cat = "String Util";
      else {
        cat = node.type.split("/")[0];
        cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      }
    }
    node.category = cat as any;
    if (node.type === "math/and/boolean") node.label = "AND";
    else if (node.type === "math/or/boolean") node.label = "OR";
    else if (node.type.startsWith("math/negate")) node.label = "Negate";
    else if (node.type.startsWith("math/subtract")) node.label = "Subtract";
    else if (node.type === "hubs/entity/hasComponent") node.inputs[2].defaultValue = true;
    else if (node.type === "math/vec3/applyEuler") (node.inputs[0].defaultValue as any) = { x: 0, y: 0, z: 1 };
  }
  return nodeSpec;
}
