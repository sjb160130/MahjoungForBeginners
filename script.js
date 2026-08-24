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
  ...pullHonorImages()
];

//Helpers
const SUITS = ["m", "p", "s"];
const DRAGONS = ["5z", "6z", "7z"];
const WINDS = ["1z", "2z", "3z", "4z"];

//Suggestion Pass
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

  //Richi
  if (!openHand) {
    suggestions.push(
      "<b>CLOSED:</b> Riichi: Keep your hand completely closed, focus on standard 1-2-3 runs, and call Riichi once ready."
    );
  }
  checkClosedHand();

  return suggestions;
}

//Yaku Checks----------------------------------
function checkPinfu() {
  // Pinfu requires a closed hand
  if (openHand) return;
  // Cannot have triplets or quads
  if (totalTriplets > 0 || totalQuads > 0) return;

  // Count honor pairs (dragons/winds)
  let honorPairs = 0;
  WINDS.concat(DRAGONS).forEach((tile) => {
    if (counts[tile] >= 2) {
      honorPairs++;
    }
  });
  // Honor pair blocks Pinfu
  if (honorPairs > 0) return;
  // Need mostly sequence-friendly tiles
  let connectedTiles = 0;

  for (let suit of SUITS) {
    for (let i = 1; i <= 9; i++) {
      if (counts[i + suit]) {
        if (counts[i - 1 + suit] || counts[i + 1 + suit]) {
          connectedTiles++;
        }
      }
    }
  }
  if (connectedTiles >= 8) {
    suggestions.push(
      "Pinfu hint: Your closed hand is forming mostly sequences. Avoid triplets and keep flexible two-sided waits."
    );
  }
}

function checkIitsu() {
  // Iitsu only works with numbered suits
  for (let suit of SUITS) {
    let runs = {
      123: false,
      456: false,
      789: false
    };

    // Check if each sequence exists
    if (
      counts["1" + suit] > 0 &&
      counts["2" + suit] > 0 &&
      counts["3" + suit] > 0
    ) {
      runs["123"] = true;
    }

    if (
      counts["4" + suit] > 0 &&
      counts["5" + suit] > 0 &&
      counts["6" + suit] > 0
    ) {
      runs["456"] = true;
    }

    if (
      counts["7" + suit] > 0 &&
      counts["8" + suit] > 0 &&
      counts["9" + suit] > 0
    ) {
      runs["789"] = true;
    }

    let completedRuns = Object.values(runs).filter(Boolean).length;
    // Two thirds complete
    if (completedRuns >= 2) {
      suggestions.push(
        `Pure Straight (Iitsu) hint: You already have two sections of a 123-456-789 straight in ${suit}. Consider completing the missing section.`
      );
    }
    // Early potential
    else {
      let straightTiles = 0;

      for (let i = 1; i <= 9; i++) {
        if (counts[i + suit]) {
          straightTiles++;
        }
      }
      if (straightTiles >= 6) {
        suggestions.push(
          `Pure Straight (Iitsu) hint: Your ${suit} suit has many connected tiles. A 123-456-789 straight may be possible.`
        );
      }
    }
  }
}

function checkRyuuiisou() {
  const greenTiles = ["2s", "3s", "4s", "6s", "8s", "6z"];

  let totalTiles = 0;
  let greenCount = 0;
  Object.keys(counts).forEach((tile) => {
    if (counts[tile] > 0) {
      totalTiles += counts[tile];
      if (greenTiles.includes(tile)) {
        greenCount += counts[tile];
      }
    }
  });

  // Complete green hand
  if (greenCount === totalTiles) {
    suggestions.push(
      "Ryuuiisou hint: Your hand contains only green tiles. Keep the hand focused on the All Green Yakuman."
    );
  }

  // Strong possibility
  else if (greenCount >= 9) {
    suggestions.push(
      `Ryuuiisou hint: ${greenCount}/${totalTiles} tiles are green. Consider keeping bamboo groups and Green Dragons.`
    );
  }

  // Early consideration
  else if (greenCount >= 7) {
    suggestions.push(
      "Ryuuiisou hint: Many green tiles are present. A bamboo-only Yakuman route may be possible."
    );
  }
}

function checkKokushiMusou() {
  const kokushiTiles = [
    "1m",
    "9m",
    "1p",
    "9p",
    "1s",
    "9s",
    ...WINDS,
    ...DRAGONS
  ];
  let uniqueTiles = countUniqueTiles(kokushiTiles);
  let hasPair = kokushiTiles.some((tile) => counts[tile] >= 2);

  if (uniqueTiles === 13) {
    if (hasPair) {
      suggestions.push(
        "Kokushi Musou (Thirteen Orphans): Complete! Stay closed and aim for the Yakuman."
      );
    } else {
      suggestions.push(
        "Kokushi Musou hint: You have all 13 unique terminal and honor tiles. Look for any duplicate to complete the hand."
      );
    }
  } else if (uniqueTiles >= 10) {
    suggestions.push(
      `Kokushi Musou hint: ${uniqueTiles}/13 terminal and honor tiles found. This hand is a strong candidate for a Kokushi route. Avoid building normal sequences.`
    );
  } else if (uniqueTiles >= 8) {
    suggestions.push(
      `Kokushi Musou hint: ${uniqueTiles}/13 terminal and honor tiles found. Consider a Kokushi pivot if your middle tiles are not forming well.`
    );
  }
}

function checkIipeikou() {
  // Requires closed hand
  if (openHand) return;
  let duplicateRuns = countDuplicateRuns();
  // Ryanpeikou exception
  if (duplicateRuns >= 2) {
    suggestions.push(
      "Ryanpeikou hint: You have two sets of identical sequences forming. Stay closed and prioritize completing the four identical runs."
    );
    return;
  }
  // Normal Iipeikou
  if (duplicateRuns === 1) {
    suggestions.push(
      "Iipeikou hint: You have two identical sequences forming. Keep your hand closed to preserve this yaku."
    );
  }
}

function checkTanyao() {
  let terminalHonor = getOutsideTileCount();
  if (terminalHonor === 0) {
    suggestions.push(
      "All Simples (Tanyao): Your hand has no terminals or honors. Keep 2-8 tiles and avoid outside tiles."
    );
  }
  // Good pivot opportunity
  else if (terminalHonor <= 3) {
    suggestions.push(
      `All Simples (Tanyao): Low terminal/honor count (${terminalHonor}). Consider discarding 1s, 9s, and honors.`
    );
  }
}

function checkChanta() {
  let outsideTiles = getOutsideTileCount();
  let terminalHonorGroups = 0;

  // Count pairs/triplets of outside tiles
  Object.keys(counts).forEach((tile) => {
    let num = tile[0];
    let suit = tile[1];

    if (suit === "z" || num === "1" || num === "9") {
      if (counts[tile] >= 2) terminalHonorGroups++;
    }
  });

  // Honroutou: only terminals/honors
  if (outsideTiles >= 9 && terminalHonorGroups >= 3) {
    suggestions.push(
      "Honroutou potential: Many terminal/honor groups. Consider an all outside triplet hand."
    );
  }

  // Junchan: terminals, no honors
  if (honorCount === 0 && terminalCount >= 6) {
    suggestions.push(
      "Junchan potential: No honors and many terminals. Build every group around 1s and 9s."
    );
  }

  // Chanta: terminals/honors + sequences
  if (outsideTiles >= 6 && terminalHonorGroups >= 1) {
    suggestions.push(
      "Chanta potential: Keep terminals/honors and build sequences containing outside tiles."
    );
  }

  // Tsuuiisou: all honors
  if (honorCount >= 9 && terminalCount <= 3) {
    suggestions.push(
      "Tsuuiisou potential: Honor-only hand. Keep honor pairs and triplets."
    );
  }

  // Chinroutou: all terminals
  if (terminalCount >= 9 && honorCount === 0) {
    suggestions.push(
      "Chinroutou potential: Terminal-only hand. Keep 1s and 9s."
    );
  }
}

function checkConcealedTriplets() {
  // Must be a closed hand
  if (openHand) return;
  // Suuankou: 3 triplets + a pair (or better)
  if (totalTriplets >= 3 && totalPairs >= 1) {
    suggestions.push(
      "Four Concealed Triplets (Suuankou): Rare opportunity! Stay closed and try to complete one more concealed triplet."
    );
  }
  // Sanankou: 2 triplets + a pair
  if (totalTriplets >= 2 && totalPairs >= 1) {
    suggestions.push(
      "Three Concealed Triplets (Sanankou): Keep your hand closed and aim to complete another triplet."
    );
  }
}

function checkSanshokuDoukou() {
  for (let i = 1; i <= 9; i++) {
    let score = 0;
    if (counts[i + "m"] >= 2) score++;
    if (counts[i + "p"] >= 2) score++;
    if (counts[i + "s"] >= 2) score++;
    if (score >= 2) {
      suggestions.push(
        `Triple Triplets (Sanshoku Doukou): Multiple ${i}'s are forming across suits. Consider keeping pairs and calling Pon if needed to create three pons.`
      );
    }
  }
}

function checkSanshokuDoujun() {
  for (let i = 1; i <= 7; i++) {
    let score = 0;
    for (let suit of SUITS) {
      if (counts[i + suit]) score++;
      if (counts[i + 1 + suit]) score++;
      if (counts[i + 2 + suit]) score++;
    }
    if (score >= 7) {
      suggestions.push(
        `Mixed Triple Sequence (Sanshoku Doujun): You're close to matching the ${i}${i + 1}${i + 2} sequence in all three suits.`
      );
    }
  }
}

function checkToitoi() {
  //Toitoi
  if (totalTriplets >= 3 || totalPairs >= 4) {
    //Toitoi
    suggestions.push(
      "All Triplets (Toitoi): Strongly viable. Look to open your hand using 'Pon' when tiles match."
    );
  }
  // Sankantsu / Suukantsu Check
  const totalMeldTriplets = totalTriplets + totalQuads;
  if (totalQuads === 3) {
    suggestions.push(
      "Four Quads (Suukantsu): TENPAI! You have 3 Quads completed. Call 'Kan' on one more set to secure a Yakuman."
    );
  } else if (totalQuads === 2 && totalMeldTriplets >= 3) {
    suggestions.push(
      "Three Quads (Sankantsu): Strongly viable. Hunt down your third Kan. Bonus: Get a fourth Kan for Suukantsu Yakuman!"
    );
  }
}

function checkClosedHand() {
  if (!openHand) {
    //Chiitoitsu
    if (totalPairs >= 4) {
      //Chiitoitsu
      suggestions.push(
        "<b>CLOSED:</b> Seven Pairs (Chiitoitsu): Strongly viable. Avoid grouping cards into sequences; hold duplicates."
      );
    }
    //Menzen Tsumo
    if (shanten === 0) {
      suggestions.push(
        "<b>CLOSED:</b> Menzen Tsumo: Your hand is ready. You need to draw the last tile to win ."
      );
    }
  }
}

function checkFlush() {
  let numSuits = ["m", "p", "s"].filter((s) => suits[s] > 0).length;
  if (numSuits === 1) {
    if (suits.z > 0) {
      suggestions.push("Half Flush (Honitsu): Keep your main suit and honors.");
    }
    //Check if suit is green
    else {
      suggestions.push(
        "Full Flush (Chinitsu): Remove other suits. And pick up no honors"
      );
    }
  }
  //Iitsu - check for 1-9 of each suite
}

function checkYakuhai() {
  // Yakuhai Check
  DRAGONS.forEach((dragon) => {
    if (hasCopies(dragon, 3)) {
      suggestions.push(
        `Dragon Value (Yakuhai): You have a triplet of ${getDragonName(dragon)} Dragons for an easy score multiplier.\n`
      );
    } else if (hasCopies(dragon, 2)) {
      suggestions.push(
        `Dragon Value (Yakuhai): Hold your pair of ${getDragonName(dragon)} Dragons to complete a triplet.\n`
      );
    }
  });
}

function checkYakuhaiPlus() {
  const dragons = countSets(DRAGONS);
  const winds = countSets(WINDS);

  // Daisangen (Big Three Dragons)
  if (dragons.triplets === 3) {
    suggestions.push(
      "Big Three Dragons (Daisangen): You have all three dragon triplets!"
    );
  }
  // Shousangen (Little Three Dragons)
  else if (dragons.triplets === 2 && dragons.pairs === 1) {
    suggestions.push(
      "Little Three Dragons (Shousangen): Keep your dragon pair to complete the third triplet."
    );
  }
  // Daisuushi (Big Four Winds)
  if (winds.triplets === 4) {
    suggestions.push(
      "Big Four Winds (Daisuushi): You have all four wind triplets!"
    );
  }
  // Shousuushi (Little Four Winds)
  else if (winds.triplets === 3 && winds.pairs === 1) {
    suggestions.push(
      "Little Four Winds (Shousuushi): Keep your wind pair to complete the fourth triplet."
    );
  }
}
//Yaku Checks----------------------------------

//Variable Management
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
    const num = parseInt(tile[0]);
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
    z: Array(8).fill(0)
  };
  tilesArray.forEach((tile) => {
    const num = parseInt(tile[0]);
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

// Analyze hand
function analyzeHand() {
  //Check Close or not
  if (window.matchMedia("(max-width: 700px)").matches){
    console.log("Checkmate");
    document.getElementById("currentHand").classList.toggle("closed");
  }
  //Set Variables
  const inputType = document.getElementById("typeCheck").checked;
  const tilesArray = [];
  let hand;
  let match;

  if (inputType === true) {
    // Turn 123m into 1m 2m 3m
    hand = document.getElementById("handInput").value;
    for (const [_, numbers, suit] of hand.matchAll(/([1-9]+)([mpsz])/g)) {
      for (const num of numbers) {
        tilesArray.push(num + suit);
      }
    }
  } else {
    const hand = document.getElementById("handValueLabel").textContent;
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
      chun: "7z" // Dragons
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

    // Map recommendations out to a bulleted list layout
    const listItems = handRecommendations
      .map((item) => `<br>- ${item}`)
      .join("");
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
  } catch (err) {
    document.getElementById("output").innerHTML =
      "Calculation Error: " + err.message;
  }
}

//Tabsystem
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

//Toggle System
function toggleTab() {
  let element = document.getElementById("VariableInfo");
  if (element) {
    if (element.style.display === "block") {
      element.style.display = "none";
    } else {
      element.style.display = "block";
    }
  }
}

//Toggle Visibility
function toggleVisibility(isTrue, targetName) {
  if (isTrue) {
    targetName.style.display = "block"; // Show
  } else {
    targetName.style.display = "none"; // Hide
  }
}
const toggle = document.getElementById("typeCheck");
const typeBox = document.getElementById("typeTab");
const tapBox = document.getElementById("tapTab");
/*toggle.addEventListener("change", function () {
  toggleVisibility(this.checked, typeBox);
  toggleVisibility(!this.checked, tapBox);
});*/
typeBox.style.display = "none";
tapBox.style.display = "block";

//Button Creation---------------------------
//Pull images
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
    let finalResult = result.slice(0, 2); // returns "1m"
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
//Button Creation---------------------------

//Tap Tile Functionality---------------------------
//Funciton onclick to add
function addTileString(tile) {
  let dupCheck = ValidateSingleTileMax(tileHand, tile);
  if (tileHand.length < 13 && !dupCheck) {
    tileHand.push(tile);
    const formattedArray = tileHand.map((fileName) => {
      let text = fileName
        .substring(fileName.lastIndexOf("/") + 1)
        .replace(".png?raw=true", "");
      return text;
    });
    document.getElementById("handValueLabel").innerHTML = formattedArray.join();
    createBtns("Remove", handContainer, tileHand);
    document.getElementById("tileCount").textContent = formattedArray.length;
  }
}

//BackButton to delete items from queue
function removeLastTile() {
  tileHand.pop();
  createBtns("Remove", handContainer, tileHand);
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML = formattedArray;
  document.getElementById("tileCount").textContent = formattedArray.length;
}

function removeClickedTile(index) {
  tileHand.splice(index, 1);
  createBtns("Remove", handContainer, tileHand);
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML = formattedArray;
  document.getElementById("tileCount").textContent = formattedArray.length;
}

function clearHand() {
  tileHand.length = 0;
  createBtns("Remove", handContainer, tileHand);
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML = formattedArray;
  document.getElementById("tileCount").textContent = formattedArray.length;
  console.log("Hand Cleared");
}

function SortHand() {
  let sortedArray = tileHand.map((p) =>
    p.split("/").pop().replace(".png?raw=true", "")
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
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML =
    formattedArray.join(", ");
  document.getElementById("tileCount").textContent = formattedArray.length;
}

//Tap Tile Functionality---------------------------

//DupCheck
//checks how many of a given tile  in Hand
function CheckNumberOfTiles(Hand, tile) {
  let NumInHand = 0;
  for (let x of Hand) {
    if (x === tile) {
      NumInHand++;
    }
  }
  return NumInHand;
}
//Checks every tile against every other tile
//returns false if any tile has more than 4 tiles.
//Returns true if 4 or less of any tiles
function ValidateMaxTileLimit(Hand) {
  for (let x of Hand) {
    if (CheckNumberOfTiles(Hand, x) === 4) {
      return false;
    }
  }
  return true;
}

function ValidateSingleTileMax(Hand, Tile) {
  return CheckNumberOfTiles(Hand, Tile) === 4;
}

//Helper Functions
function getOutsideTileCount() {
  return terminalCount + honorCount;
}

function getDragonName(tile) {
  if (tile === "5z") return "White";
  if (tile === "6z") return "Green";
  if (tile === "7z") return "Red";
}

function countSets(tileList) {
  let triplets = 0;
  let pairs = 0;
  tileList.forEach((tile) => {
    if (counts[tile] >= 3) triplets++;
    else if (counts[tile] === 2) pairs++;
  });
  return {
    triplets,
    pairs
  };
}

function hasCopies(tile, amount) {
  return (counts[tile] || 0) >= amount;
}

function countUniqueTiles(tileList) {
  let count = 0;
  tileList.forEach((tile) => {
    if (counts[tile] > 0) count++;
  });
  return count;
}

function countDuplicateRuns() {
  let duplicateRuns = 0;
  for (let suit of SUITS) {
    for (let start = 1; start <= 7; start++) {
      if (
        hasCopies(start + suit, 2) &&
        hasCopies(start + 1 + suit, 2) &&
        hasCopies(start + 2 + suit, 2)
      ) {
        duplicateRuns++;
      }
    }
  }
  return duplicateRuns;
}

//Bottom Container
const hand = document.getElementById("currentHand");
const toggleButton = document.getElementById("toggleHand");
toggleButton.onclick = () => {
  hand.classList.toggle("closed");
  toggleButton.textContent = !hand.classList.contains("closed") ? "▼" : "▲";
};


const floatingDiv = document.querySelector('.handDrawer');
const textWrapper = document.querySelector('.tabcontent');

// Create a reusable function to update the spacing
function fixOverlap() {
  textWrapper.style.marginBottom = floatingDiv.offsetHeight + 'px';
}
// Run it immediately on page load
fixOverlap();
// Optional: Run it on window resize if the div changes size on mobile
window.addEventListener('resize', fixOverlap);

// Yaku Tooltip List
const yakuTooltips = [
  {
    name: "Iipeikou",
    condition:
      "Closed hand with duplicate tiles that can form the same sequence twice.",
    hint: "Keep this suit closed and avoid calling. Duplicate runs are valuable for Iipeikou."
  },

  {
    name: "Tanyao (All Simples)",
    condition:
      "Hand contains mostly 2-8 tiles with few or no terminals and honors.",
    hint: "Discard 1s, 9s, and honors. Focus on building fast sequences."
  },

  {
    name: "Honroutou (All Terminals & Honors)",
    condition: "Many terminal and honor pairs/triplets are present.",
    hint: "Avoid sequences. Keep 1s, 9s, and honors to build a triplet-based hand."
  },

  {
    name: "Junchan (Pure Outside Hand)",
    condition: "No honors and every group can contain a terminal tile.",
    hint: "Build around 1s and 9s while avoiding middle-only sequences."
  },

  {
    name: "Chanta (Mixed Outside Hand)",
    condition:
      "Groups contain terminals or honors, with at least one sequence possible.",
    hint: "Keep outside tiles and build sequences like 123 or 789."
  },

  {
    name: "Tsuuiisou (All Honors)",
    condition: "Hand contains only honor tiles.",
    hint: "Keep honor pairs and triplets. Avoid discarding valuable honors."
  },

  {
    name: "Chinroutou (All Terminals)",
    condition: "Hand contains only terminal tiles (1s and 9s).",
    hint: "Keep terminal triplets and avoid forming normal sequences."
  },

  {
    name: "Suuankou (Four Concealed Triplets)",
    condition: "Closed hand with three concealed triplets and a pair.",
    hint: "Stay closed and continue collecting triplets for the Yakuman."
  },

  {
    name: "Sanankou (Three Concealed Triplets)",
    condition: "Closed hand with multiple concealed triplets forming.",
    hint: "Avoid calling and try to complete another concealed triplet."
  },

  {
    name: "Sanshoku Doukou (Triple Triplets)",
    condition:
      "The same number appears as pairs/triplets across multiple suits.",
    hint: "Keep matching numbers and consider Pon to complete three triplets."
  },

  {
    name: "Sanshoku Doujun (Mixed Triple Sequence)",
    condition: "The same sequence exists or is close in all three suits.",
    hint: "Keep tiles that complete the same run across suits."
  },

  {
    name: "Toitoi (All Triplets)",
    condition:
      "Hand contains several pairs or triplets with few useful sequences.",
    hint: "Consider calling Pon and convert pairs into triplets."
  },

  {
    name: "Sankantsu (Three Quads)",
    condition: "Hand already contains multiple Kans.",
    hint: "Look for another Kan to increase value and approach Suukantsu."
  },

  {
    name: "Suukantsu (Four Quads)",
    condition: "Hand has three completed Kans and is close to a fourth.",
    hint: "Continue collecting Kan opportunities for the Yakuman."
  },

  {
    name: "Chiitoitsu (Seven Pairs)",
    condition: "Closed hand with many separate pairs.",
    hint: "Do not combine pairs into sequences. Keep duplicate tiles."
  },

  {
    name: "Menzen Tsumo",
    condition: "Closed hand reaches tenpai.",
    hint: "Stay closed and wait for your winning draw."
  },

  {
    name: "Honitsu (Half Flush)",
    condition: "Most tiles belong to one suit plus possible honors.",
    hint: "Keep your main suit and discard unrelated suits."
  },

  {
    name: "Chinitsu (Full Flush)",
    condition: "All numbered tiles come from one suit with no honors.",
    hint: "Remove other suits and commit fully to one suit."
  },

  {
    name: "Yakuhai (Dragon)",
    condition: "A dragon triplet is formed or a dragon pair is close.",
    hint: "Keep dragon tiles because they provide guaranteed value."
  },

  {
    name: "Daisangen (Big Three Dragons)",
    condition: "All three dragon triplets are completed.",
    hint: "Protect your dragon sets and continue toward the Yakuman."
  },

  {
    name: "Shousangen (Little Three Dragons)",
    condition: "Two dragon triplets and one dragon pair are present.",
    hint: "Keep the dragon pair and complete the final triplet."
  },

  {
    name: "Daisuushi (Big Four Winds)",
    condition: "All four wind triplets are completed.",
    hint: "Protect your wind sets and continue toward the Yakuman."
  },

  {
    name: "Shousuushi (Little Four Winds)",
    condition: "Three wind triplets and one wind pair are present.",
    hint: "Keep the wind pair and complete the final triplet."
  },

  {
    name: "Ryuuiisou (All Green)",
    condition:
      "Hand contains only green tiles: 2s, 3s, 4s, 6s, 8s, and Green Dragons.",
    hint: "Keep green bamboo tiles and Green Dragons. Avoid unrelated tiles."
  },

  {
    name: "Kokushi Musou (Thirteen Orphans)",
    condition: "Closed hand collecting all 13 terminal and honor tile types.",
    hint: "Stop building sequences. Collect unique terminals and honors."
  },

  {
    name: "Kokushi Musou Tenpai",
    condition:
      "All 13 terminal and honor types are present but missing the pair.",
    hint: "Any duplicate terminal or honor completes the Yakuman."
  },

  {
    name: "Iitsu (Pure Straight)",
    condition: "Same suit contains 123, 456, and 789 sequences.",
    hint: "Keep this suit and complete the missing section of the straight."
  },

  {
    name: "Iitsu Potential",
    condition:
      "One suit contains many connected tiles that can become 123-456-789.",
    hint: "Consider focusing on this suit and keeping connected tiles."
  },

  {
    name: "Iipeikou (Pure Double Sequence)",
    condition:
      "Closed hand with two identical sequences (example: 2m3m4m + 2m3m4m).",
    hint: "Keep the hand closed and protect duplicate sequences. Avoid calling Chi because this removes the yaku."
  },

  {
    name: "Ryanpeikou (Twice Pure Double Sequence)",
    condition:
      "Closed hand containing two separate pairs of identical sequences (two Iipeikou patterns).",
    hint: "Prioritize completing matching sequences. Stay closed because this high-value hand is lost with calls."
  },

  {
    name: "Pinfu (All Sequences)",
    condition:
      "Closed hand made mostly of sequences with no value pair, no triplets, and a two-sided wait at completion.",
    hint: "Keep flexible connected tiles, avoid Pon, and prioritize sequence-building over triplets."
  }
];
