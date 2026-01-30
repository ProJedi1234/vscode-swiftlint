import * as fs from "node:fs";
import { execSwiftlint, type ExecOptions } from "./process";
import { additionalParameters, configSearchPaths } from "./config";

function explicitConfigArgs(): string[] {
  const paths = configSearchPaths();
  if (paths.length === 0) return [];
  const valid = paths.find((p) => fs.existsSync(p));
  if (!valid) return [];
  return ["--config", valid];
}

export async function fixFile(
  filePath: string,
  cwd: string,
): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--quiet",
    ...explicitConfigArgs(),
    ...additionalParameters(),
    filePath,
  ];
  await execSwiftlint(args, { cwd });
}

export async function formatFile(
  filePath: string,
  cwd: string,
): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--format",
    "--quiet",
    ...explicitConfigArgs(),
    ...additionalParameters(),
    filePath,
  ];
  await execSwiftlint(args, { cwd });
}

export async function formatWorkspace(folder: string): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--format",
    "--quiet",
    ...explicitConfigArgs(),
    ...additionalParameters(),
  ];
  await execSwiftlint(args, { cwd: folder });
}

export async function fixWorkspace(folder: string): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--quiet",
    ...explicitConfigArgs(),
    ...additionalParameters(),
  ];
  await execSwiftlint(args, { cwd: folder });
}
