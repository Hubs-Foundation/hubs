import { avatars } from "../assets/avatars/avatars.js";

const names = [
  "Baers-Pochard",
  "Baikal-Teal",
  "Barrows-Goldeneye",
  "Blue-Billed",
  "Blue-Duck",
  "Blue-Winged",
  "Brown-Teal",
  "Bufflehead",
  "Canvasback",
  "Cape-Shoveler",
  "Chestnut-Teal",
  "Chiloe-Wigeon",
  "Cinnamon-Teal",
  "Comb-Duck",
  "Common-Eider",
  "Common-Goldeneye",
  "Common-Merganser",
  "Common-Pochard",
  "Common-Scoter",
  "Common-Shelduck",
  "Cotton-Pygmy",
  "Crested-Duck",
  "Crested-Shelduck",
  "Eatons-Pintail",
  "Falcated",
  "Ferruginous",
  "Freckled-Duck",
  "Gadwall",
  "Garganey",
  "Greater-Scaup",
  "Green-Pygmy",
  "Grey-Teal",
  "Hardhead",
  "Harlequin",
  "Hartlaubs",
  "Hooded-Merganser",
  "Hottentot-Teal",
  "Kelp-Goose",
  "King-Eider",
  "Lake-Duck",
  "Laysan-Duck",
  "Lesser-Scaup",
  "Long-Tailed",
  "Maccoa-Duck",
  "Mallard",
  "Mandarin",
  "Marbled-Teal",
  "Mellers-Duck",
  "Merganser",
  "Northern-Pintail",
  "Orinoco-Goose",
  "Paradise-Shelduck",
  "Plumed-Whistler",
  "Puna-Teal",
  "Pygmy-Goose",
  "Radjah-Shelduck",
  "Red-Billed",
  "Red-Crested",
  "Red-Shoveler",
  "Ring-Necked",
  "Ringed-Teal",
  "Rosy-Billed",
  "Ruddy-Shelduck",
  "Salvadoris-Teal",
  "Scaly-Sided",
  "Shelduck",
  "Shoveler",
  "Silver-Teal",
  "Smew",
  "Spectacled-Eider",
  "Spot-Billed",
  "Spotted-Whistler",
  "Steamerduck",
  "Stellers-Eider",
  "Sunda-Teal",
  "Surf-Scoter",
  "Tufted-Duck",
  "Velvet-Scoter",
  "Wandering-Whistler",
  "Whistling-duck",
  "White-Backed",
  "White-Cheeked",
  "White-Winged",
  "Wigeon",
  "Wood-Duck",
  "Yellow-Billed"
];

function selectRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomName() {
  return `${selectRandom(names)}-${Math.floor(10000 + Math.random() * 10000)}`;
}

export const avatarIds = avatars.map(av => av.id);

export function generateDefaultProfile() {
  return {
    avatarId: selectRandom(avatarIds)
  };
}
