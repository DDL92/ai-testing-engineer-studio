import fs = require('fs');
import path = require('path');
import { AllowedArea, DashboardArea, getAllowedArea } from '../config/paths';

export interface LocalFile {
  area: DashboardArea;
  areaLabel: string;
  name: string;
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: string;
}

export interface LocalFileContent extends LocalFile {
  content: string;
}

export interface LocalBinaryFile extends LocalFile {
  content: Buffer;
  contentType: string;
}

export function listFiles(areaId: DashboardArea, extensions: string[] = []): LocalFile[] {
  const area = getAllowedArea(areaId);
  if (!area || !fs.existsSync(area.root)) return [];
  const files = walk(area.root)
    .filter((filePath) => extensions.length === 0 || extensions.includes(path.extname(filePath).toLowerCase()))
    .map((filePath) => toLocalFile(area, filePath))
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt) || a.relativePath.localeCompare(b.relativePath));
  return files;
}

export function readLocalFile(areaId: string | undefined, relativePath: string | undefined): LocalFileContent | undefined {
  const area = getAllowedArea(areaId);
  if (!area || !relativePath) return undefined;

  const fullPath = safeResolve(area.root, relativePath);
  if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return undefined;

  return {
    ...toLocalFile(area, fullPath),
    content: fs.readFileSync(fullPath, 'utf8'),
  };
}

export function readLocalBinaryFile(areaId: string | undefined, relativePath: string | undefined): LocalBinaryFile | undefined {
  const area = getAllowedArea(areaId);
  if (!area || !relativePath) return undefined;

  const fullPath = safeResolve(area.root, relativePath);
  if (!fullPath || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) return undefined;

  const file = toLocalFile(area, fullPath);
  if (file.extension !== '.png') return undefined;

  return {
    ...file,
    content: fs.readFileSync(fullPath),
    contentType: 'image/png',
  };
}

export function readTextIfExists(areaId: DashboardArea, relativePath: string): string {
  return readLocalFile(areaId, relativePath)?.content ?? '';
}

export function readJsonIfExists<T>(areaId: DashboardArea, relativePath: string, fallback: T): T {
  const content = readTextIfExists(areaId, relativePath).trim();
  if (!content) return fallback;
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export function fileExists(areaId: DashboardArea, relativePath: string): boolean {
  const area = getAllowedArea(areaId);
  if (!area) return false;
  const fullPath = safeResolve(area.root, relativePath);
  return Boolean(fullPath && fs.existsSync(fullPath));
}

function walk(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function toLocalFile(area: AllowedArea, filePath: string): LocalFile {
  const stat = fs.statSync(filePath);
  const relativePath = path.relative(area.root, filePath);
  return {
    area: area.id,
    areaLabel: area.label,
    name: path.basename(filePath),
    relativePath,
    extension: path.extname(filePath).toLowerCase(),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  };
}

function safeResolve(root: string, relativePath: string): string | undefined {
  const resolved = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root);
  if (resolved === normalizedRoot || resolved.startsWith(`${normalizedRoot}${path.sep}`)) return resolved;
  return undefined;
}
