/** @jsx createElementEntity */
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { CanvasTexture, DoubleSide, LinearFilter, MeshBasicMaterial, sRGBEncoding } from "three";
import { HubsWorld } from "../app";
import { loadPageJob } from "../bit-systems/pdf-system";
import { PDFResources } from "../inflators/pdf";
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";
import { EntityID } from "./networking-types";
import { Networked, NetworkedPDF, ObjectMenuTarget } from "../bit-components";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";
import { addComponent } from "bitecs";

function* createPDFResources(url: string): Generator<any, PDFResources, any> {
  const pdf = (yield getDocument(url).promise) as PDFDocumentProxy;
  const canvas = document.createElement("canvas");
  const canvasContext = canvas.getContext("2d")!;
  const texture = new CanvasTexture(canvas);
  texture.encoding = sRGBEncoding;
  texture.minFilter = LinearFilter;
  const material = new MeshBasicMaterial();
  material.map = texture;
  material.side = DoubleSide;
  material.transparent = false;
  return { pdf, canvas, canvasContext, material };
}

export function* loadPDF(world: HubsWorld, eid: EntityID, url: string, isNetworked: boolean) {
  const resources = yield* createPDFResources(url);
  const pageNumber = 1;
  const { width, height } = yield* loadPageJob(resources, pageNumber);

  ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;

  const pdfEid = renderAsEntity(
    world,
    <entity
      name="PDF"
      scale={[Math.min(1.0, width / height), Math.min(1.0, height / width), 1.0]}
      grabbable={{ cursor: true, hand: false }}
      objectMenuTarget={{ isFlat: true }}
      pdf={{ pageNumber, ...resources }}
    ></entity>
  );

  if (isNetworked) {
    addComponent(world, Networked, pdfEid);
    addComponent(world, NetworkedPDF, pdfEid);
    NetworkedPDF.pageNumber[pdfEid] = 1; // Must be a valid page number. (Zero is invalid.)
  }

  return pdfEid;
}
