/** @jsx createElementEntity */
import * as pdfjs from "pdfjs-dist";
import { HubsWorld } from "../app";
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";

export function* loadPDF(world: HubsWorld, url: string) {
  const pdf = (yield pdfjs.getDocument(url).promise) as pdfjs.PDFDocumentProxy;

  // TODO Should we create the canvas texture here and load/render the first page?

  return renderAsEntity(
    world,
    <entity name="PDF" networked grabbable={{ cursor: true, hand: false }} pdf={{ pdf }}></entity>
  );
}
