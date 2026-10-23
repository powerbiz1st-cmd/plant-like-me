import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeId, withUtm } from '../assets/js/links.js';

test('유형 id', () => {
  assert.equal(typeId('monstera', 'water'), 'monstera-water');
});

test('UTM: 기존 쿼리를 유지하고 출처와 유형 id를 붙인다', () => {
  const u = new URL(withUtm('https://example.com/product/detail.html?product_no=330', 'share', 'monstera-water'));
  assert.equal(u.searchParams.get('product_no'), '330');
  assert.equal(u.searchParams.get('utm_source'), 'share');
  assert.equal(u.searchParams.get('utm_content'), 'monstera-water');
});

test('UTM: 쿼리가 없는 주소도 처리한다', () => {
  const u = new URL(withUtm('https://example.com/p', 'fortune', 'palm-soil'));
  assert.equal(u.searchParams.get('utm_source'), 'fortune');
});
