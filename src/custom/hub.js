

function getEbisusBayWebUrl() {
  const host = window.location.host
  console.log(window.location.host)
  if (host === "localhost:8080") {
    return "http://localhost:3000"
  }
  if (host === "metaverse.ebisusbay.biz") {
    return "https://app.ebisusbay.biz"
  }
  if (host === "metaverse.ebisusbay.com") {
    return "https://app.ebisusbay.com"
  }
  throw "Unable to resolve ebisusbay app URL.";
}

export function getEbisusBayApiUrl() {
  const host = window.location.host
  console.log(window.location.host)
  if (host === "localhost:8080") {
    return "https://api.ebisusbay.biz"
  }
  if (host === "metaverse.ebisusbay.biz") {
    return "https://api.ebisusbay.biz"
  }
  if (host === "metaverse.ebisusbay.com") {
    return "https://api.ebisusbay.com"
  }
  throw "Unable to resolve ebisusbay app URL.";
}


function openWeb3Overlay(auctionId) {
  // Timeout to avoid the overlay stealing the key up event and mixing up cursor system
  document.querySelector("#web3-overlay").onclick = sendCloseWeb3OverlayRequest;
  document.querySelector("#web3-overlay-close-button").onclick = sendCloseWeb3OverlayRequest;

  setTimeout(function() {
    // const url = getEbisusBayWebUrl() + "/auctions/" + auctionId;
    // const url = "./assets/images/custom/auction_mock.png";
    const web3IFrame = document.querySelector("#web3-iframe");
    // web3IFrame.className
    console.log("####### src = ", document.querySelector("#mock_auction_img").src);
    // web3IFrame.src = document.querySelector("#mock_auction_img").src;
    web3IFrame.src = "https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/62675306605735307680103560181868813150444485152825834265523622942535116128257";
    const web3Overlay = document.querySelector("#web3-overlay");
    web3Overlay.style.visibility = "visible";
  }, 200);
}



function sendCloseWeb3OverlayRequest() {
  window.postMessage("web3-overlay-close-request", "*");
}

window.sendCloseWeb3OverlayRequest = sendCloseWeb3OverlayRequest;

function closeWeb3Overlay() {
  const web3Overlay = document.querySelector("#web3-overlay");
  web3Overlay.style.visibility = "hidden";
  const web3IFrame = document.querySelector("#web3-iframe");
  web3IFrame.src = ""
}

function changeWeb3OverlayHeight(height) {
  const objectsScene = document.querySelector("#web3-iframe");
  objectsScene.style.height = height + "px";
}

export function loadCustomRoomObjects(auctionId, buttonOffsetPos, textOffsetPos, rotation, price) {
  console.log("Loading custom room objects...");
  try {
    CreateButton(auctionId, buttonOffsetPos);
    // CreateText(textOffsetPos, rotation, price);

  } catch (e) {
    console.error("Error loading custom room objects.", e);
  }
  console.log("Loaded custom room objects.");
}
function CreateText(offsetPos, rotation, price) {
  const objectsScene = document.querySelector("#objects-scene");
  const priceTextValue = document.createElement("a-entity");
  priceTextValue.setAttribute("text", "value: Bid Price: \\n\\n".concat(price).concat(" CRO; width:2; align:center;"));
  priceTextValue.setAttribute("text-raycast-hack");
  priceTextValue.setAttribute("position", offsetPos);
  priceTextValue.setAttribute("rotation", rotation);
  objectsScene.appendChild(priceTextValue);
}

function CreateButton(auctionId, offsetPos) {
  const objectsScene = document.querySelector("#objects-scene");
  const newEl = document.createElement("a-sphere");
  newEl.setAttribute("color", "red");
  newEl.setAttribute("is-remote-hover-target", "");
  newEl.setAttribute("radius", 0.75);
  newEl.setAttribute("position", offsetPos);
  newEl.setAttribute("tags", "singleActionButton: true;");
  newEl.classList.add("interactable");
  newEl.classList.add("ui");

  newEl.object3D.addEventListener("interact", function() { openWeb3Overlay(auctionId) });

  objectsScene.appendChild(newEl);
}

export function addWeb3OverlayEventListeners() {
  // Here "addEventListener" is for standards-compliant web browsers and "attachEvent" is for IE Browsers.
  const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  const eventFunction = window[eventMethod];
  const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

  // Listen to message from child IFrame window
  eventFunction(
    messageEvent,
    function(e) {
      console.log("Window message received: " + e.data);
      if (e.data === "web3-overlay-close-request") {
        closeWeb3Overlay();
      }
      if (e.data.startsWith("web3-overlay-change-height-request:")) {
        const heightString = e.data.substring("web3-overlay-change-height-request:".length);
        const height = parseInt(heightString);
        changeWeb3OverlayHeight(height);
      }
    },
    false
  );
}

addWeb3OverlayEventListeners();

export function autoAssignToRoom(rooms) {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("assignRoom") !== "true") {
    return;
  }

  rooms.sort((a, b) => a["name"].localeCompare(b["name"]));

  for (const room of rooms) {
    const maxUserCount = room["room_size"];
    const userInLobby = room["lobby_count"];
    const usersInRoom = room["member_count"];
    const roomUrl = room["url"];
    console.log(JSON.stringify(room));
    if (usersInRoom + userInLobby < maxUserCount) {
      window.location = roomUrl;
      break;
    }
  }
}
