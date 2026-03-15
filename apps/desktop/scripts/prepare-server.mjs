/**
 * Prepares the Next.js standalone server for bundling into the Tauri app.
 *
 * 1. Copies .next/static and public/ into the standalone dir
 * 2. Optionally copies .env
 * 3. Copies the whole standalone dir to server-bundle/ with dereference: true
 *    so all pnpm symlinks are resolved to real files (Tauri can't bundle
 *    virtual-store symlink paths that don't physically exist)
 *
 * Run from apps/desktop/ before `tauri build`.
 */
import { existsSync, copyFileSync, rmSync, cpSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { spawnSync, execSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopDir = resolve(__dirname, "..")
const webDir = resolve(__dirname, "../../web")
const standaloneDir = resolve(webDir, ".next/standalone")
const bundleDir = resolve(desktopDir, "server-bundle")

if (!existsSync(standaloneDir)) {
  console.error("❌ .next/standalone not found — run `pnpm --filter web build` first.")
  process.exit(1)
}

// .next/static → standalone/.next/static
const staticSrc = resolve(webDir, ".next/static")
const staticDest = resolve(standaloneDir, ".next/static")
if (existsSync(staticSrc)) {
  if (existsSync(staticDest)) rmSync(staticDest, { recursive: true, force: true })
  cpSync(staticSrc, staticDest, { recursive: true, dereference: true })
  console.log("✓ Copied .next/static")
}

// public/ → standalone/public/
const publicSrc = resolve(webDir, "public")
const publicDest = resolve(standaloneDir, "public")
if (existsSync(publicSrc)) {
  if (existsSync(publicDest)) rmSync(publicDest, { recursive: true, force: true })
  cpSync(publicSrc, publicDest, { recursive: true, dereference: true })
  console.log("✓ Copied public/")
}

// .env → standalone/.env (skip if missing)
const envSrc = resolve(webDir, ".env")
const envDest = resolve(standaloneDir, ".env")
if (existsSync(envSrc)) {
  copyFileSync(envSrc, envDest)
  console.log("✓ Copied .env")
} else {
  console.log("⚠  No .env found — environment variables must be set at runtime.")
}

// Resolve all pnpm symlinks into real files so Tauri's bundler is happy.
// rsync -aL (--copy-links) turns every symlink into the file/dir it points to.
// Exit code 23 = "partial transfer due to error" — happens when the standalone
// contains dangling symlinks (e.g. packages Next.js excluded). That's fine;
// those packages aren't needed at runtime either.
console.log("\nDereferencing symlinks into server-bundle/ (may take a moment)…")
if (existsSync(bundleDir)) rmSync(bundleDir, { recursive: true, force: true })
const rsync = spawnSync("rsync", ["-aL", `${standaloneDir}/`, bundleDir], { stdio: "inherit" })
if (rsync.status !== 0 && rsync.status !== 23) {
  console.error(`❌ rsync failed with exit code ${rsync.status}`)
  process.exit(1)
}

// Embed the exact node binary path so the .app can find it regardless of PATH.
// macOS app bundles launch with a stripped environment — Homebrew/nvm aren't on PATH.
const nodePath = execSync("which node").toString().trim()
writeFileSync(resolve(bundleDir, ".node-path"), nodePath)
console.log(`✓ Embedded node path: ${nodePath}`)

console.log("✅ server-bundle ready for Tauri.")
