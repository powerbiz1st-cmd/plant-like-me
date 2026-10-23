import { STORE_NAME, CAFE24_DEAL_URL, BIRTH_YEAR_MIN, BIRTH_YEAR_MAX } from '../../config.js';

const WEEKDAYS = '일월화수목금토';
const $ = (id) => document.getElementById(id);
const views = document.querySelectorAll('.view');

// 입력값은 이 객체에만 두고, 저장하거나 전송하지 않는다.
let state = { year: null, answers: [] };
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

function renderStartPlants() {
  const { typeLabel, plants } = content.plants;
  for (const p of plants) {
    const li = document.createElement('li');
    li.className = 'plant';
    li.innerHTML = '<svg aria-hidden="true"><use></use></svg><strong></strong><span></span>';
    li.querySelector('use').setAttribute('href', `#p-${p.id}`);
    li.querySelector('strong').textContent = p.name;
    const tag = li.querySelector('span');
    tag.className = `tag ${p.type}`;
    tag.textContent = typeLabel[p.type];
    $('plants').appendChild(li);
  }
}

/* 출생연도 */
function setupYear() {
  const { year, ui } = content.questions;
  $('year-title').textContent = year.title;
  $('year-sub').textContent = year.sub;
  $('year-next').textContent = year.button;

  const select = $('year');
  select.add(new Option(year.placeholder, ''));
  for (let y = BIRTH_YEAR_MAX; y >= BIRTH_YEAR_MIN; y--) {
    select.add(new Option(`${y}${year.unit}`, String(y)));
  }
  select.addEventListener('change', () => { $('year-next').disabled = !select.value; });
  $('year-next').addEventListener('click', () => {
    state.year = Number(select.value);
    showQuestion(0);
  });
  document.querySelectorAll('[data-back]').forEach((b) => { b.textContent = ui.back; });
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

/* 결과: Q1은 물형/흙형, Q2·Q3은 식물 */
function showResult() {
  const { rules } = content.questions;
  const [a1, a2, a3] = state.answers;
  const type = rules.typeByQ1[a1];
  const plant = content.plants.plants.find((p) => p.id === rules.plantByQ2Q3[a2 + a3]);
  const r = content.result;

  $('r-heading').textContent = r.heading;
  $('r-icon').setAttribute('href', `#p-${plant.id}`);
  $('r-name').textContent = plant.name;
  const tag = $('r-tag');
  tag.className = `tag ${type}`;
  tag.textContent = content.plants.typeLabel[type];
  $('r-intro').textContent = plant.intro;
  $('r-typeline').textContent = plant.typeLine[type];
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
    state = { year: null, answers: [] };
    $('year').value = '';
    $('year-next').disabled = true;
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
  const [questions, plants, result] = await Promise.all([
    loadJson('content/questions.json'),
    loadJson('content/plants.json'),
    loadJson('content/result.json'),
  ]);
  content = { questions, plants, result };

  document.querySelectorAll('.store-name').forEach((el) => { el.textContent = STORE_NAME; });
  showToday();
  renderStartPlants();
  setupYear();
  setupNavigation();
  // 시작 버튼 분석 이벤트는 5단계에서 연결합니다(입력값은 보내지 않음).
}

init();
