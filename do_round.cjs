const sharp = require('sharp');
async function run() {
  const meta = await sharp('public/logo.png').metadata();
  const size = meta.width;
  const radius = Math.floor(size * 0.22);
  const roundedCorners = Buffer.from('<svg><rect x="0" y="0" width="' + size + '" height="' + size + '" rx="' + radius + '" ry="' + radius + '"/></svg>');
  await sharp('public/logo.png').composite([{ input: roundedCorners, blend: 'dest-in' }]).png().toFile('public/logo-rounded.png');
  console.log('Success rounded');
}
run();
