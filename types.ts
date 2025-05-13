/* eslint-disable @typescript-eslint/no-explicit-any */
// Intentionall comment line
export type GeneralObject = Record<
  string,
  string | number | boolean | object | VariableValue
>;

export type CustomFile = { body: GeneralObject };

export type SelectedCollection = {
  id: string;
  name: string;
};

export type SelectedMode = {
  id: string;
  name: string;
};

export type importJSONFileArgs = {
  selectedCollection: SelectedCollection;
  selectedMode: SelectedMode;
  body: string;
};

export type ImportJSONFileArgs2 = {
  body: string;
};

export type ImportedVariable = {
  id: string;
  type: VariableDataType;
  value: VariableValue;
};

export type ImportedVariableGroup = Record<string, ImportedVariable>;

export type ImportedVariables = Record<
  string,
  Partial<ImportedVariable> | ImportedVariableGroup
>;

export type VariableList = Record<
  string,
  Record<string, ImportedVariable | ImportedVariableGroup>
>;

export type ImportedMode = {
  id: string;
  name: string;
  variables: VariableList;
};

export type ExportedCollection = Record<string, string>;

export type ImportedCollection = {
  id: string;
  name: string;
  modes: ImportedMode[];
};

export type VariableMap = Record<string, Record<string, Variable>>;

export type TraverseTokensArgs = {
  variableMap: VariableMap;
  collection: VariableCollection;
  modeId: string;
  type: any;
  key: string;
  object: GeneralObject | unknown;
  tokens: ImportedTokens;
  aliases: Record<string, GeneralObject>;
};

export type ImportedToken = {
  resolvedType: VariableResolvedDataType;
  id: string;
};

export type ImportedTokens = Record<string, ImportedToken>;

export type Alias = {
  key: string;
  type: string;
  valueKey: string;
};

export type Aliases = Record<string, Alias>;
