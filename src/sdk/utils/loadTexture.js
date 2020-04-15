import { TextureLoader } from "three";
import { RethrownError } from "./errors";

// Texture loading function that returns a promise and uses the RethrownError class
export function loadTexture(src, textureLoader = new TextureLoader()) {
  return new Promise((resolve, reject) => {
    textureLoader.load(src, resolve, null, error => reject(new RethrownError(`Error loading texture "${src}"`, error)));
  });
}
