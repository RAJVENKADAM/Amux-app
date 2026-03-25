const fs = require('fs');
const path = require('path');

// Simple PNG file creator for solid color images
function createSolidPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression method
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace method
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // IDAT chunk (image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }
  
  const compressedData = require('zlib').deflateSync(Buffer.from(rawData));
  
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from(compressedData.length >>> 24, compressedData.length >>> 16, compressedData.length >>> 8, compressedData.length),
    Buffer.from('IDAT'),
    compressedData,
    idatCrc
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    iendCrc
  ]);
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation
function crc32(data) {
  let crc = 0xffffffff;
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  
  crc = crc ^ 0xffffffff;
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(crc >>> 0, 0);
  return buffer;
}

let crcTable;
function getCRC32Table() {
  if (crcTable) return crcTable;
  
  crcTable = new Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }
  return crcTable;
}

// Create images
const assetsDir = path.join(__dirname, 'assets');

// Icon (1024x1024) - Purple gradient-like color
const iconBuffer = createSolidPNG(1024, 1024, 102, 126, 234);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
console.log('✓ Created icon.png (1024x1024)');

// Splash (1242x2436) - Same purple color
const splashBuffer = createSolidPNG(1242, 2436, 102, 126, 234);
fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashBuffer);
console.log('✓ Created splash.png (1242x2436)');

// Adaptive icon (1024x1024) - Same purple
const adaptiveBuffer = createSolidPNG(1024, 1024, 102, 126, 234);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveBuffer);
console.log('✓ Created adaptive-icon.png (1024x1024)');

// Favicon (48x48) - Same purple
const faviconBuffer = createSolidPNG(48, 48, 102, 126, 234);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuffer);
console.log('✓ Created favicon.png (48x48)');

console.log('\nAll placeholder images created successfully!');
