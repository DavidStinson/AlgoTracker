function saveData(data) {
  chrome.storage.local.set({ data: data }, function() {
    console.log("Data saved: ", data);
  });
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "saveData") {
      saveData(request.data);
    }
  }
);

// Nice Code Snippet to Track changes to storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});