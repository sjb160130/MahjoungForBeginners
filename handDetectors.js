// Yaku detection functions
function checkPinfu() {
  if (openHand) return;
  if (totalTriplets > 0 || totalQuads > 0) return;

  let honorPairs = 0;
  WINDS.concat(DRAGONS).forEach((tile) => {
    if (counts[tile] >= 2) honorPairs++;
  });
  if (honorPairs > 0) return;

  let connectedTiles = 0;
  for (let suit of SUITS) {
    for (let i = 1; i <= 9; i++) {
      if (counts[i + suit] && (counts[i - 1 + suit] || counts[i + 1 + suit])) {
        connectedTiles++;
      }
    }
  }
  if (connectedTiles >= 8) {
    suggestions.push(
      "Pinfu hint: Your closed hand is forming mostly sequences. Avoid triplets and keep flexible two-sided waits.",
    );
  }
}

function checkIitsu() {
  for (let suit of SUITS) {
    let runs = { 123: false, 456: false, 789: false };

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
    if (completedRuns >= 2) {
      suggestions.push(
        `Pure Straight (Iitsu) hint: You already have two sections of a 123-456-789 straight in ${suit}. Consider completing the missing section.`,
      );
    } else {
      let straightTiles = 0;
      for (let i = 1; i <= 9; i++) {
        if (counts[i + suit]) straightTiles++;
      }
      if (straightTiles >= 6) {
        suggestions.push(
          `Pure Straight (Iitsu) hint: Your ${suit} suit has many connected tiles. A 123-456-789 straight may be possible.`,
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
      if (greenTiles.includes(tile)) greenCount += counts[tile];
    }
  });

  if (greenCount === totalTiles) {
    suggestions.push(
      "Ryuuiisou hint: Your hand contains only green tiles. Keep the hand focused on the All Green Yakuman.",
    );
  } else if (greenCount >= 9) {
    suggestions.push(
      `Ryuuiisou hint: ${greenCount}/${totalTiles} tiles are green. Consider keeping bamboo groups and Green Dragons.`,
    );
  } else if (greenCount >= 7) {
    suggestions.push(
      "Ryuuiisou hint: Many green tiles are present. A bamboo-only Yakuman route may be possible.",
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
    ...DRAGONS,
  ];
  let uniqueTiles = countUniqueTiles(kokushiTiles);
  let hasPair = kokushiTiles.some((tile) => counts[tile] >= 2);

  if (uniqueTiles === 13) {
    if (hasPair) {
      suggestions.push(
        "Kokushi Musou (Thirteen Orphans): Complete! Stay closed and aim for the Yakuman.",
      );
    } else {
      suggestions.push(
        "Kokushi Musou hint: You have all 13 unique terminal and honor tiles. Look for any duplicate to complete the hand.",
      );
    }
  } else if (uniqueTiles >= 10) {
    suggestions.push(
      `Kokushi Musou hint: ${uniqueTiles}/13 terminal and honor tiles found. This hand is a strong candidate for a Kokushi route. Avoid building normal sequences.`,
    );
  } else if (uniqueTiles >= 8) {
    suggestions.push(
      `Kokushi Musou hint: ${uniqueTiles}/13 terminal and honor tiles found. Consider a Kokushi pivot if your middle tiles are not forming well.`,
    );
  }
}

function checkIipeikou() {
  if (openHand) return;
  let duplicateRuns = countDuplicateRuns();
  if (duplicateRuns >= 2) {
    suggestions.push(
      "Ryanpeikou hint: You have two sets of identical sequences forming. Stay closed and prioritize completing the four identical runs.",
    );
    return;
  }
  if (duplicateRuns === 1) {
    suggestions.push(
      "Iipeikou hint: You have two identical sequences forming. Keep your hand closed to preserve this yaku.",
    );
  }
}

function checkTanyao() {
  let terminalHonor = getOutsideTileCount();
  if (terminalHonor === 0) {
    suggestions.push(
      "All Simples (Tanyao): Your hand has no terminals or honors. Keep 2-8 tiles and avoid outside tiles.",
    );
  } else if (terminalHonor <= 3) {
    suggestions.push(
      `All Simples (Tanyao): Low terminal/honor count (${terminalHonor}). Consider discarding 1s, 9s, and honors.`,
    );
  }
}

function checkChanta() {
  let outsideTiles = getOutsideTileCount();
  let terminalHonorGroups = 0;

  Object.keys(counts).forEach((tile) => {
    let num = tile[0];
    let suit = tile[1];
    if (suit === "z" || num === "1" || num === "9") {
      if (counts[tile] >= 2) terminalHonorGroups++;
    }
  });

  if (outsideTiles >= 9 && terminalHonorGroups >= 3) {
    suggestions.push(
      "Honroutou potential: Many terminal/honor groups. Consider an all outside triplet hand.",
    );
  }
  if (honorCount === 0 && terminalCount >= 6) {
    suggestions.push(
      "Junchan potential: No honors and many terminals. Build every group around 1s and 9s.",
    );
  }
  if (outsideTiles >= 6 && terminalHonorGroups >= 1) {
    suggestions.push(
      "Chanta potential: Keep terminals/honors and build sequences containing outside tiles.",
    );
  }
  if (honorCount >= 9 && terminalCount <= 3) {
    suggestions.push(
      "Tsuuiisou potential: Honor-only hand. Keep honor pairs and triplets.",
    );
  }
  if (terminalCount >= 9 && honorCount === 0) {
    suggestions.push(
      "Chinroutou potential: Terminal-only hand. Keep 1s and 9s.",
    );
  }
}

function checkConcealedTriplets() {
  if (openHand) return;
  if (totalTriplets >= 3 && totalPairs >= 1) {
    suggestions.push(
      "Four Concealed Triplets (Suuankou): Rare opportunity! Stay closed and try to complete one more concealed triplet.",
    );
  }
  if (totalTriplets >= 2 && totalPairs >= 1) {
    suggestions.push(
      "Three Concealed Triplets (Sanankou): Keep your hand closed and aim to complete another concealed triplet.",
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
        `Triple Triplets (Sanshoku Doukou): Multiple ${i}'s are forming across suits. Consider keeping pairs and calling Pon if needed to create three pons.`,
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
        `Mixed Triple Sequence (Sanshoku Doujun): You're close to matching the ${i}${i + 1}${i + 2} sequence in all three suits.`,
      );
    }
  }
}

function checkToitoi() {
  if (totalTriplets >= 3 || totalPairs >= 4) {
    suggestions.push(
      "All Triplets (Toitoi): Strongly viable. Look to open your hand using 'Pon' when tiles match.",
    );
  }

  const totalMeldTriplets = totalTriplets + totalQuads;
  if (totalQuads === 3) {
    suggestions.push(
      "Four Quads (Suukantsu): TENPAI! You have 3 Quads completed. Call 'Kan' on one more set to secure a Yakuman.",
    );
  } else if (totalQuads === 2 && totalMeldTriplets >= 3) {
    suggestions.push(
      "Three Quads (Sankantsu): Strongly viable. Hunt down your third Kan. Bonus: Get a fourth Kan for Suukantsu Yakuman!",
    );
  }
}

function checkClosedHand() {
  if (!openHand) {
    if (totalPairs >= 4) {
      suggestions.push(
        "<b>CLOSED:</b> Seven Pairs (Chiitoitsu): Strongly viable. Avoid grouping cards into sequences; hold duplicates.",
      );
    }
    if (shanten === 0) {
      suggestions.push(
        "<b>CLOSED:</b> Menzen Tsumo: Your hand is ready. You need to draw the last tile to win .",
      );
    }
  }
}

function checkFlush() {
  let numSuits = ["m", "p", "s"].filter((s) => suits[s] > 0).length;
  if (numSuits === 1) {
    if (suits.z > 0) {
      suggestions.push("Half Flush (Honitsu): Keep your main suit and honors.");
    } else {
      suggestions.push(
        "Full Flush (Chinitsu): Remove other suits. And pick up no honors",
      );
    }
  }
}

function checkYakuhai() {
  DRAGONS.forEach((dragon) => {
    if (hasCopies(dragon, 3)) {
      suggestions.push(
        `Dragon Value (Yakuhai): You have a triplet of ${getDragonName(dragon)} Dragons for an easy score multiplier.\n`,
      );
    } else if (hasCopies(dragon, 2)) {
      suggestions.push(
        `Dragon Value (Yakuhai): Hold your pair of ${getDragonName(dragon)} Dragons to complete a triplet.\n`,
      );
    }
  });
}

function checkYakuhaiPlus() {
  const dragons = countSets(DRAGONS);
  const winds = countSets(WINDS);

  if (dragons.triplets === 3) {
    suggestions.push(
      "Big Three Dragons (Daisangen): You have all three dragon triplets!",
    );
  } else if (dragons.triplets === 2 && dragons.pairs === 1) {
    suggestions.push(
      "Little Three Dragons (Shousangen): Keep your dragon pair to complete the third triplet.",
    );
  }
  if (winds.triplets === 4) {
    suggestions.push(
      "Big Four Winds (Daisuushi): You have all four wind triplets!",
    );
  } else if (winds.triplets === 3 && winds.pairs === 1) {
    suggestions.push(
      "Little Four Winds (Shousuushi): Keep your wind pair to complete the fourth triplet.",
    );
  }
}
