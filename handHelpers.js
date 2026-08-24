// Tile validation and detector support helpers
function CheckNumberOfTiles(hand, tile) {
  let numberOfTiles = 0;
  for (let currentTile of hand) {
    if (currentTile === tile) numberOfTiles++;
  }
  return numberOfTiles;
}

function ValidateMaxTileLimit(hand) {
  for (let tile of hand) {
    if (CheckNumberOfTiles(hand, tile) === 4) return false;
  }
  return true;
}

function ValidateSingleTileMax(hand, tile) {
  return CheckNumberOfTiles(hand, tile) === 4;
}

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
  return { triplets, pairs };
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
