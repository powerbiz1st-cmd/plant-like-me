import { STORE_NAME } from '../../config.js';

const WEEKDAYS = '일월화수목금토';

function showToday() {
  const now = new Date();
  document.getElementById('today').textContent =
    `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS.charAt(now.getDay())}요일`;
}

async function showPlants() {
  const res = await fetch('content/plants.json');
  const { typeLabel, plants } = await res.json();
  const list = document.getElementById('plants');
  for (const p of plants) {
    const li = document.createElement('li');
    li.className = 'plant';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#p-${p.id}`);
    icon.appendChild(use);

    const name = document.createElement('strong');
    name.textContent = p.name;

    const tag = document.createElement('span');
    tag.className = `tag ${p.type}`;
    tag.textContent = typeLabel[p.type];

    li.append(icon, name, tag);
    list.appendChild(li);
  }
}

document.getElementById('store-name').textContent = STORE_NAME;
showToday();
showPlants();

// 시작 버튼: 다음 화면(출생연도 선택)을 연결하는 자리
document.getElementById('start').addEventListener('click', () => {
  // 다음 단계에서: 시작 화면을 숨기고 출생연도 화면을 보여줍니다.
  // 분석 이벤트도 여기서 보냅니다(입력값은 보내지 않음): gtag('event', 'start');
  console.log('다음 화면으로');
});
