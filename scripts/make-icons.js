import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { siteConfig } from '../src/components/config.js';
import { PICK_PATH } from '../src/lib/pick-path.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const BRAND = siteConfig.colors.brand;
const GLYPH = '#ffffff';

/**
 * A guitar pick. `radius` is 0 for the variants a platform masks for itself, and `scale`
 * shrinks the glyph for the maskable pair: at full size the pick's widest points fall just
 * outside the central 80% circle that is all a maskable icon is guaranteed to keep.
 */
function tile(radius, scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="${BRAND}"/>
  <path d="${PICK_PATH}" fill="${GLYPH}" transform="translate(256 256) scale(${scale}) translate(-256 -256)"/>
</svg>
`;
}

const rounded = tile(112);
const square = tile(0);
const maskable = tile(0, 0.82);

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/**
 * An .ico is a directory of whole images, and every browser in use reads PNG entries, so the
 * container is the only part that has to be assembled by hand.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

await mkdir(join(root, 'public/icons'), { recursive: true });

await writeFile(join(root, 'src/app/icon.svg'), rounded);

const written = [
  ['src/app/apple-icon.png', await png(square, 180)],
  ['public/icons/icon-192.png', await png(rounded, 192)],
  ['public/icons/icon-512.png', await png(rounded, 512)],
  ['public/icons/icon-maskable-192.png', await png(maskable, 192)],
  ['public/icons/icon-maskable-512.png', await png(maskable, 512)],
  [
    'src/app/favicon.ico',
    ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))),
  ],
];

for (const [path, data] of written) {
  await writeFile(join(root, path), data);
  console.log(`${path} — ${data.length} bytes`);
}
console.log('src/app/icon.svg — source of truth for all of the above');
