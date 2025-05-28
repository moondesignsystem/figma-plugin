//

console.clear();

figma.showUI(__html__, {
  width: 500,
  height: 500,
  themeColors: true,
});

let libraries: any[];
let localVariableCollections: any[];
let localCollectionsMap: Record<string, any>;
let collectionVariables: any[];
let collectionVariablesMapById: Record<string, any>;

figma.ui.onmessage = async (event) => {
  const { type, body } = event;
  localVariableCollections = await getLocalVariableCollections();
  localCollectionsMap = mapListById(localVariableCollections);

  try {
    if (type === "LOAD_LIBRARIES") {
      libraries = await loadLibraries();

      const libraryNames = getLibraryNames(libraries);

      figma.ui.postMessage({
        type: "LIBRARIES",
        libraryNames,
        localVariableCollections: listSelectData(localVariableCollections),
      });

      return;
    }

    if (type === "LOAD_LOCAL_COLLECTION_VARIABLES") {
      const collectionId = body.collectionId;
      collectionVariables = await getVariablesByLocalCollection(
        localCollectionsMap[collectionId]
      );
      collectionVariablesMapById = mapListById(collectionVariables);
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
      await updateLocalVariable(
        collectionVariablesMapById[variableId],
        importedVariablesAliases
      );
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
      return;
    }

    await updateAllLocalCollections(
      localVariableCollections,
      importedVariablesAliases
    );
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
