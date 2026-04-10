import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/aptus-lock-card.ts",
  output: {
    file: "dist/aptus-lock-card.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    resolve(),
    typescript(),
    terser({ format: { comments: false } }),
  ],
};
