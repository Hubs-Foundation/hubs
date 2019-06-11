## intro
In Hubs, we use texture atlassing to improve rendering efficiency. This document explains how to generate and use the spritesheet that is read by the SpriteSystem. 

Information about what spritesheets are and how to use them is outside the scope of this document, as there are many good resources about this on the web. 

## generate a spritesheet

After installing the project dependencies, the spritesheet can be generated with the command `npm run spritesheet`. The exact parameters used by this script can be inspected in the `package.json` where it is defined. More information about the tool we use, `spritesheet-js`, can be found on its [github page](https://github.com/krzysztof-o/spritesheet.js/).

The steps to generate a spritesheet are :

1. Move all the sprites you want to include in the spritesheet into `src/assets/images/sprites/`. 
1. Type `npm run spritesheet`. This will generate `sprite-system-spritesheet.json` and `sprite-system-spritesheet.png` in the directory `src/assets/images/spritesheets/`.

The name of the sprite that is used in the generated `json` file is the same as the name of original image file in `src/assets/images/sprites/`. Hence we refer to the image within a spritesheet by its associated filename. This may lead to some confusion, but should be clear when inspecting the `json` file.

Note for hubs devs: Most of the source images in `src/assets/images/sprites` were exported from Figma. If you want to alter these images, it is probably best to do so in Figma, then re-export at the desired size.

