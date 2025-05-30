// Intentional comment

let localCollections = [];
const form = document.querySelector("form");
const loadLibrariesBtn = document.getElementById("loadLibraries");
const submitBtn = document.getElementById("submitButton");
const librariesSelect = document.getElementById("selectLibrary");
const byVariableElement = document.getElementById("byVariable");
const byCollectionElement = document.getElementById("byCollection");
const allCollectionsElement = document.getElementById("allCollections");
const messageElement = document.getElementById("message");
const loadingItem = document.getElementById("loadingItem");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const obj = Object.fromEntries(formData);
  parent.postMessage({ pluginMessage: { body: obj, type: "IMPORT" } }, "*");
  loadingItem.className = "shown";

  disableSubmitButton();
});

loadLibrariesBtn.addEventListener("click", () => {
  parent.postMessage({ pluginMessage: { type: "LOAD_LIBRARIES" } }, "*");
  loadLibrariesBtn.innerHTML = "Loading...";
  loadLibrariesBtn.setAttribute("disabled", true);
});

librariesSelect.addEventListener("change", () => {
  const importType = document.querySelector(
    "input[type='radio']:checked"
  ).value;

  if (importType === "allCollections") {
    enableSubmitButton();
  }
});

byVariableElement.addEventListener("change", (event) => {
  const importType = event.target.checked;

  createCollectionsSelect(localCollections);
  createVariablesSelect();
  hideMessageElement();
  disableSubmitButton();
});

byCollectionElement.addEventListener("change", (event) => {
  const importType = event.target.checked;

  const selectRow = document.getElementById("selectRow");
  createCollectionsSelect(localCollections);
  removeNode("selectVariable");
  hideMessageElement();
  disableSubmitButton();
});

allCollectionsElement.addEventListener("change", (event) => {
  const importType = event.target.checked;

  const selectRow = document.getElementById("selectRow");

  removeNode("selectCollection");
  removeNode("selectVariable");
  hideMessageElement();

  const librariesSelectValue = librariesSelect.value;

  if (librariesSelectValue) {
    enableSubmitButton();
  }
});

window.onmessage = ({ data: { pluginMessage } }) => {
  if (pluginMessage.type === "LIBRARIES") {
    const { libraryNames, localVariableCollections } = pluginMessage;
    localCollections = localVariableCollections;

    populateLibrarySelect(libraryNames);
    populateCollectionsSelect(localCollections);

    loadLibrariesBtn.innerHTML = "Load Enabled Libraries";
    loadLibrariesBtn.removeAttribute("disabled");
    return;
  }

  if (pluginMessage.type === "COLLECTION_VARIABLES") {
    const { collectionVariables } = pluginMessage;

    populateVariablesSelect(collectionVariables);
    loadingItem.className = "hidden";
  }

  if (pluginMessage.type === "IMPORTED_OK") {
    const { message } = pluginMessage;

    loadingItem.className = "hidden";
    messageElement.textContent = message;
    messageElement.className = "shown";
  }
};

const populateLibrarySelect = (libraryNames) => {
  const select = librariesSelect;
  select.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "--Choose a library--";
  select.appendChild(emptyOption);
  libraryNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
};

const populateCollectionsSelect = (collections) => {
  const select = document.getElementById("selectCollection");

  if (!select) {
    return;
  }

  select.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "--Choose a collection--";
  select.appendChild(emptyOption);
  collections.forEach((collection) => {
    const { name, id } = collection;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    select.appendChild(option);
  });
};

const populateVariablesSelect = (variables) => {
  const select = document.getElementById("selectVariable");

  if (!select) {
    return;
  }

  select.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "--Choose a variable--";
  select.appendChild(emptyOption);
  variables.forEach((variable) => {
    const { name, id } = variable;
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    select.appendChild(option);
  });
};

const createCollectionsSelect = (collections) => {
  const selectCollections = document.getElementById("selectCollection");

  if (selectCollections) {
    return;
  }

  const selectRow = document.getElementById("selectRow");

  const select = document.createElement("select");
  select.name = "collectionId";
  select.id = "selectCollection";
  select.required = true;
  selectRow.appendChild(select);

  populateCollectionsSelect(collections);
  addCollectionsSelectEventListener();
};

const createVariablesSelect = (variables) => {
  const variableSelect = document.getElementById("selectVariable");

  if (variableSelect) {
    return;
  }

  const selectRow = document.getElementById("selectRow");

  const select = document.createElement("select");
  select.name = "variableId";
  select.id = "selectVariable";
  select.required = true;
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "--Choose a variable--";
  select.appendChild(emptyOption);
  selectRow.appendChild(select);
  addVariablesSelectEventListener();
};

const removeNode = (nodeId) => {
  const node = document.getElementById(nodeId);

  if (!node) {
    return;
  }

  node.remove();
};

const addVariablesSelectEventListener = () => {
  document
    .querySelector("#selectVariable")
    .addEventListener("change", (event) => {
      const variableId = event.target.value;

      if (!variableId) {
        return;
      }

      enableSubmitButton();
    });
};

const addCollectionsSelectEventListener = () => {
  document
    .querySelector("#selectCollection")
    .addEventListener("change", (event) => {
      const collectionId = event.target.value;
      const isByVariableChecked = byVariableElement.checked;

      if (!collectionId) {
        return;
      }

      if (isByVariableChecked) {
        parent.postMessage(
          {
            pluginMessage: {
              type: "LOAD_LOCAL_COLLECTION_VARIABLES",
              body: { collectionId },
            },
          },
          "*"
        );
        loadingItem.className = "shown";
        return;
      }

      enableSubmitButton();
    });
};

const enableSubmitButton = () => {
  submitBtn.removeAttribute("disabled");
};

const disableSubmitButton = () => {
  submitBtn.setAttribute("disabled", true);
};

const hideMessageElement = () => {
  messageElement.className = "hidden";
};
