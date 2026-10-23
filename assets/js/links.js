// 링크에 출처 표시(UTM)를 붙인다. 입력값과 결과(띠, 점수 등)는 넣지 않고, utm_content에는 유형 id만 쓴다.

export const typeId = (plantId, type) => `${plantId}-${type}`;

export function withUtm(url, source, content) {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_content', content);
  return u.toString();
}
