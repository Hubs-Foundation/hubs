## intro
We use texture atlassing to improve rendering and loading efficiency. This document explains how to generate the spritesheets used by the SpriteSystem and the page's css.

## generating spritesheets

After installing the project dependencies, spritesheets can be generated with the command `npm run spritesheet`. The exact parameters used by this script can be inspected in the `package.json` where it is defined. More information about the tool we use, `spritesheet-js`, can be found on the [github page](https://github.com/mozillareality/spritesheet.js/).

The steps to generate a spritesheet are :

1. Move sprites you want in the sprite-system-spritesheet to `src/assets/images/sprites/`. 
1. Move sprites you want in the css-spritesheet to `src/assets/images/css-sprites/`. 
1. Type `npm run spritesheet`. This will generate
   `sprite-system-spritesheet.json` with `sprite-system-spritesheet.png` for the
   sprite system and
   `css-spritesheet.css` with `css-spritesheet.png` in the directory `src/assets/images/spritesheets/`.

## Notes

The name of the sprite that is used in the generated `json` file is the same as its source filename; When a sprite component has the name `foo.png`, the sprite system looks for that name in the `json` file. It does not use the `foo.png` source file.

The source images are exported from Figma. If you want to alter these images, it is probably best to do so in Figma, then re-export at the desired size. It is a good idea to stack all of the icons you want to export on top of one another in figma, because otherwise Figma produces surprisingly different results for similar icons when exporting at low resolution.
