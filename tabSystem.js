// Tab navigation and input-mode controls
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let panel of tabcontent) {
    panel.style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablinks");
  for (let tab of tablinks) {
    tab.className = tab.className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function toggleTab() {
  const element = document.getElementById("VariableInfo");
  if (!element) return;
  element.style.display = element.style.display === "block" ? "none" : "block";
}

function toggleVisibility(isVisible, targetElement) {
  targetElement.style.display = isVisible ? "block" : "none";
}

const typeToggle = document.getElementById("typeCheck");
const typeInput = document.getElementById("typeTab");
const tileInput = document.getElementById("tapTab");

function updateInputMode() {
  typeInput.style.display = typeToggle.checked ? "block" : "none";
  tileInput.style.display = typeToggle.checked ? "none" : "block";
}

typeToggle.addEventListener("change", updateInputMode);
updateInputMode();
