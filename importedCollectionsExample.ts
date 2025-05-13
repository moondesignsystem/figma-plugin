//
import { ImportedCollection } from "./types";

const importedCollectionsExample: { collections: ImportedCollection[] } = {
  collections: [
    {
      name: "Color",
      modes: [
        {
          name: "Light",
          variables: {
            Slate: {
              1: { type: "COLOR", value: "#fcfcfd" },
              2: { type: "COLOR", value: "#f9f9fb" },
              3: { type: "COLOR", value: "#f0f0f3" },
              Alpha: {
                0: { type: "COLOR", value: "rgba(252, 252, 253, 0.0010)" },
                8: { type: "COLOR", value: "rgba(28, 32, 36, 0.0800)" },
              },
            },
          },
        },
        {
          name: "Dark",
          variables: {
            Slate: {
              1: { type: "COLOR", value: "#111113" },
              2: { type: "COLOR", value: "#18191b" },
              3: { type: "COLOR", value: "#212225" },
              Alpha: {
                0: { type: "COLOR", value: "rgba(17, 17, 19, 0.0010)" },
                8: { type: "COLOR", value: "rgba(237, 238, 240, 0.0800)" },
              },
            },
          },
        },
      ],
    },
    {
      name: "Text",
      modes: [
        {
          name: "Default",
          variables: {
            Body: {
              100: {
                "Font-size": { type: "FLOAT", value: "{Text.10}" },
                "Line-height": { type: "FLOAT", value: "{Space.12}" },
              },
              200: {
                "Font-size": { type: "FLOAT", value: "{Text.12}" },
                "Line-height": { type: "FLOAT", value: "{Space.16}" },
              },
            },
            Heading: {
              100: {
                "Font-size": { type: "FLOAT", value: "{Text.18}" },
                "Line-height": { type: "FLOAT", value: "{Space.28}" },
              },
              200: {
                "Font-size": { type: "FLOAT", value: "{Text.24}" },
                "Line-height": { type: "FLOAT", value: "{Space.32}" },
              },
            },
          },
        },
      ],
    },
    {
      name: "Dimension",
      modes: [
        {
          name: "Default",
          variables: {
            Space: {
              0: { type: "FLOAT", value: 0 },
              4: { type: "FLOAT", value: 4 },
              8: { type: "FLOAT", value: 8 },
              16: { type: "FLOAT", value: 16 },
            },
            Rounded: {
              0: { type: "FLOAT", value: 0 },
              4: { type: "FLOAT", value: 4 },
              8: { type: "FLOAT", value: 8 },
            },
          },
        },
      ],
    },
    {
      name: "Effect",
      modes: [
        {
          name: "Default",
          variables: {
            Shadow: {
              100: {
                X: { type: "FLOAT", value: "{Space.0}" },
                Y: { type: "FLOAT", value: "{Space.1}" },
                Blur: { type: "FLOAT", value: "{Space.2}" },
                Spread: { type: "FLOAT", value: "{Space.0}" },
                Color: { type: "COLOR", value: "{Slate.Shadow.200}" },
              },
            },
          },
        },
      ],
    },
  ],
};

export default importedCollectionsExample;
