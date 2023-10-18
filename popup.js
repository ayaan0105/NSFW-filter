const filterToggle = document.getElementById("filterToggle");
const toggleLabel = document.getElementById("toggleLabel");

// Function to update the filter toggle label
function updateFilterToggleLabel(isEnabled) {
  toggleLabel.textContent = isEnabled ? "Disable" : "Enable";
}

// Function to apply blur to NSFW images
function blurNSFWImages() {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    if (detectNSFW(img.src)) {
      img.classList.add("blur-image");
    } else {
      img.classList.remove("blur-image");
    }
  });
}

// Load the filter preference from storage
chrome.storage.sync.get("contentFilterEnabled", (data) => {
  const isEnabled = data.contentFilterEnabled || false;
  filterToggle.checked = isEnabled;
  updateFilterToggleLabel(isEnabled);
  
  // Apply blur immediately if enabled
  if (isEnabled) {
    blurNSFWImages();
  }
});

// Toggle content filtering when the filter toggle button is clicked
filterToggle.addEventListener("change", () => {
  const isEnabled = filterToggle.checked;
  updateFilterToggleLabel(isEnabled);
  
  // Save the filter preference to storage
  chrome.storage.sync.set({ contentFilterEnabled: isEnabled });
  
  // Apply blur when enabled
  if (isEnabled) {
    blurNSFWImages();
  } else {
    // Remove blur when disabled
    const images = document.querySelectorAll(".blur-image");
    images.forEach((img) => {
      img.classList.remove("blur-image");
    });
  }
});
