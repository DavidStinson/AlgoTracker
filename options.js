const GITHUB_USERNAME = document.getElementById('gh-username');
const GITHUB_REPO = document.getElementById('gh-repo');
const API_TOKEN = document.getElementById('gh-token');
const saveButton = document.getElementById('saveButton');

function save_options(){
  const username = GITHUB_USERNAME.value;
  const repo = GITHUB_REPO.value;
  const token = API_TOKEN.value
  chrome.storage.local.set({
    USERNAME: username,
    REPO: repo,
    TOKEN: token
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.local.get(
    {
      USERNAME:"", REPO:"", TOKEN:""
    },
    function (items) {
      console.log(items)
      GITHUB_USERNAME.value = items.USERNAME;
      GITHUB_REPO.value = items.REPO;
      API_TOKEN.value = items.TOKEN;
    }
    );
  }

  document.addEventListener('DOMContentLoaded', restore_options);
  saveButton.addEventListener('click', save_options);
  
  