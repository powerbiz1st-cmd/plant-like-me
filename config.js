// 아직 정해지지 않은 값은 여기서만 고칩니다. TODO가 붙은 값은 사람이 채워야 합니다.

// TODO: 가게 이름 확인
export const STORE_NAME = 'makejungle'; // 로고 글자와 도메인 기준 임시값. 정식 가게 이름이 정해지면 교체

// TODO: 카페24 특가 상품 URL (진열 안 한 상품 주소)
export const CAFE24_DEAL_URL = '';

// TODO: 배포 도메인 (GitHub Pages 주소 또는 사용할 도메인)
export const SITE_URL = '';

// TODO: 카카오 JavaScript 키
export const KAKAO_JS_KEY = '';

// 띠 기준: 'lunar-new-year'(음력 설, 확정). 브라우저 중국력(Intl)으로 양력 생일을 음력 해로 바꿔 정합니다.
export const ZODIAC_BOUNDARY = 'lunar-new-year';

// TODO: 출생연도 선택 범위 (임시값, 실제 범위는 사람이 정합니다)
export const BIRTH_YEAR_MIN = 1940;
export const BIRTH_YEAR_MAX = 2010;

// 임시: 식물 둘러보기·친구 공유가 가는 상품 상세 주소(식물별). 특가 URL(CAFE24_DEAL_URL)이 정해지면 교체합니다.
// TODO: 실제 카페24 특가 상품(진열 안 한 상품) 주소로 교체
export const PLANT_LINKS = {
  monstera: 'https://makejungle.co.kr/product/detail.html?product_no=330',
  hanra: 'https://makejungle.co.kr/product/detail.html?product_no=331',
  bamboo: 'https://makejungle.co.kr/product/detail.html?product_no=336',
  palm: 'https://makejungle.co.kr/product/detail.html?product_no=322',
};
