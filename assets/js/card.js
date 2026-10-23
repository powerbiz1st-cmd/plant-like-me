// 결과 이미지 카드를 브라우저 Canvas로 그린다. 카드를 만들 때만 불러온다(첫 화면 용량 절약).

const W = 1080;
const H = 1350;
const PAD = 72;
const FONT = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const LOGO_SRC = 'assets/img/logo-green.svg';
const LOGO_W = 220; // 하단 중앙에 작게

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 첫 화면의 SVG 정의를 그대로 담아 독립 SVG 이미지로 만든다
async function plantSvgImage(symbolId, size) {
  const defs = document.getElementById('plant-defs').innerHTML;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" width="${size}" height="${size}">` +
    `${defs}<use href="#${symbolId}" width="84" height="84"/></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// 단어 단위로 줄을 나누고, 한 단어가 너무 길면 글자 단위로 나눈다. 반환값: 다음 y
function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) { line = next; continue; }
    if (line) lines.push(line);
    line = '';
    for (const ch of word) {
      if (ctx.measureText(line + ch).width > maxWidth) { lines.push(line); line = ch; } else line += ch;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + Math.min(lines.length, maxLines) * lineHeight;
}

/* data: { symbolId, photoSrc, modifier, plantName, tagLabel, tagType, typeLine, zodiacLine, personName, nameSuffix } */
export async function drawCard(data) {
  await Promise.all([
    document.fonts.load(`400 40px "Noto Sans KR"`),
    document.fonts.load(`500 40px "Noto Sans KR"`),
    document.fonts.load(`700 40px "Noto Sans KR"`),
  ]);
  const [plantImg, photo, logo] = await Promise.all([
    plantSvgImage(data.symbolId, 440),
    loadImage(data.photoSrc),
    loadImage(LOGO_SRC),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = token('--bg');
  ctx.fillRect(0, 0, W, H);

  // 그림과 사진
  const tile = 440;
  const tileY = 110;
  roundRect(ctx, PAD, tileY, tile, tile, 40);
  ctx.fillStyle = token('--card');
  ctx.fill();
  ctx.drawImage(plantImg, PAD + 40, tileY + 40, tile - 80, tile - 80);

  ctx.save();
  roundRect(ctx, W - PAD - tile, tileY, tile, tile, 40);
  ctx.clip();
  ctx.drawImage(photo, W - PAD - tile, tileY, tile, tile);
  ctx.restore();

  // 글
  let y = tileY + tile + 90;
  const maxWidth = W - PAD * 2;
  if (data.personName) {
    ctx.fillStyle = token('--ink-soft');
    ctx.font = `500 40px ${FONT}`;
    ctx.fillText(`${data.personName}${data.nameSuffix}`, PAD, y);
    y += 64;
  }
  ctx.fillStyle = token('--ink-soft');
  ctx.font = `400 40px ${FONT}`;
  ctx.fillText(data.modifier, PAD, y);
  y += 110;

  ctx.fillStyle = token('--ink');
  ctx.font = `700 96px ${FONT}`;
  ctx.fillText(data.plantName, PAD, y);

  // 태그
  ctx.font = `500 34px ${FONT}`;
  const tagW = ctx.measureText(data.tagLabel).width + 56;
  ctx.font = `700 96px ${FONT}`;
  const nameW = ctx.measureText(data.plantName).width;
  const tagBoxX = PAD + nameW + 28;
  roundRect(ctx, tagBoxX, y - 54, tagW, 60, 30);
  ctx.fillStyle = token(`--${data.tagType === 'water' ? 'water' : 'soil'}-bg`);
  ctx.fill();
  ctx.fillStyle = token(`--${data.tagType === 'water' ? 'water' : 'soil'}-ink`);
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(data.tagLabel, tagBoxX + 28, y - 11);

  y += 70;
  ctx.fillStyle = token('--ink');
  ctx.font = `500 42px ${FONT}`;
  y = drawWrapped(ctx, data.typeLine, PAD, y, maxWidth, 62, 2);
  y += 24;
  ctx.fillStyle = token('--ink-soft');
  ctx.font = `400 38px ${FONT}`;
  drawWrapped(ctx, data.zodiacLine, PAD, y, maxWidth, 58, 3);

  const logoH = LOGO_W * (logo.naturalHeight / logo.naturalWidth || 25 / 128);
  ctx.drawImage(logo, (W - LOGO_W) / 2, H - PAD - logoH, LOGO_W, logoH);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
