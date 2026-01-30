import { execSwiftlint } from "./process";
import { additionalParameters, explicitConfigArgs } from "./config";

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
