import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ohaengOf, zodiacOf, iljinIndex, relationOf, fortuneOf, daysInMonth, yearGanjiIndex } from '../assets/js/calc.js';

const GAN = '갑을병정무기경신임계';
const JI = '자축인묘진사오미신유술해';
const ganji = (i) => GAN[i % 10] + JI[i % 12];

test('일진: 알려진 날짜 쌍', () => {
  assert.equal(ganji(iljinIndex(2000, 1, 1)), '무오');
  assert.equal(ganji(iljinIndex(1949, 10, 1)), '갑자');
  assert.equal(ganji(iljinIndex(2024, 2, 10)), '갑진');
});

test('일진: 다음 날은 순번이 1 늘고 60일 뒤에 돌아온다', () => {
  assert.equal(iljinIndex(2000, 1, 2), 55);
  assert.equal(iljinIndex(2000, 3, 1), iljinIndex(2000, 1, 1)); // 2000-01-01 + 60일 = 2000-03-01
  assert.equal(iljinIndex(1999, 12, 31), 53);
});

test('띠: 음력 설 전후 (알려진 설날)', () => {
  const z = (y, m, d) => zodiacOf(y, m, d).index;
  assert.equal(z(2020, 1, 24), 11); // 돼지
  assert.equal(z(2020, 1, 25), 0);  // 쥐 (2020 설날)
  assert.equal(z(2000, 2, 4), 3);   // 토끼
  assert.equal(z(2000, 2, 5), 4);   // 용 (2000 설날)
  assert.equal(z(1990, 1, 26), 5);  // 뱀
  assert.equal(z(1990, 1, 27), 6);  // 말 (1990 설날)
  assert.equal(z(1984, 2, 1), 11);  // 돼지
  assert.equal(z(1984, 2, 2), 0);   // 쥐 (1984 설날)
});

test('띠: 해 중간 날짜는 그 해의 띠', () => {
  assert.equal(zodiacOf(1975, 7, 15).index, 3);  // 토끼
  assert.equal(zodiacOf(1988, 10, 1).index, 4);  // 용
  assert.equal(zodiacOf(2024, 6, 1).index, 4);   // 용
  assert.equal(zodiacOf(1975, 7, 15).exact, true);
});

test('오행: 출생연도 끝자리', () => {
  const expected = { 0: 'metal', 1: 'metal', 2: 'water', 3: 'water', 4: 'wood', 5: 'wood', 6: 'fire', 7: 'fire', 8: 'earth', 9: 'earth' };
  for (let d = 0; d < 10; d++) assert.equal(ohaengOf(1970 + d), expected[d]);
});

test('띠와 일진 지지의 관계', () => {
  assert.equal(relationOf(0, 0), 'same');
  assert.equal(relationOf(0, 6), 'chung');
  assert.equal(relationOf(0, 1), 'yukhap');
  assert.equal(relationOf(11, 2), 'yukhap');
  assert.equal(relationOf(0, 4), 'samhap');
  assert.equal(relationOf(0, 8), 'samhap');
  assert.equal(relationOf(0, 2), 'normal');
});

const scoring = {
  base: { same: 1, yukhap: 2, samhap: 3, chung: 4, normal: 5 },
  spread: 5,
  colorByStemPair: ['wood', 'fire', 'earth', 'metal', 'water'],
};

test('운세: 같은 날과 띠는 항상 같은 값', () => {
  const a = fortuneOf(new Date(2025, 4, 20), 3, scoring);
  const b = fortuneOf(new Date(2025, 4, 20, 23, 59), 3, scoring);
  assert.deepEqual(a, b);
});

test('운세: 2000-01-01(무오일)은 천간 무 → 토 색, 지지 오', () => {
  const f = fortuneOf(new Date(2000, 0, 1), 0, scoring);
  assert.equal(f.branch, 6);
  assert.equal(f.colorId, 'earth');
  assert.equal(f.relation, 'chung'); // 쥐(0)와 오(6)
});

test('월별 날짜 수', () => {
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2023, 4), 30);
  assert.equal(daysInMonth(2023, 12), 31);
});

test('해의 간지: 알려진 해', () => {
  assert.equal(ganji(yearGanjiIndex(1984)), '갑자');
  assert.equal(ganji(yearGanjiIndex(1955)), '을미');
  assert.equal(ganji(yearGanjiIndex(2020)), '경자');
  assert.equal(zodiacOf(1955, 5, 20).year, 1955);
  assert.equal(zodiacOf(2020, 1, 24).year, 2019); // 설 전이면 전해 기준
});
