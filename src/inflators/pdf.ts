import { addComponent } from "bitecs";
import { PDFDocumentProxy } from "pdfjs-dist";
import { Mesh, MeshBasicMaterial } from "three";
import { HubsWorld } from "../app";
import { MediaPDF } from "../bit-components";
import { PDFResourcesMap } from "../bit-systems/pdf-system";
import { addObject3DComponent } from "../utils/jsx-entity";
import { EntityID } from "../utils/networking-types";
import { createPlaneBufferGeometry } from "../utils/three-utils";

export interface PDFResources {
  pdf: PDFDocumentProxy;
  material: MeshBasicMaterial;
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
}

export interface PDFParams extends PDFResources {
  pageNumber: number;
}

export function inflatePDF(world: HubsWorld, eid: EntityID, params: PDFParams) {
  addObject3DComponent(
    world,
    eid,
    new Mesh(createPlaneBufferGeometry(1, 1, 1, 1, params.material.map!.flipY), params.material)
  );
  addComponent(world, MediaPDF, eid);
  PDFResourcesMap.set(eid, params);
  MediaPDF.pageNumber[eid] = 1;
  return eid;
}
