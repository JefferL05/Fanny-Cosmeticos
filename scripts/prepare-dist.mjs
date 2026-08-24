import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "out");
const destination = resolve(root, "dist");
const server = resolve(destination, "server");
const assets = resolve(destination, "assets");

await rm(destination, { recursive: true, force: true });
await mkdir(server, { recursive: true });
await cp(source, assets, { recursive: true });
await cp(resolve(root, "worker", "index.js"), resolve(server, "index.js"));
await mkdir(resolve(destination, ".openai"), { recursive: true });
await cp(resolve(root, ".openai", "hosting.json"), resolve(destination, ".openai", "hosting.json"));
