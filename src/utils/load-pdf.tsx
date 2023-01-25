/** @jsx createElementEntity */
import { getDocument, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { HubsWorld } from "../app";
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";

export function* loadPDF(world: HubsWorld, url: string) {
  const pdf = (yield getDocument(url).promise) as PDFDocumentProxy;
  return renderAsEntity(
    world,
    <entity name="PDF" networked grabbable={{ cursor: true, hand: false }} pdf={{ pdf }}></entity>
  );
}
