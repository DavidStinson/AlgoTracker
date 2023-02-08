// Use alerts, console.logs don't show up here
const downloadBtn = document.getElementById('downloadBtn');
const optionsBtn = document.getElementById('optionsBtn');
const clearBtn = document.getElementById('clearBtn');
const githubBtn = document.getElementById('githubBtn');

const formEle = document.querySelector('form');

const messageDefault = "Commit from AlgoTracker"

formEle.addEventListener('submit', (e) => e.preventDefault());

optionsBtn.addEventListener('click', function () {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

clearBtn.addEventListener('click', function () {
  formEle.reset();
});

// File Creation Start

const filenameCreator = (problemName) => {
  return problemName.replaceAll(' ', '_');
};

downloadBtn.addEventListener('click', function () {
  const formObj = {
    ...Object.values(formEle).reduce((obj, field) => {
      obj[field.name] = field.value;
      return obj;
    }, {}),
  };

  const text = `# ${formObj.problemName}\n\n${formObj.problemText}\n\n\`\`\`${formObj.language}\n${formObj.problemSolution}\n\`\`\``;
  const blob = new Blob([text], { type: 'text/markdown' });

  if (formObj.problemName && formObj.problemText && formObj.problemSolution) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filenameCreator(formObj.problemName)}.md`;
    link.click();
  }
});
// File Creation End

// Github Function
const testGithub = async () => {
  const apiBase = 'https://api.github.com/repos';

  chrome.storage.local.get(
    {
      USERNAME:"", REPO:"", TOKEN:""
    },
    function (items) {
      console.log(items)
      owner = items.USERNAME;
      repo = items.REPO;
      token = items.TOKEN;
    }
    );

  const formObj = {
    ...Object.values(formEle).reduce((obj, field) => {
      obj[field.name] = field.value;
      return obj;
    }, {}),
  };

  const text = `# ${formObj.problemName}\n\n${formObj.problemText}\n\n\`\`\`${formObj.language}\n${formObj.problemSolution}\n\`\`\``;

  // Step 1
  const getHeadRef = async () => {
    const url = `${apiBase}/${owner}/${repo}/git/ref/heads/main`;
    await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        information = { currentHead: data.object.sha}
        return information
      })
      .catch((error) => {
        alert(`Error in step 1`);
      });
      return information
  };

  // Step 2
  const postFileToServer = async (information) => {
    const url = `${apiBase}/${owner}/${repo}/git/blobs`;
    const data = {
      content: text,
      encoding: 'utf-8|base64',
    };
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        information["fileSha"] = data.sha;
        return information
      })
      .catch((error) => {
        alert(`Error in step 2: ${error}`);
      });
      return information
  };

  // Step 3
  const treeInformation = async (information) => {
    const url = `${apiBase}/${owner}/${repo}/git/commits/${information.currentHead}`;
    await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        information["treeInfo"] = data.sha;
        return information
      })
      .catch((error) => {
        alert(`Error in step 3: ${error}`);
      });
    return information
  };

  // Step 4
  const createNewTree = async (information) => {
    const url = `${apiBase}/${owner}/${repo}/git/trees`;
    const data = {
      base_tree: information.treeInfo,
      tree: [
        {
          path: `${filenameCreator(formObj.problemName)}.md`,
          mode: '100644',
          type: 'blob',
          sha: information.fileSha,
        },
      ],
    };
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        information["newTree"] = data.sha;
        return information
      })
      .catch((error) => {
        alert(`Error in step 4: ${error}`);
      });
    return information
  };

  // Step 5
  const createCommit = async (information) => {
    const url = `${apiBase}/${owner}/${repo}/git/commits`;
    const data = {
      message: messageDefault,
      partents: [information.currentTree],
      tree: information.newTree,
    };
    await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        information["commitSha"] = data.sha;
        return information
      })
      .catch((error) => {
        alert(`Error in step 5: ${error}`);
      });
    return information
  };

  // Step 6
  const updateHead = async (information) => {
    const url = `${apiBase}/${owner}/${repo}/git/refs/heads/main`;
    const data = {
      sha: information.commitSha,
      force: true,
    };
    await fetch(url, {
      method: 'PATCH',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`Commit has been executed successfully!`);
        return data.node_id;
      })
      .catch((error) => {
        alert(error);
      });
  };

  const githubCommitSteps = async () => {
    // Step 1
    await getHeadRef()
      .then( async (information) =>
        // Step 2
        await postFileToServer(information)
      )
      .then( async (information) =>
        // Step 3
        await treeInformation(information)
      )
      .then( async (information) =>
        // Step 4
        await createNewTree(information)
      )
      .then( async (information) =>
        // Step 5
        await createCommit(information)
      )
      .then( async (information) =>
        // Step 6
        await updateHead(information)
      )
      .then((result) => {
        return result;
      })
      .catch((error) => {
        alert('We had a problem in commitSteps');
      });
  };

  if (formObj.problemName && formObj.problemText && formObj.problemSolution
      && apiBase && owner && repo && token) {
    alert(`File is being sent to GitHub`)
    await githubCommitSteps();
  }
};

githubBtn.addEventListener('click', testGithub);
// Github Function End
