import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat["jsx-runtime"],
    ],
    settings: {
      react: {
        version: "19",
      },
    },
  },
  eslintConfigPrettier,
);
