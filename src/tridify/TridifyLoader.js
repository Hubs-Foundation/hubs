import { getModelHash } from "./modelparams";

let urlParams;

export function setTridifyParams() {
  urlParams = getModelHash();
  console.log("Saved model hash: " + urlParams);
}

const defaultUrl = "iyN_Ip9hznKe0DVpD8uACqq-SuVaI0pzc33UkpbwzRE";
const baseUrl = "https://ws.tridify.com/api/shared/conversion";
const myUrl = () => `${baseUrl}/${urlParams || defaultUrl}`;
export const ifcData = [];
const parseGltfUrls = () => {
  return fetch(myUrl())
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      return myJson.ColladaUrls.filter(item => item.includes(".gltf")).filter(item => !item.includes("IfcSpace"));
    });
};

function checkIfModelLoaded(scene, count, goal) {
  if (count === goal) {
    window.APP.scene.emit("tridify-scene-loaded");
    console.log("Tridify Model Loaded");
  }
}

async function createModel(scene) {
  let readyCount = 0;
  parseGltfUrls().then(model => {
    model.forEach(url => {
      const element = document.createElement("a-entity");
      element.setAttribute("gltf-model-plus", { src: url, useCache: false, inflate: true });
      element.addEventListener("model-loaded", () => {
        console.log(`Loaded GLTF model from ${url}`);
        readyCount++;
        checkIfModelLoaded(scene, readyCount, model.length);
      });
      element.addEventListener("model-error", () => {
        console.log(`GLTF-model from : ${url} was unable to load`);
        readyCount++;
        checkIfModelLoaded(scene, readyCount, model.length);
      });

      scene.appendChild(element);
    });
  });
  return;
}

function createLights(objectsScene) {
  const element = document.createElement("a-light");
  element.setAttribute("type", "ambient");
  objectsScene.appendChild(element);
}

export async function getTridifyModel(objectsScene) {
  setTridifyParams();
  await parseIfc().then(getAllSlabsFromIfc);
  createLights(objectsScene);
  createModel(objectsScene);
}

const parseIfc = () => {
  return fetch(myUrl() + "/ifc")
    .then(function(response) {
      return response.json();
    })
    .then(function(myJson) {
      return myJson.ifc.decomposition;
    })
    .then(function(deco) {
      return deco.IfcProject.IfcSite.IfcBuilding.IfcBuildingStorey;
    });
};
function getAllSlabsFromIfc(ifcStoreys) {
  ifcStoreys.forEach(storey => {
    if (storey.IfcSlab) {
      // Ifc slab can be an array of objects or just one object
      if (storey.IfcSlab[0]) {
        storey.IfcSlab.forEach(element => {
          ifcData.push(element["@id"]);
        });
      } else {
        ifcData.push(storey.IfcSlab["@id"]);
      }
    }
  });
}
