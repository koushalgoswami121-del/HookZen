const sharp = require('sharp');
const fs = require('fs');

async function processImage() {
  try {
    const rawImage = await sharp('public/logo.png').metadata();
    const size = rawImage.width || 1024;
    const cornerRadius = Math.floor(size * 0.22); // Beautiful rounded app icon style
    
    const svgMask = <svg width="$size" height="$size">
      <rect x="0" y="0" width="$size" height="$size" rx="$cornerRadius" ry="$cornerRadius" fill="white" />
    </svg>;
    
    await sharp('public/logo.png')
      .resize(size, size)
      .composite([{
        input: Buffer.from(svgMask),
        blend: 'dest-in'
      }])
      .png()
      .toFile('public/logo-rounded.png');
      
    console.log('Rounded image created properly!');
  } catch (error) {
    console.error('Failed:', error);
  }
}
processImage();
