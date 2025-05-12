import {
  Alias,
  Aliases,
  CustomFile,
  GeneralObject,
  ImportedCollection,
  ImportedTokens,
  importJSONFileArgs,
  ImportJSONFileArgs2,
  SelectedCollection,
  SelectedMode,
  TraverseTokensArgs,
  VariableMap,
} from "./types";

const pluginCommands = ["import", "export"];

const figmaCommand = figma.command;

const isValidCommand = pluginCommands.includes(figmaCommand);

if (!isValidCommand) {
  figma.closePlugin();
}

figma.showUI(__uiFiles__[figmaCommand], {
  width: 500,
  height: 500,
  themeColors: true,
});

figma.ui.onmessage = async (e) => {
  console.log("code received message", e);
  if (e.type === "IMPORT") {
    const { body } = e;
    importJSONFile2({ body });
    // await getExistingCollectionsAndModes();
    return;
  }
  await exportToJSON();
};

const importJSONFile2 = async ({ body }: ImportJSONFileArgs2) => {
  console.log("IMPORT 2");

  const json = JSON.parse(body);
  console.log("IMPORT 2 JSON", json);
  const importedCollections: ImportedCollection[] =
    json.collections as ImportedCollection[];
  importedCollections.forEach((collection) => {
    console.log("IMPORT 2 collection", { collection });
  });
};

const getExistingCollectionsAndModes = async () => {
  const collections = await figma.variables
    .getLocalVariableCollections()
    .reduce((into, collection) => {
      into[collection.name] = {
        name: collection.name,
        id: collection.id,
        defaultModeId: collection.defaultModeId,
        modes: collection.modes,
      };
      return into;
    }, {} as Record<string, Partial<VariableCollection>>);

  figma.ui.postMessage({
    type: "LOAD_COLLECTIONS",
    collections,
  });
};

const importJSONFile = ({
  selectedCollection,
  selectedMode,
  body,
}: importJSONFileArgs) => {
  const json = JSON.parse(body);
  console.log("IMPORT");
  const { collection, modeId } = createCollection(
    selectedCollection,
    selectedMode
  );

  if (!collection || !modeId) {
    figma.closePlugin("Collection or mode not found");
    return;
  }

  const variableMap = loadExistingVariableMap();

  const aliases: Aliases = {};
  const tokens: ImportedTokens = {};
  Object.entries(json).forEach(([key, object]) => {
    traverseToken({
      variableMap,
      collection,
      modeId,
      type: json.$type,
      key,
      object,
      tokens,
      aliases,
    });
  });
  processAliases({ variableMap, collection, modeId, aliases, tokens });
};

const createCollection = (
  selectedCollection: SelectedCollection,
  selectedMode: SelectedMode
) => {
  // collection exists
  if (selectedCollection.id) {
    const collection = figma.variables.getVariableCollectionById(
      selectedCollection.id
    );
    const modeId = selectedMode.id;
    // mode exists
    if (modeId) {
      return { collection, modeId };
    }

    // otherwise create new mode
    const newMode = collection.addMode(selectedMode.name);
    return { collection, modeId: newMode };
  }

  // collection doesn't exist, so mode doesn't exist
  const collection = figma.variables.createVariableCollection(
    selectedCollection.name
  );
  const modeId = collection.modes[0].modeId;
  collection.renameMode(modeId, selectedMode.name);
  return { collection, modeId };
};

const loadExistingVariableMap = () => {
  const variables = figma.variables.getLocalVariables();
  const map: VariableMap = {};
  variables.forEach((variable) => {
    map[variable.variableCollectionId] =
      map[variable.variableCollectionId] || {};
    map[variable.variableCollectionId][variable.name] = variable;
  });
  return map;
};

const traverseToken = ({
  variableMap,
  collection,
  modeId,
  type,
  key,
  object,
  tokens,
  aliases,
}: TraverseTokensArgs) => {
  type = type || (object as GeneralObject).$type;
  // if key is a meta field, move on
  if (key.charAt(0) === "$") {
    return;
  }
  if ((object as GeneralObject).$value !== undefined) {
    if (isAlias((object as GeneralObject).$value)) {
      const valueKey = ((object as GeneralObject).$value as string)
        .trim()
        .replace(/\./g, "/")
        .replace(/[\{\}]/g, "");
      if (tokens[valueKey]) {
        tokens[key] = createVariable(
          variableMap,
          collection,
          modeId,
          key,
          valueKey,
          tokens
        );
      } else {
        aliases[key] = {
          key,
          type,
          valueKey,
        };
      }
    } else if (type === "color") {
      tokens[key] = createToken(
        variableMap,
        collection,
        modeId,
        "COLOR",
        key,
        parseColor((object as GeneralObject).$value as string)
      );
    } else if (type === "number") {
      tokens[key] = createToken(
        variableMap,
        collection,
        modeId,
        "FLOAT",
        key,
        (object as GeneralObject).$value as VariableValue
      );
    } else {
      console.log("unsupported type", type, object);
    }
  } else {
    Object.entries(object as GeneralObject).forEach(([key2, object2]) => {
      if (key2.charAt(0) !== "$") {
        traverseToken({
          variableMap,
          collection,
          modeId,
          type,
          key: `${key}/${key2}`,
          object: object2 as unknown,
          tokens,
          aliases,
        });
      }
    });
  }
};

const isAlias = (value: any) => {
  return value.toString().trim().charAt(0) === "{";
};

const createVariable = (
  variableMap: VariableMap,
  collection: VariableCollection,
  modeId: string,
  key: string,
  valueKey: string,
  tokens: ImportedTokens
) => {
  const token = tokens[valueKey];
  return createToken(variableMap, collection, modeId, token.resolvedType, key, {
    type: "VARIABLE_ALIAS",
    id: `${token.id}`,
  });
};

const createToken = (
  variableMap: VariableMap,
  collection: VariableCollection,
  modeId: string,
  type: VariableResolvedDataType,
  name: string,
  value: VariableValue
) => {
  const existingCollection = variableMap[collection.id];
  let token = existingCollection ? existingCollection[name] : null;

  if (!token) {
    token = figma.variables.createVariable(name, collection.id, type);
  }
  token.setValueForMode(modeId, value);
  return token;
};

const parseColor = (color: string) => {
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex =
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex =
    /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const [, r, g, b] = color.match(rgbRegex) as RegExpExecArray;
    return { r: parseInt(r) / 255, g: parseInt(g) / 255, b: parseInt(b) / 255 };
  } else if (rgbaRegex.test(color)) {
    const [, r, g, b, a] = color.match(rgbaRegex) as RegExpExecArray;
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255,
      a: parseFloat(a),
    };
  } else if (hslRegex.test(color)) {
    const [, h, s, l] = color.match(hslRegex) as RegExpExecArray;
    return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
  } else if (hslaRegex.test(color)) {
    const [, h, s, l, a] = color.match(hslaRegex) as RegExpExecArray;
    return Object.assign(
      hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
      { a: parseFloat(a) }
    );
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex =
      hexValue.length === 3
        ? hexValue
            .split("")
            .map((char) => char + char)
            .join("")
        : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255,
    };
  } else if (floatRgbRegex.test(color)) {
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format");
  }
};
const hslToRgbFloat = (h: number, s: number, l: number) => {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, (h + 1 / 3) % 1);
  const g = hue2rgb(p, q, h % 1);
  const b = hue2rgb(p, q, (h - 1 / 3) % 1);

  return { r, g, b };
};

const processAliases = ({
  variableMap,
  collection,
  modeId,
  aliases,
  tokens,
}: {
  variableMap: VariableMap;
  collection: VariableCollection;
  modeId: string;
  aliases: Aliases;
  tokens: ImportedTokens;
}) => {
  const aliasesValues: Alias[] = Object.values(aliases);
  let generations = aliasesValues.length;
  while (aliasesValues.length && generations > 0) {
    for (let i = 0; i < aliasesValues.length; i++) {
      const { key, valueKey } = aliasesValues[i];
      const token = tokens[valueKey];
      if (token) {
        aliasesValues.splice(i, 1);
        tokens[key] = createVariable(
          variableMap,
          collection,
          modeId,
          key,
          valueKey,
          tokens
        );
      }
    }
    generations--;
  }
};

const exportToJSON = async () => {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  console.log("in here oe exportToJSON", {
    collections,
    length: collections.length,
  });
  console.log("in here oe first collection", { collection: collections[0] });

  const files: CustomFile[] = [];
  for (const collection of collections) {
    files.push(...(await processCollection(collection)));
  }
  figma.ui.postMessage({ type: "EXPORT_RESULT", files });
};

const processCollection = async ({
  name,
  modes,
  variableIds,
}: VariableCollection) => {
  const files: CustomFile[] = [];
  modes.forEach((mode) => {
    const file: CustomFile = {
      fileName: `${name}.${mode.name}.tokens.json`,
      body: {},
    };
    variableIds.forEach((variableId) => {
      const variable: Variable | null =
        figma.variables.getVariableById(variableId);

      if (!variable) {
        return;
      }

      const { name, resolvedType, valuesByMode } = variable;
      const value = valuesByMode[mode.modeId];

      if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
        let obj = file.body;
        name.split("/").forEach((groupName) => {
          obj[groupName] = obj[groupName] || {};
          obj = obj[groupName];
        });
        obj.$type = resolvedType === "COLOR" ? "color" : "number";
        if (value.type === "VARIABLE_ALIAS") {
          const variableById = figma.variables.getVariableById(value.id);

          obj.$value = `{${variableById.name.replace(/\//g, ".")}}`;
          // obj.$value = `{${figma.variables
          //   .getVariableById(variable.id as string)
          //   .name.replace(/\//g, ".")}}`;
        } else {
          obj.$value =
            resolvedType === "COLOR" ? rgbToHex(value as RGBA) : value;
        }
      }
    });
    files.push(file);
  });
  return files;
};

const rgbToHex = ({ r, g, b, a }: RGBA) => {
  if (a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
};
