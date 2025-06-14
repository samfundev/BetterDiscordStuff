import { context } from "esbuild";
import { glob, watch } from "fs/promises";
import bdPlugin from "./bd-plugin.ts";

const ctx = await context({
	entryPoints: await Array.fromAsync(glob("src/**/index.*")),
	outdir: "Plugins",
	entryNames: "[dir]/[dir].plugin",
	outbase: "src",
	plugins: [bdPlugin],
});

await ctx.watch();

// watch for changes to package.json and reload the context
for await (const event of watch("src")) {
	if (event.filename.endsWith("package.json")) {
		console.log("Reloading context due to package.json change...");
		await ctx.rebuild();
	}
}
