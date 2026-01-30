import { execSwiftlint, type ExecOptions } from "./process";
import { additionalParameters, configSearchPaths } from "./config";

function findConfigArg(cwd: string): string[] {
  const paths = configSearchPaths();
  if (paths.length === 0) return [];
  return ["--config", paths[0]];
}

export async function fixFile(
  filePath: string,
  cwd: string,
): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--quiet",
    ...findConfigArg(cwd),
    ...additionalParameters(),
    filePath,
  ];
  await execSwiftlint(args, { cwd });
}

export async function fixWorkspace(folder: string): Promise<void> {
  const args = [
    "lint",
    "--fix",
    "--quiet",
    ...findConfigArg(folder),
    ...additionalParameters(),
  ];
  await execSwiftlint(args, { cwd: folder });
}
