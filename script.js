//RegisterListeners/ID
const button = document.getElementById("analyzeBtn");
const deleteBtn = document.getElementById("backspaceBtn");
const clearBtn = document.getElementById("clearHand");
const sortBtn = document.getElementById("sort");

button.addEventListener("click", analyzeHand);
document.getElementById("RichiYakuBuilder").style.display = "block";
document.getElementById("VariableInfo").style.display = "none";
document.getElementsByClassName("tablinks")[0].className += " active";
deleteBtn.addEventListener("click", removeLastTile);
clearBtn.addEventListener("click", clearHand);
sortBtn.addEventListener("click", SortHand);

//Global Variables
let counts = {};
let suits = { m: 0, p: 0, s: 0, z: 0 };
let totalPairs = 0;
let totalTriplets = 0;
let totalQuads = 0;
let terminalCount = 0;
let honorCount = 0;
let openHand = false;
let suggestions = [];
const tileHand = [];
let shanten = 0;
let btnContainer = document.getElementById("button-container");
let handContainer = document.getElementById("handTileHere");
const imageLinks = [
  ...pullImages("Man"),
  ...pullImages("Pin"),
  ...pullImages("Sou"),
  ...pullHonorImages(),
];

//Helpers
const SUITS = ["m", "p", "s"];
const DRAGONS = ["5z", "6z", "7z"];
const WINDS = ["1z", "2z", "3z", "4z"];

// Build recommendations for the current hand
function detectPotentialHands(tilesArray) {
  //Reset + Set Data
  openHand = document.getElementById("HandCheck").checked;
  resetVariables();
  setVariables(tilesArray);

  checkPinfu();
  checkIitsu();
  checkRyuuiisou();
  checkKokushiMusou();
  checkToitoi(); //Sankatsu + Suukatsu
  checkFlush();
  checkYakuhai();
  checkYakuhaiPlus();
  checkTanyao();
  checkChanta();
  checkSanshokuDoukou();
  checkSanshokuDoujun();
  checkConcealedTriplets();
  checkIipeikou(); // + Ryanpeikou

  checkClosedHand();

  // Keep Riichi as the final recommendation in the results list.
  if (!openHand) {
    suggestions.push(
      "<b>CLOSED:</b> Riichi: Keep your hand completely closed, focus on standard 1-2-3 runs, and call Riichi once ready.",
    );
  }

  return suggestions;
}

// Hand metrics and shanten calculation
function resetVariables() {
  //Clear it
  document.getElementById("output").innerHTML = "";
  document.getElementById("VariableInfo").innerHTML = "";
  suggestions = [];
  counts = {};
  suits = { m: 0, p: 0, s: 0, z: 0 };
  totalPairs = 0;
  totalTriplets = 0;
  totalQuads = 0;
  terminalCount = 0;
  honorCount = 0;
}

function setVariables(tilesArray) {
  // Map metrics directly to key-value pairs (e.g. counts["1m"] = 3)
  tilesArray.forEach((tile) => {
    counts[tile] = (counts[tile] || 0) + 1;
    const suit = tile[1];
    const num = Number(tile[0]);
    suits[suit]++;

    if (suit === "z") {
      honorCount++;
    }
    if (num === 1 || num === 9) {
      terminalCount++;
    }
  });

  // Clear loop that safely iterates flat object keys to find triplets
  Object.keys(counts).forEach((tile) => {
    if (counts[tile] === 2) totalPairs++;
    if (counts[tile] === 3) totalTriplets++;
    if (counts[tile] === 4) totalQuads++;
  });

  // Isolated search copy prevents loop overwrites
  let searchCounts = {
    m: Array(10).fill(0),
    p: Array(10).fill(0),
    s: Array(10).fill(0),
    z: Array(8).fill(0),
  };
  tilesArray.forEach((tile) => {
    const num = Number(tile[0]);
    const suit = tile[1];
    if (searchCounts[suit]) searchCounts[suit][num]++;
  });

  let maxSetsAndPairs = 0;
  function analyzeSuit(suitArr, index, sets, pairs) {
    if (index > 9) {
      const currentScore = sets * 2 + pairs;
      if (currentScore > maxSetsAndPairs) maxSetsAndPairs = currentScore;
      return;
    }
    if (suitArr[index] >= 3) {
      suitArr[index] -= 3;
      analyzeSuit(suitArr, index, sets + 1, pairs);
      suitArr[index] += 3;
    }
    if (
      index <= 7 &&
      suitArr[index] > 0 &&
      suitArr[index + 1] > 0 &&
      suitArr[index + 2] > 0
    ) {
      suitArr[index]--;
      suitArr[index + 1]--;
      suitArr[index + 2]--;
      analyzeSuit(suitArr, index, sets + 1, pairs);
      suitArr[index]++;
      suitArr[index + 1]++;
      suitArr[index + 2]++;
    }
    if (suitArr[index] >= 2) {
      suitArr[index] -= 2;
      analyzeSuit(suitArr, index, sets, pairs + 1);
      suitArr[index] += 2;
    }
    analyzeSuit(suitArr, index + 1, sets, pairs);
  }

  ["m", "p", "s", "z"].forEach((suit) => {
    analyzeSuit(searchCounts[suit], 1, 0, 0);
  });

  shanten = Math.min(8 - maxSetsAndPairs, 6 - totalPairs);

  return shanten;
}

// Match detector messages to the consistent labels stored in yakuTooltips.json.
const tooltipAliases = [
  ["Riichi", "Riichi"],
  ["Pure Straight", "Iitsu"],
  ["All Simples", "Tanyao"],
  ["Dragon Value", "Yakuhai"],
  ["Mixed Triple Sequence", "Sanshoku Doujun"],
  ["Triple Triplets", "Sanshoku Doukou"],
  ["All Triplets", "Toitoi"],
  ["Four Quads", "Suukantsu"],
  ["Three Quads", "Sankantsu"],
  ["Four Concealed Triplets", "Suuankou"],
  ["Three Concealed Triplets", "Sanankou"],
  ["Seven Pairs", "Chiitoitsu"],
  ["Half Flush", "Honitsu"],
  ["Full Flush", "Chinitsu"],
];

function getTooltipForRecommendation(recommendation) {
  const alias = tooltipAliases.find(([text]) => recommendation.includes(text));
  const name = alias ? alias[1] : recommendation.split(" hint:")[0];
  return (
    yakuTooltips.find((tooltip) => tooltip.name.startsWith(`${name} (`)) ||
    yakuTooltips.find((tooltip) =>
      recommendation.includes(tooltip.name.split(" (")[0]),
    )
  );
}

function renderRecommendation(recommendation) {
  const tooltip = getTooltipForRecommendation(recommendation);
  if (!tooltip) return `<br>- ${recommendation}`;

  return `<br>- <span title="${tooltip.hint}">${tooltip.name}</span>`;
}

// Parse input, calculate shanten, and render results
function analyzeHand() {
  // Read the selected input mode before parsing the hand.
  const inputType = document.getElementById("typeCheck").checked;
  const tilesArray = [];
  let hand;
  if (inputType === true) {
    // Turn 123m into 1m 2m 3m
    hand = document.getElementById("handInput").value;
    for (const [_, numbers, suit] of hand.matchAll(/([1-9]+)([mpsz])/g)) {
      for (const num of numbers) {
        tilesArray.push(num + suit);
      }
    }
  } else {
    hand = tileHand
      .map((fileName) =>
        fileName
          .substring(fileName.lastIndexOf("/") + 1)
          .replace(".png?raw=true", ""),
      )
      .join(",");
    const tileMap = {
      man: "m",
      pin: "p",
      sou: "s",
      ton: "1z",
      nan: "2z",
      shaa: "3z",
      pei: "4z", // Winds
      haku: "5z",
      hatsu: "6z",
      chun: "7z", // Dragons
    };
    hand.split(",").forEach((tile) => {
      // Matches "Man5", "Haku", etc., splitting the word and the optional number
      const match = tile.trim().match(/([a-z]+)(\d)?/i);
      if (!match) return;
      const [_, name, num] = match;
      const key = name.toLowerCase();
      if (tileMap[key]) {
        // If it has a number, append the letter (5m). If not, use the honor code (5z).
        if (num) {
          tilesArray.push(num + tileMap[key]);
        } else {
          tilesArray.push(tileMap[key]);
        }
      }
    });
  }

  //Exit if you dont have 13
  if (tilesArray.length !== 13) {
    document.getElementById("output").innerHTML =
      `Error: Enter exactly 13 tiles. This hand has ${tilesArray.length}.`;
    return;
  }

  //Parse Shanten + hand recs
  try {
    shanten = setVariables(tilesArray);
    const handRecommendations = detectPotentialHands(tilesArray);
    //Decide Shanten
    let statusMessage =
      shanten === 0
        ? "Tenpai! Your hand is ready. You just need 1 tile to win.\n"
        : `${shanten}-Shanten. You are ${shanten + 1} tiles away from completing your structure.`;

    // Replace raw detector messages with the matching JSON tooltip label.
    const listItems = handRecommendations.map(renderRecommendation).join("");
    //Set the output
    document.getElementById("output").innerHTML = `
            <b>YAKU OPTIONS</b>
             ${listItems} <br>
              <br><b>SHANTEN:</b>
             ${statusMessage}`;
    //Set the Variables
    document.getElementById("VariableInfo").innerHTML =
      `<br><b>VARIABLE INFO:</b> <br> 
           Parsed: ${JSON.stringify(tilesArray)}<br>
           You entered: ${hand}<br>
           OpenHand? ${openHand}<br>
           Suits:  m(${suits.m})   p(${suits.p})  s(${suits.s})<br>
           TotalPairs:${totalPairs}      Total Triplets:${totalTriplets}   Total Quads:${totalQuads}<br> 
           Terminal Count:${terminalCount}  HonorCount:${honorCount}<br>
           Shanten:${shanten}`;
    document.getElementById("handSummaryText").textContent = hand;
    document.getElementById("tileCount").textContent = tilesArray.length;
    setDrawerCollapsed(true);
  } catch (err) {
    document.getElementById("output").innerHTML =
      "Calculation Error: " + err.message;
  }
}

// Tile image URLs and tile-picker rendering
function pullImages(type) {
  let arrayLink = [];
  let string =
    "https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/26e127ba2117f45cdce5ea0225748cc0cfad3169/Export/Regular/";
  for (let i = 1; i <= 9; i++) {
    arrayLink.push(string + type + i + ".png?raw=true");
  }

  return arrayLink;
}

function pullHonorImages() {
  let arrayLink = [];
  let honorsArray = ["Ton", "Nan", "Shaa", "Pei", "Haku", "Hatsu", "Chun"];
  let string =
    "https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/26e127ba2117f45cdce5ea0225748cc0cfad3169/Export/Regular/";
  honorsArray.forEach((element) => {
    arrayLink.push(string + element + ".png?raw=true");
  });

  return arrayLink;
}

function createBtns(goal, container, array) {
  //Fix for pin5-Dora
  //Select the container on the page
  container.replaceChildren();
  array.forEach((url, index) => {
    const btn = document.createElement("button");
    btn.className = "img-btn";
    // Extract the file name to use as accessible alt text for screen readers
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    const img = document.createElement("img");
    let text = fileName.replace(".png?raw=true", "");
    let result = text.replace(/([a-zA-Z]+)(\d+)/, "$2$1"); // returns "1man"
    img.src = url;
    img.alt = fileName;
    btn.id = result;
    btn.appendChild(img);
    btn.addEventListener("click", () => {
      if (goal === "Add") {
        addTileString(url);
      }
      if (goal === "Remove") {
        removeClickedTile(index);
      }
    });
    container.appendChild(btn);
  });
}
createBtns("Add", btnContainer, imageLinks);
// Tile hand editing actions
function refreshHandSummary() {
  const formattedArray = tileHand.map((fileName) =>
    fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", ""),
  );
  const handText = formattedArray.length
    ? formattedArray.join(",")
    : "No tiles selected";

  document.getElementById("handSummaryText").textContent = handText;
  document.getElementById("tileCount").textContent = formattedArray.length;
}

function addTileString(tile) {
  let dupCheck = ValidateSingleTileMax(tileHand, tile);
  if (tileHand.length < 13 && !dupCheck) {
    tileHand.push(tile);
    createBtns("Remove", handContainer, tileHand);
    refreshHandSummary();
  }
}

//BackButton to delete items from queue
function removeLastTile() {
  tileHand.pop();
  createBtns("Remove", handContainer, tileHand);
  refreshHandSummary();
}

function removeClickedTile(index) {
  tileHand.splice(index, 1);
  createBtns("Remove", handContainer, tileHand);
  refreshHandSummary();
}

function clearHand() {
  tileHand.length = 0;
  createBtns("Remove", handContainer, tileHand);
  document.getElementById("handInput").value = "";
  refreshHandSummary();
  console.log("Hand Cleared");
}

function SortHand() {
  let sortedArray = tileHand.map((p) =>
    p.split("/").pop().replace(".png?raw=true", ""),
  );
  console.log("Before: " + sortedArray);

  // 1. Map out standard Mahjong suit/type group priority
  const suitOrder = { Man: 1, Pin: 2, Sou: 3, Haku: 4, Pei: 5 };

  // 1. Count the frequency of each clean tile value in the hand
  const tileCounts = {};
  sortedArray.forEach((tile) => {
    tileCounts[tile] = (tileCounts[tile] || 0) + 1;
  });
  // 2. Sort by Suit/Type Group first, then by numerical value, then by frequency
  sortedArray.sort((a, b) => {
    // Tier 1: Group by suit/type category order first
    let suitA = a.replace(/[0-9]/g, "");
    let suitB = b.replace(/[0-9]/g, "");

    if (suitOrder[suitA] !== suitOrder[suitB]) {
      let orderA = suitOrder[suitA] || 99;
      let orderB = suitOrder[suitB] || 99;
      return orderA - orderB;
    }

    // Tier 2: Sort numerically within that identical suit group (e.g., 7 before 8)
    let numA = parseInt(a.match(/\d+/)) || 0;
    let numB = parseInt(b.match(/\d+/)) || 0;
    if (numA !== numB) {
      return numA - numB;
    }

    // Tier 3: If it's the exact same tile (e.g., Man8 vs Man8), frequency keeps them side-by-side
    return tileCounts[b] - tileCounts[a];
  });
  const string =
    "https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/26e127ba2117f45cdce5ea0225748cc0cfad3169/Export/Regular/";
  let reverseArray = sortedArray.map((tile) => {
    // Reconstruct the exact URL using your base URL variable and suffix
    return string + tile + ".png?raw=true";
  });

  // FIX: Update the global source array to match the sorted results
  tileHand.length = 0;
  tileHand.push(...reverseArray);

  // 3. Update UI elements with the freshly mutated global state array
  createBtns("Remove", handContainer, tileHand);
  refreshHandSummary();
}

// Optional hand drawer controls
const hand = document.getElementById("currentHand");
const toggleButton = document.getElementById("toggleHand");
const drawer = document.getElementById("handDrawer");
const drawerContent = document.getElementById("handDrawerContent");

// Keep the drawer outside tab panels so it is always positioned against the viewport.
if (drawer && drawer.parentElement !== document.body) {
  document.body.appendChild(drawer);
}

function setDrawerCollapsed(isCollapsed) {
  if (!drawer || !toggleButton || !drawerContent) return;
  drawer.classList.toggle("collapsed", isCollapsed);
  toggleButton.textContent = isCollapsed ? "Expand" : "Collapse";
  toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
}

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    setDrawerCollapsed(!drawer.classList.contains("collapsed"));
  });
}

const floatingDiv = document.querySelector(".handDrawer");
const tabPanels = document.querySelectorAll(".tabcontent");

// Reserve space in every tab for the fixed drawer when it is open.
function fixOverlap() {
  if (floatingDiv) {
    const drawerHeight = `${floatingDiv.offsetHeight}px`;
    tabPanels.forEach((panel) => {
      panel.style.marginBottom = drawerHeight;
    });
    document.body.style.paddingBottom = drawerHeight;
  }
}
fixOverlap();
window.addEventListener("resize", fixOverlap);

// Tooltip content is kept separate from application logic for easier editing.
let yakuTooltips = [];
fetch("./yakuTooltips.json")
  .then((response) => {
    if (!response.ok)
      throw new Error(`Unable to load tooltips: ${response.status}`);
    return response.json();
  })
  .then((tooltips) => {
    const formattedTooltips = tooltips.map(({ name, condition, hint }) => ({
      name: `${name} (${condition})`,
      hint,
    }));
    const riichiTooltip = formattedTooltips.find((tooltip) =>
      tooltip.name.startsWith("Riichi ("),
    );
    const otherTooltips = formattedTooltips.filter(
      (tooltip) => tooltip !== riichiTooltip,
    );
    yakuTooltips = riichiTooltip
      ? [...otherTooltips, riichiTooltip]
      : otherTooltips;
  })
  .catch((error) => console.error(error));
