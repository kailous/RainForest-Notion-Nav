/**
 * 生成扩展图标
 * 运行: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// 简单的 PNG 生成器 (1x1 像素作为占位符)
// 实际使用时替换为真实图标文件

const sizes = [16, 48, 128];
const iconDir = path.join(__dirname, 'icons');

// 确保目录存在
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// 生成占位图标 (纯色 PNG)
// 这会产生一个简单的彩色方块作为占位符
sizes.forEach(size => {
  // PNG 文件头 + IHDR + IDAT + IEND (最小的有效 PNG)
  // 这里使用 base64 编码的简单灰色方块 PNG
  const placeholder = createPlaceholderPng(size);
  fs.writeFileSync(path.join(iconDir, `icon${size}.png`), placeholder);
  console.log(`Created icon${size}.png`);
});

function createPlaceholderPng(size) {
  // 创建一个简单的 RGBA PNG
  // PNG 结构: 签名 + IHDR + IDAT + IEND
  const width = size;
  const height = size;

  // PNG 签名
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(6, 9);          // color type (RGBA)
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);        // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (压缩的图像数据)
  // 使用 zlib 压缩
  const zlib = require('zlib');

  // 创建原始图像数据 (每行: filter byte + RGBA pixels)
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // 创建渐变蓝色图标
      rawData[pixelOffset] = 37;     // R
      rawData[pixelOffset + 1] = 99; // G
      rawData[pixelOffset + 2] = 235; // B
      rawData[pixelOffset + 3] = 255; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 实现
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

console.log('Icons generated successfully!');
console.log('Note: Replace these with your custom icons for production.');
