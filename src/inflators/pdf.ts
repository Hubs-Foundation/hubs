import { addComponent, Types } from "bitecs";
import { PDFDocumentProxy } from "pdfjs-dist";
import { CanvasTexture, DoubleSide, LinearFilter, Mesh, sRGBEncoding } from "three";
import { HubsWorld } from "../app";
import { MediaPDF, Networked, NetworkedPDF } from "../bit-components";
import { addObject3DComponent } from "../utils/jsx-entity";
import { EntityID } from "../utils/networking-types";
import { createPlaneBufferGeometry } from "../utils/three-utils";

export interface PDFParams {
  pdf: PDFDocumentProxy;
}
export interface PDFComponent {
  pdf: PDFDocumentProxy;
  canvas: HTMLCanvasElement;
  texture: CanvasTexture;
  canvasContext: CanvasRenderingContext2D;
  page: number;
  isLoading: boolean;
}

export function inflatePDF(world: HubsWorld, eid: EntityID, params: PDFParams) {
  const canvas = document.createElement("canvas");
  const canvasContext = canvas.getContext("2d")!;
  const texture = new CanvasTexture(canvas);
  texture.encoding = sRGBEncoding;
  texture.minFilter = LinearFilter;
  const material = new THREE.MeshBasicMaterial();
  material.side = DoubleSide;
  material.transparent = false;
  const mesh = new Mesh(createPlaneBufferGeometry(1, 1, 1, 1, texture.flipY), material);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaPDF, eid);
  (MediaPDF.map as Map<EntityID, PDFComponent>).set(eid, {
    pdf: params.pdf,
    canvas,
    texture,
    canvasContext,
    page: -1, // No page is loaded yet
    isLoading: false
  });
  addComponent(world, Networked, eid);
  addComponent(world, NetworkedPDF, eid);
  NetworkedPDF.page[eid] = 1;
  return eid;
}
