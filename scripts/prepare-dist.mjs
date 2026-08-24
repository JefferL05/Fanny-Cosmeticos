import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, ".open-next");
const destination = resolve(root, "dist");
const server = resolve(destination, "server");

await rm(destination, { recursive: true, force: true });
await mkdir(server, { recursive: true });
await cp(source, server, { recursive: true });
await cp(resolve(source, "worker.js"), resolve(server, "index.js"));
await cp(resolve(source, "assets"), resolve(destination, "assets"), { recursive: true });
await mkdir(resolve(destination, ".openai"), { recursive: true });
await cp(resolve(root, ".openai", "hosting.json"), resolve(destination, ".openai", "hosting.json"));
