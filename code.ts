//

console.clear();

figma.showUI(__html__, {
  width: 500,
  height: 500,
  themeColors: true,
});

figma.ui.onmessage = async (event) => {
  const { type, body } = event;

  try {
    if (type === "LOAD_LIBRARIES") {
      const libraries = await loadLibraries();

      const localVariableCollections = await getLocalVariableCollections();
      const localVariableCollectionsData = localVariableCollections.map(
        ({ id, name, variableIds }) => ({
          id,
          name,
          variableIds,
        })
      );

      const localCollectionsMap = mapListById(localVariableCollectionsData);

      const libraryNames = getLibraryNames(libraries);

      await figma.clientStorage.setAsync("libraries", libraries);
      await figma.clientStorage.setAsync("libraryNames", libraryNames);
      await figma.clientStorage.setAsync(
        "localVariableCollections",
        localVariableCollectionsData
      );
      await figma.clientStorage.setAsync(
        "localCollectionsMap",
        localCollectionsMap
      );

      figma.ui.postMessage({
        type: "LIBRARIES",
        libraryNames,
        localVariableCollections: listSelectData(localVariableCollections),
      });

      return;
    }

    const libraries = await figma.clientStorage.getAsync("libraries");

    const localVariableCollections = await figma.clientStorage.getAsync(
      "localVariableCollections"
    );

    const localCollectionsMap = await figma.clientStorage.getAsync(
      "localCollectionsMap"
    );

    if (type === "LOAD_LOCAL_COLLECTION_VARIABLES") {
      const collectionId = body.collectionId;

      const collectionVariables = await getVariablesByLocalCollection(
        localCollectionsMap[collectionId]
      );

      const collectionVariablesData = collectionVariables.map(
        ({ id, name, valuesByMode }) => ({
          id,
          name,
          valuesByMode,
        })
      );

      const collectionVariablesMapById = mapListById(collectionVariablesData);
      await figma.clientStorage.setAsync(
        "collectionVariablesMapById",
        collectionVariablesMapById
      );
      figma.ui.postMessage({
        type: "COLLECTION_VARIABLES",
        collectionVariables: listSelectData(collectionVariables),
      });
      return;
    }
    const { libraryName, importType, collectionId, variableId } = body;

    const collectionsByLibraryName = getCollectionsByLibraryName(
      libraries,
      libraryName
    );

    const { importedVariablesAliases } =
      await importVariableAliasesFromImportedCollections(
        collectionsByLibraryName
      );

    if (importType === "byVariable") {
      if (!variableId) {
        return;
      }

      const variable = await figma.variables.getVariableByIdAsync(variableId);

      await updateLocalVariable(variable, importedVariablesAliases);

      figma.ui.postMessage({
        type: "IMPORTED_OK",
        message: "Variable imported successfully",
      });

      return;
    }

    if (importType === "byCollection") {
      if (!collectionId) {
        return;
      }
      await updateLocalCollection(
        localCollectionsMap[collectionId],
        importedVariablesAliases
      );
      figma.ui.postMessage({
        type: "IMPORTED_OK",
        message: "Collection imported successfully",
      });
      return;
    }

    await updateAllLocalCollections(
      localVariableCollections,
      importedVariablesAliases
    );

    figma.ui.postMessage({
      type: "IMPORTED_OK",
      message: "All collections imported successfully",
    });
  } catch (error) {
    console.error("Error importing Library:", error);
  }
};

// Helpers
const loadLibraries = async () => {
  const libraryCollections =
    await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  return libraryCollections;
};

const importVariableAliasesFromImportedCollections = async (collections) => {
  const importedCollectionsMap: Record<string, any> = {};

  await Promise.all(
    collections.map(async ({ name, key }) => {
      importedCollectionsMap[name] =
        await figma.teamLibrary.getVariablesInLibraryCollectionAsync(key);
    })
  );

  const importedCollectionsMapKeys = Object.keys(importedCollectionsMap);

  const importedCollectionsVariablesMap = {};

  importedCollectionsMapKeys.forEach((collectionKey) => {
    importedCollectionsMap[collectionKey].forEach((variable) => {
      importedCollectionsVariablesMap[variable.name] = variable;
    });
  });

  const importedCollectionsVariablesMapKeys = Object.keys(
    importedCollectionsVariablesMap
  );

  const importedVariables: Record<string, any> = {};

  await Promise.all(
    importedCollectionsVariablesMapKeys.map(async (variableKey) => {
      importedVariables[variableKey] =
        await figma.variables.importVariableByKeyAsync(
          importedCollectionsVariablesMap[variableKey].key
        );
    })
  );

  const importedVariablesAliases: Record<string, any> = {};

  const importedVariablesKeys = importedCollectionsVariablesMapKeys;
  importedVariablesKeys.map((importedVariableKey) => {
    importedVariablesAliases[importedVariableKey] =
      figma.variables.createVariableAlias(
        importedVariables[importedVariableKey]
      );
  });

  return {
    importedCollectionsMap,
    importedCollectionsVariablesMapKeys,
    importedCollectionsVariablesMap,
    importedVariables,
    importedVariablesAliases,
  };
};

const getLocalVariableCollections = async () => {
  const localVariableCollectionsAll =
    await figma.variables.getLocalVariableCollectionsAsync();

  const localVariableCollections = localVariableCollectionsAll.filter(
    (collection) => collection.variableIds.length > 0
  );

  return localVariableCollections;
};

const getVariablesByLocalCollection = async (localCollection) => {
  const localCollectionVariableIds = localCollection.variableIds;

  const localCollectionVariablesByIds = await Promise.all(
    localCollectionVariableIds.map(async (localVariableId) => {
      const localVariable = await getLocalVariableById(localVariableId);
      return localVariable;
    })
  );

  return localCollectionVariablesByIds;
};

const updateLocalVariable = async (
  localCollectionVariable,
  importedVariablesAliases
) => {
  await Promise.all(
    Object.entries(localCollectionVariable.valuesByMode).map(
      async ([modeId, aliasVariable]) => {
        const localCollectionAliasVariable =
          await figma.variables.getVariableByIdAsync(aliasVariable.id);
        localCollectionVariable.setValueForMode(
          modeId,
          importedVariablesAliases[localCollectionAliasVariable.name]
        );
      }
    )
  );
};

const updateLocalCollection = async (
  localCollection,
  importedVariablesAliases
) => {
  const localCollectionVariablesByIds = await getVariablesByLocalCollection(
    localCollection
  );

  localCollectionVariablesByIds.map(async (localCollectionVariable) => {
    await updateLocalVariable(
      localCollectionVariable,
      importedVariablesAliases
    );
  });
};

const updateAllLocalCollections = async (
  localVariableCollections,
  importedVariablesAliases
) => {
  await Promise.all(
    localVariableCollections.map(async (localCollection) => {
      await updateLocalCollection(localCollection, importedVariablesAliases);
    })
  );
};

const getLocalVariableById = async (localVariableId) => {
  const localVariable = await figma.variables.getVariableByIdAsync(
    localVariableId
  );
  return localVariable;
};

// Utils

const getLibraryNames = (libraries) => {
  const libraryNames = libraries.map((library) => library.libraryName);
  return removeDuplicates(libraryNames);
};

const removeDuplicates = (arr: string[]): string[] => {
  return Array.from(new Set(arr));
};

const getCollectionsByLibraryName = (collections, libraryName) => {
  return collections.filter(
    (collection) => collection.libraryName === libraryName
  );
};

const sortByName = (items) =>
  items.slice().sort((a, b) => a.name.localeCompare(b.name));

const listSelectData = (collections) => {
  const data = collections.map(({ id, name }) => ({ id, name }));

  return sortByName(data);
};

const mapListById = (list) => {
  const listMap = {};
  list.map((listItem) => {
    listMap[listItem.id] = listItem;
  });

  return listMap;
};
