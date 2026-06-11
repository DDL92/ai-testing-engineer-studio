export function getCliArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}
