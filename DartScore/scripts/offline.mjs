import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../dist/", import.meta.url);
async function list(path = "") {
  const items = await readdir(new URL(path, root), { withFileTypes: true });
  return (
    await Promise.all(
      items
        .filter((i) => i.name !== "sw.js" && i.name !== "desktop.ini")
        .map((i) =>
          i.isDirectory() ? list(`${path}${i.name}/`) : `${path}${i.name}`,
        ),
    )
  ).flat();
}
const files = await list();
const hash = createHash("sha256");
for (const file of files.sort())
  hash.update(await readFile(new URL(file, root)));
const version = hash.digest("hex").slice(0, 16);
const template = await readFile(
  new URL("./sw-template.js", import.meta.url),
  "utf8",
);
await writeFile(
  new URL("sw.js", root),
  template
    .replace("__VERSION__", version)
    .replace("__ASSETS__", JSON.stringify(files)),
);
console.log(`Offline shell: ${files.length} assets, ${version}`);
