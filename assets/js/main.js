import { STORE_NAME, CAFE24_DEAL_URL, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX, ZODIAC_BOUNDARY } from '../../config.js';
import { zodiacOf, ohaengOf, fortuneOf, daysInMonth } from './calc.js';

const WEEKDAYS = '일월화수목금토';
const MARQUEE_SPEED = 40; // 첫 화면 식물 목록이 흐르는 속도(px/초)
const $ = (id) => document.getElementById(id);
const views = document.querySelectorAll('.view');

// 입력값은 이 객체에만 두고, 저장하거나 전송하지 않는다.
let state = { birth: null, answers: [] };
let content = {};

async function loadJson(path) {
  const res = await fetch(path);
  return res.json();
}

function show(viewId, focusId) {
  views.forEach((v) => { v.hidden = v.id !== viewId; });
  window.scrollTo(0, 0);
  if (focusId) $(focusId).focus({ preventScroll: true });
}

function showToday() {
  const now = new Date();
  $('today').textContent =
    `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS.charAt(now.getDay())}요일`;
}

/* 첫 화면: 식물 4종 × 물형/흙형 카드를 만들고, 오른쪽에서 왼쪽으로 흐르게 한다 */
function renderStartPlants() {
  const { typeLabel, types, plants } = content.plants;
  const track = $('plants');
  for (const p of plants) {
    for (const type of types) {
      const li = document.createElement('li');
      li.className = 'plant';
      li.innerHTML = '<svg aria-hidden="true"><use></use></svg><strong></strong><span></span>';
      li.querySelector('use').setAttribute('href', `#p-${p.id}-${type}`);
      li.querySelector('strong').textContent = p.name;
      const tag = li.querySelector('span');
      tag.className = `tag ${type}`;
      tag.textContent = typeLabel[type];
      track.appendChild(li);
    }
  }
  setupMarquee(track);
}

function setupMarquee(track) {
  const box = $('marquee');
  const originals = [...track.children];
  // 끊김 없이 이어지도록 한 벌을 더 붙인다(스크린리더에서는 숨김)
  for (const li of originals) {
    const copy = li.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pos = 0;
  let loopWidth = 0;
  let dragging = false;
  let startX = 0;
  let startPos = 0;
  let last = performance.now();

  const apply = () => {
    pos = ((pos % loopWidth) + loopWidth) % loopWidth;
    track.style.transform = `translate3d(${-pos}px, 0, 0)`;
  };

  function frame(now) {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    if (box.offsetParent !== null) { // 첫 화면이 보일 때만
      if (!loopWidth) loopWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
      if (loopWidth) {
        if (!dragging && !reduceMotion.matches) pos += MARQUEE_SPEED * dt;
        apply();
      }
    }
    requestAnimationFrame(frame);
  }

  box.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startPos = pos;
    box.classList.add('dragging');
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', (e) => {
    if (dragging && loopWidth) { pos = startPos - (e.clientX - startX); apply(); }
  });
  const release = () => { dragging = false; box.classList.remove('dragging'); };
  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);
  box.addEventListener('lostpointercapture', release);
  box.addEventListener('wheel', (e) => {
    if (loopWidth && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { pos += e.deltaX; apply(); e.preventDefault(); }
  }, { passive: false });
  window.addEventListener('resize', () => { loopWidth = 0; });

  requestAnimationFrame(frame);
}

/* 출생일: 연도·월·일 */
function fillSelect(select, placeholder, from, to, step, unit) {
  select.replaceChildren(new Option(placeholder, ''));
  for (let n = from; n !== to + step; n += step) select.add(new Option(`${n}${unit}`, String(n)));
}

function setupBirth() {
  const { year, ui } = content.questions;
  $('year-title').textContent = year.title;
  $('year-sub').textContent = year.sub;
  $('year-next').textContent = year.button;

  const ySel = $('year');
  const mSel = $('month');
  const dSel = $('day');
  fillSelect(ySel, year.yearPlaceholder, BIRTH_YEAR_MAX, BIRTH_YEAR_MIN, -1, year.yearUnit);
  fillSelect(mSel, year.monthPlaceholder, 1, 12, 1, year.monthUnit);

  const refreshDays = () => {
    const keep = Number(dSel.value);
    const max = daysInMonth(Number(ySel.value) || 2000, Number(mSel.value) || 1); // 연도·월 전에는 윤년 기준
    fillSelect(dSel, year.dayPlaceholder, 1, max, 1, year.dayUnit);
    if (keep) dSel.value = String(Math.min(keep, max));
  };
  const refreshButton = () => { $('year-next').disabled = !(ySel.value && mSel.value && dSel.value); };

  refreshDays();
  ySel.addEventListener('change', () => { refreshDays(); refreshButton(); });
  mSel.addEventListener('change', () => { refreshDays(); refreshButton(); });
  dSel.addEventListener('change', refreshButton);

  $('year-next').addEventListener('click', () => {
    state.birth = { year: Number(ySel.value), month: Number(mSel.value), day: Number(dSel.value) };
    showQuestion(0);
  });
  document.querySelectorAll('[data-back]').forEach((b) => { b.textContent = ui.back; });
}

function resetBirthForm() {
  $('year').value = '';
  $('month').value = '';
  $('day').value = '';
  $('year-next').disabled = true;
}

/* 질문 */
function showQuestion(index) {
  const q = content.questions.questions[index];
  $('progress').textContent = `${index + 1} / ${content.questions.questions.length}`;
  $('q-title').textContent = q.title;
  const box = $('choices');
  box.replaceChildren();
  for (const a of q.answers) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.textContent = a.text;
    btn.addEventListener('click', () => {
      state.answers[index] = a.id;
      if (index + 1 < content.questions.questions.length) showQuestion(index + 1);
      else showResult();
    });
    box.appendChild(btn);
  }
  state.answers.length = index;
  show('view-question', 'q-title');
}

/* 결과: Q1은 물형/흙형, Q2·Q3은 식물, 출생일은 띠와 오행, 오늘 날짜는 운세 */
function showResult() {
  const { rules } = content.questions;
  const [a1, a2, a3] = state.answers;
  const type = rules.typeByQ1[a1];
  const plant = content.plants.plants.find((p) => p.id === rules.plantByQ2Q3[a2 + a3]);
  const r = content.result;
  const { birth } = state;

  const zodiac = zodiacOf(birth.year, birth.month, birth.day, ZODIAC_BOUNDARY);
  const zodiacInfo = content.zodiac.zodiacs[zodiac.index];
  const ohaeng = ohaengOf(birth.year);
  const f = content.fortune;
  const today = fortuneOf(new Date(), zodiac.index, f.scoring);

  $('r-heading').textContent = r.heading;
  $('r-icon').setAttribute('href', `#p-${plant.id}-${type}`);
  $('r-modifier').textContent = content.ohaeng.modifier[ohaeng];
  $('r-name').textContent = plant.name;
  const tag = $('r-tag');
  tag.className = `tag ${type}`;
  tag.textContent = content.plants.typeLabel[type];
  $('r-intro').textContent = plant.intro;
  $('r-typeline').textContent = plant.typeLine[type];
  $('r-zodiac').textContent = content.zodiac.lineTemplate
    .replace('{띠}', zodiacInfo.name)
    .replace('{키워드}', zodiacInfo.keyword)
    .replace('{식물 특성}', plant.trait)
    .replace('{식물}', plant.name);

  $('f-title').textContent = f.labels.title;
  $('f-line').textContent = f.lines[today.iljin];
  $('f-color-label').textContent = f.labels.color;
  $('f-color').textContent = f.colors[today.colorId];
  $('f-time-label').textContent = f.labels.time;
  $('f-time').textContent = f.hours[today.branch];
  $('f-score-label').textContent = f.labels.score;
  $('f-score').textContent = `${today.score}${f.labels.scoreUnit}`;

  $('deal-title').textContent = r.dealTitle;
  $('deal-body').textContent = r.dealBody;
  $('browse').textContent = r.browseButton;
  $('browse-note').hidden = true;
  show('view-result', 'r-name');
}

function setupNavigation() {
  $('start').addEventListener('click', () => show('view-year', 'year-title'));
  $('restart').textContent = content.questions.ui.restart;
  $('restart').addEventListener('click', () => {
    state = { birth: null, answers: [] };
    resetBirthForm();
    show('view-start');
  });
  $('view-year').querySelector('[data-back]').addEventListener('click', () => show('view-start'));
  $('view-question').querySelector('[data-back]').addEventListener('click', () => {
    const current = state.answers.length;
    if (current > 0) showQuestion(current - 1);
    else show('view-year', 'year-title');
  });
  $('browse').addEventListener('click', () => {
    if (CAFE24_DEAL_URL) {
      window.location.href = CAFE24_DEAL_URL; // 출처 표시(UTM)는 5단계에서 붙입니다
    } else {
      $('browse-note').textContent = content.result.noUrlNotice;
      $('browse-note').hidden = false;
    }
  });
}

async function init() {
  const [questions, plants, result, zodiac, ohaeng, fortune] = await Promise.all([
    loadJson('content/questions.json'),
    loadJson('content/plants.json'),
    loadJson('content/result.json'),
    loadJson('content/zodiac.json'),
    loadJson('content/ohaeng.json'),
    loadJson('content/fortune.json'),
  ]);
  content = { questions, plants, result, zodiac, ohaeng, fortune };

  document.querySelectorAll('.store-name').forEach((el) => { el.textContent = STORE_NAME; });
  showToday();
  renderStartPlants();
  setupBirth();
  setupNavigation();
  // 시작 버튼 분석 이벤트는 5단계에서 연결합니다(입력값은 보내지 않음).
}

init();
