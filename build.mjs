/* eslint-env node */
import {
    build
} from "esbuild";
import babel from "esbuild-plugin-babel";

build({
    entryPoints: {
        hccs: './src/index.ts',
        hccs_combat: './src/combat.ts',
        hccs_pre: './src/pre.ts',
        hccs_ascend: './src/ascend.ts',
    },
    outdir: "KoLmafia/scripts/bb-hccs",
    bundle: true,
    minifySyntax: true,
    platform: "node",
    target: "rhino1.7.14",
    external: ["kolmafia"],
    plugins: [babel()],
    loader: {
        ".json": "text"
    },
    inject: ["./kolmafia-polyfill.js"],
    define: {
        "process.env.NODE_ENV": '"production"',
    },
});