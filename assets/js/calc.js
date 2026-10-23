// 띠, 오행, 일진, 오늘의 운세 계산. 화면과 무관한 순수 함수만 둔다(문구는 content/*.json).
// 같은 날, 같은 띠면 항상 같은 결과가 나온다(무작위 없음).

const DAY_MS = 86400000;

// 일진 기준: 2000-01-01은 무오일(60갑자 순번 54, 갑자=0).
const REF_DAY = Math.floor(Date.UTC(2000, 0, 1) / DAY_MS);
const REF_INDEX = 54;

const mod = (n, m) => ((n % m) + m) % m;

/* 오행: 출생연도 끝자리. 0·1 금, 2·3 수, 4·5 목, 6·7 화, 8·9 토 */
const OHAENG_BY_DIGIT = ['metal', 'metal', 'water', 'water', 'wood', 'wood', 'fire', 'fire', 'earth', 'earth'];
export function ohaengOf(year) {
  return OHAENG_BY_DIGIT[mod(year, 10)];
}

/* 음력 연도: 브라우저의 중국력(Intl)으로 양력 날짜를 음력 해로 바꾼다. 지원하지 않으면 null */
export function lunarYearOf(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'UTC', year: 'numeric' }).formatToParts(date);
  const related = parts.find((p) => p.type === 'relatedYear');
  return related ? Number(related.value) : null;
}

/* 띠: 0 쥐, 1 소, 2 호랑이, 3 토끼, 4 용, 5 뱀, 6 말, 7 양, 8 원숭이, 9 닭, 10 개, 11 돼지
   boundary가 'lunar-new-year'면 음력 설 기준이다. 음력 변환이 안 되면 양력 연도로 대신하고 exact가 false다. */
export function zodiacOf(year, month, day, boundary = 'lunar-new-year') {
  let zodiacYear = year;
  let exact = boundary !== 'lunar-new-year';
  if (boundary === 'lunar-new-year') {
    const lunar = lunarYearOf(year, month, day);
    if (lunar !== null) { zodiacYear = lunar; exact = true; }
  }
  return { index: mod(zodiacYear - 4, 12), exact };
}

/* 일진: 날짜 → 60갑자 순번(0~59). 순번 % 10이 천간, 순번 % 12가 지지 */
export function iljinIndex(year, month, day) {
  const days = Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
  return mod(days - REF_DAY + REF_INDEX, 60);
}

/* 띠 지지와 일진 지지의 관계: same, yukhap(육합), chung(충), samhap(삼합), normal */
export function relationOf(zodiacBranch, dayBranch) {
  const diff = mod(zodiacBranch - dayBranch, 12);
  if (diff === 0) return 'same';
  if (diff === 6) return 'chung';
  const sum = zodiacBranch + dayBranch;
  if (sum === 1 || sum === 13) return 'yukhap';
  if (diff % 4 === 0) return 'samhap';
  return 'normal';
}

/* 오늘의 운세 값. tables는 content/fortune.json의 scoring 부분 */
export function fortuneOf(date, zodiacIndex, scoring) {
  const iljin = iljinIndex(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const stem = iljin % 10;
  const branch = iljin % 12;
  const relation = relationOf(zodiacIndex, branch);
  return {
    iljin,
    branch,
    relation,
    colorId: scoring.colorByStemPair[stem >> 1],
    score: scoring.base[relation] + (iljin % scoring.spread),
  };
}

/* 해당 연도·월의 날짜 수 */
export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
