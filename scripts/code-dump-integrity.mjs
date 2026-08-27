import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const MANIFEST_PREFIX = '@@CODE-DUMP-MANIFEST ';
const FILE_PREFIX = '@@CODE-DUMP-FILE ';
const FILE_END = '@@CODE-DUMP-END@@';
const REDACTION_SENTINEL = '[' + 'REDACTED:';

export const sha256Text = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

function safeRelativePath(value) {
  const raw = String(value || '').replaceAll('\\', '/');
  if (!raw || raw.startsWith('/') || /^[A-Za-z]:\//.test(raw)) throw new Error(`Unsafe code-dump path: ${value}`);
  const normalised = path.posix.normalize(raw);
  if (normalised === '..' || normalised.startsWith('../') || normalised.includes('/../')) throw new Error(`Unsafe code-dump path: ${value}`);
  return normalised.replace(/^\.\//, '');
}

function parseHeader(line, prefix, label) {
  if (!line.startsWith(prefix)) throw new Error(`Malformed ${label} header`);
  try { return JSON.parse(line.slice(prefix.length)); }
  catch (error) { throw new Error(`Malformed ${label} JSON: ${error.message}`); }
}

export function parseCodeDump(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  if (source.includes(REDACTION_SENTINEL)) throw new Error('Code dump contains a redaction sentinel and is unsafe to reconstruct.');

  const manifestIndex = source.indexOf(MANIFEST_PREFIX);
  if (manifestIndex < 0) throw new Error('Code-dump manifest is missing.');
  const manifestLineEnd = source.indexOf('\n', manifestIndex);
  if (manifestLineEnd < 0) throw new Error('Code-dump manifest line is incomplete.');
  const manifest = parseHeader(source.slice(manifestIndex, manifestLineEnd).replace(/\r$/, ''), MANIFEST_PREFIX, 'manifest');
  if (manifest?.algorithm !== 'sha256' || !Array.isArray(manifest.files)) throw new Error('Unsupported or malformed code-dump manifest.');

  const blocks = new Map();
  let cursor = manifestLineEnd + 1;
  while (true) {
    const start = source.indexOf(FILE_PREFIX, cursor);
    if (start < 0) break;
    const headerEnd = source.indexOf('\n', start);
    if (headerEnd < 0) throw new Error('Code-dump file header is incomplete.');
    const metadata = parseHeader(source.slice(start, headerEnd).replace(/\r$/, ''), FILE_PREFIX, 'file');
    const filePath = safeRelativePath(metadata.path);
    const endMarker = source.indexOf(`\n${FILE_END}`, headerEnd + 1);
    if (endMarker < 0) throw new Error(`Code-dump terminator missing for ${filePath}`);
    const content = source.slice(headerEnd + 1, endMarker);
    if (content.includes(REDACTION_SENTINEL)) throw new Error(`Redaction sentinel detected in ${filePath}`);
    if (blocks.has(filePath)) throw new Error(`Duplicate code-dump file block: ${filePath}`);
    blocks.set(filePath, { metadata, content });
    cursor = endMarker + 1 + FILE_END.length;
  }

  const manifestFiles = new Map();
  for (const entry of manifest.files) {
    const filePath = safeRelativePath(entry.path);
    if (manifestFiles.has(filePath)) throw new Error(`Duplicate manifest path: ${filePath}`);
    manifestFiles.set(filePath, entry);
  }
  if (blocks.size !== manifestFiles.size) throw new Error(`Code-dump file count mismatch: manifest=${manifestFiles.size}, blocks=${blocks.size}`);

  const verified = [];
  for (const [filePath, entry] of manifestFiles) {
    const block = blocks.get(filePath);
    if (!block) throw new Error(`Code-dump block missing: ${filePath}`);
    const blockPath = safeRelativePath(block.metadata.path);
    if (blockPath !== filePath) throw new Error(`Code-dump path mismatch: ${filePath}`);
    const chars = block.content.length;
    const hash = sha256Text(block.content);
    const expectedChars = Number(entry.chars ?? block.metadata.chars);
    const expectedHash = String(entry.sha256 ?? block.metadata.sha256 ?? '').toLowerCase();
    if (!Number.isInteger(expectedChars) || expectedChars < 0 || chars !== expectedChars) throw new Error(`Character-count mismatch for ${filePath}: expected=${expectedChars}, actual=${chars}`);
    if (!/^[a-f0-9]{64}$/.test(expectedHash) || hash !== expectedHash) throw new Error(`SHA-256 mismatch for ${filePath}: expected=${expectedHash}, actual=${hash}`);
    if (block.metadata.chars != null && Number(block.metadata.chars) !== chars) throw new Error(`File-header character-count mismatch for ${filePath}`);
    if (block.metadata.sha256 != null && String(block.metadata.sha256).toLowerCase() !== hash) throw new Error(`File-header SHA-256 mismatch for ${filePath}`);
    verified.push({ path: filePath, chars, sha256: hash, content: block.content });
  }
  return { manifest, files: verified };
}

export function reconstructCodeDump(text, outputDirectory, { overwrite = false } = {}) {
  const verified = parseCodeDump(text); // Verify the entire dump before any write.
  const targetRoot = path.resolve(outputDirectory);
  if (fs.existsSync(targetRoot) && !overwrite && fs.readdirSync(targetRoot).length) throw new Error(`Output directory is not empty: ${targetRoot}`);
  for (const file of verified.files) {
    const destination = path.resolve(targetRoot, file.path);
    const relative = path.relative(targetRoot, destination);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Reconstruction path escapes output directory: ${file.path}`);
  }
  fs.mkdirSync(targetRoot, { recursive: true });
  for (const file of verified.files) {
    const destination = path.resolve(targetRoot, file.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file.content, 'utf8');
  }
  return { outputDirectory: targetRoot, filesWritten: verified.files.length };
}

function usage() {
  console.error('Usage: node scripts/code-dump-integrity.mjs <code-dump.txt> [output-directory] [--verify-only] [--overwrite]');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  const overwrite = args.includes('--overwrite');
  const positional = args.filter((arg) => !arg.startsWith('--'));
  if (!positional[0] || (!verifyOnly && !positional[1])) { usage(); process.exit(2); }
  try {
    const text = fs.readFileSync(positional[0], 'utf8');
    if (verifyOnly) {
      const result = parseCodeDump(text);
      console.log(`CODE_DUMP_INTEGRITY: PASS (${result.files.length} files)`);
    } else {
      const result = reconstructCodeDump(text, positional[1], { overwrite });
      console.log(`CODE_DUMP_RECONSTRUCTION: PASS (${result.filesWritten} files -> ${result.outputDirectory})`);
    }
  } catch (error) {
    console.error(`CODE_DUMP_INTEGRITY: FAIL - ${error.message}`);
    process.exit(1);
  }
}
