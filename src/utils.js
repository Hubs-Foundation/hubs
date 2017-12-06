const names = [
  "albattani",
  "allen",
  "almeida",
  "agnesi",
  "archimedes",
  "ardinghelli",
  "aryabhata",
  "austin",
  "babbage",
  "banach",
  "bardeen",
  "bartik",
  "bassi",
  "beaver",
  "bell",
  "benz",
  "bhabha",
  "bhaskara",
  "blackwell",
  "bohr",
  "booth",
  "borg",
  "bose",
  "boyd",
  "brahmagupta",
  "brattain",
  "brown",
  "carson",
  "chandrasekhar",
  "shannon",
  "clarke",
  "colden",
  "cori",
  "cray",
  "curran",
  "curie",
  "darwin",
  "davinci",
  "dijkstra",
  "dubinsky",
  "easley",
  "edison",
  "einstein",
  "elion",
  "engelbart",
  "euclid",
  "euler",
  "fermat",
  "fermi",
  "feynman",
  "franklin",
  "galileo",
  "gates",
  "goldberg",
  "goldstine",
  "goldwasser",
  "golick",
  "goodall",
  "haibt",
  "hamilton",
  "hawking",
  "heisenberg",
  "hermann",
  "heyrovsky",
  "hodgkin",
  "hoover",
  "hopper",
  "hugle",
  "hypatia",
  "jackson",
  "jang",
  "jennings",
  "jepsen",
  "johnson",
  "joliot",
  "jones",
  "kalam",
  "kare",
  "keller",
  "kepler",
  "khorana",
  "kilby",
  "kirch",
  "knuth",
  "kowalevski",
  "lalande",
  "lamarr",
  "lamport",
  "leakey",
  "leavitt",
  "lewin",
  "lichterman",
  "liskov",
  "lovelace",
  "lumiere",
  "mahavira",
  "mayer",
  "mccarthy",
  "mcclintock",
  "mclean",
  "mcnulty",
  "meitner",
  "meninsky",
  "mestorf",
  "minsky",
  "mirzakhani",
  "morse",
  "murdock",
  "neumann",
  "newton",
  "nightingale",
  "nobel",
  "noether",
  "northcutt",
  "noyce",
  "panini",
  "pare",
  "pasteur",
  "payne",
  "perlman",
  "pike",
  "poincare",
  "poitras",
  "ptolemy",
  "raman",
  "ramanujan",
  "ride",
  "montalcini",
  "ritchie",
  "roentgen",
  "rosalind",
  "saha",
  "sammet",
  "shaw",
  "shirley",
  "shockley",
  "sinoussi",
  "snyder",
  "spence",
  "stallman",
  "stonebraker",
  "swanson",
  "swartz",
  "swirles",
  "tesla",
  "thompson",
  "torvalds",
  "turing",
  "varahamihira",
  "visvesvaraya",
  "volhard",
  "wescoff",
  "wiles",
  "williams",
  "wilson",
  "wing",
  "wozniak",
  "wright",
  "yalow",
  "yonath"
];

export function generateName() {
  const name = names[Math.floor(Math.random() * names.length)];
  return name.replace(/^./, name[0].toUpperCase());
}

export function promptForName(username) {
  if (!username)
    username = generateName();
  
  do {
    username = prompt("Choose a username", username);
  } while (!(username && username.length));
  return username;
}

export function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

export function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
}

export function getSpawnPositionInCircle(originX, originZ, radius, rotation) {
  let x = originX + radius * Math.cos(rotation);
  let z = originZ + radius * Math.sin(rotation);

  return {x: x, z: z};
}

export function getRotationToTarget(eye, target) {
  let m4 = new THREE.Matrix4();
  eye = new THREE.Vector3(eye.x, eye.y, eye.z);
  target = new THREE.Vector3(target.x, target.y, target.z);
  m4.lookAt(eye, target, new THREE.Vector3(0,1,0));
  let euler = new THREE.Euler();
  euler.setFromRotationMatrix(m4, "YXZ");
  return {x: 0, y:(toDegrees(euler.y) + 360) % 360, z:0};
}

export function toDegrees(angle) {
  return angle * (180 / Math.PI);
}
