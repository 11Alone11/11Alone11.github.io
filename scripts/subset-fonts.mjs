import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const dir = 'src/assets/fonts';

// characters we actually need: ASCII, Cyrillic, punctuation, arrows, №, €, dashes
const chars = [];
const ranges = [[0x20, 0x7E], [0x401, 0x45F], [0x490, 0x491], [0x2010, 0x2027], [0x2030, 0x2030],
                [0x20AC, 0x20AC], [0x2116, 0x2116], [0x2122, 0x2122], [0x2190, 0x2193], [0x2212, 0x2212],
                [0x00AB, 0x00BB], [0x0401, 0x0401], [0x045E, 0x045E], [0x2013, 0x2014], [0x2026, 0x2026]];
for (const [a, b] of ranges) for (let c = a; c <= b; c++) chars.push(String.fromCodePoint(c));
const text = [...new Set(chars)].join('');

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.woff2') && !f.includes('.sub'))) {
  const input = fs.readFileSync(path.join(dir, file));
  const out = await subsetFont(input, text, { targetFormat: 'woff2' });
  const name = file.replace('.woff2', '.sub.woff2');
  fs.writeFileSync(path.join(dir, name), out);
  console.log(name, (out.length / 1024).toFixed(1) + ' KB');
}
