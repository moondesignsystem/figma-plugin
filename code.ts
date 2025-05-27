//

console.clear();

figma.showUI(__html__, {
  width: 500,
  height: 500,
  themeColors: true,
});

figma.ui.onmessage = async (e) => {
  console.log("code received message", e);
  try {
    const libraryCollections =
      await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();

    const marioCoreCollections = libraryCollections.filter(
      (item) => item.libraryName === "Mario Core"
    );

    let importedCollectionsMap: Record<string, any> = {};

    await Promise.all(
      marioCoreCollections.map(async ({ name, key }) => {
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

    const localVariableCollectionsAll =
      await figma.variables.getLocalVariableCollectionsAsync();

    const localVariableCollections = localVariableCollectionsAll.filter(
      (collection) => collection.variableIds.length > 0
    );

    await Promise.all(
      localVariableCollections.map(async (localCollection) => {
        const localCollectionVariableIds = localCollection.variableIds;

        const localCollectionVariablesByIds = await Promise.all(
          localCollectionVariableIds.map(async (localVariableId) => {
            const localVariable = await figma.variables.getVariableByIdAsync(
              localVariableId
            );
            return localVariable;
          })
        );

        localCollectionVariablesByIds.map(async (localCollectionVariable) => {
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
        });
      })
    );
  } catch (error) {
    console.error("Error importing JSON file:", error);
  }
};
