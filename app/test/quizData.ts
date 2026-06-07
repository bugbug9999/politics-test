// 한국 정치성향 풍자 테스트 — 데이터 & 채점 로직
// ⚠️ 재미로 보는 "풍자(satire)" 콘텐츠입니다. 진영 양쪽을 골고루 풍자하며,
//    특정 실명 개인을 저격/낙인찍는 용도가 아니라 본인이 스스로 푸는 자가진단입니다.

// ───────────────────────────── 점수 차원 ─────────────────────────────
// camp        : 진영        (− 진보/민주  ↔  + 보수/국힘)
// intensity   : 온도        (− 온건·쿨    ↔  + 강성·전투)
// basis       : 근거        (− 감정·밈    ↔  + 논리·팩트)
// action      : 행동성      (− 관망·키보드 ↔  + 광장·행동)
// hist        : 역사관      (− 청산지향   ↔  + 친일·뉴라이트)
// gender      : 젠더        (− 페미·진보  ↔  + 안티페미)
// fraud       : 부정선거 신봉도 (높을수록 6·3 부정선거론 동조)
// knowledge   : 정치 지식·관심 (낮을수록 정알못)
// bothsides   : 양비론      (높을수록 "둘 다 똑같다")
// leeFav      : 이재명 호감
// leeAntiFact : 이재명 비판(근거·사법리스크 기반)
// leeAntiEmo  : 이재명 혐오(밈·감정 기반)
// mlSeverity  : 12·3 계엄을 얼마나 심각하게 보는가 (높을수록 "내란")
// mlAction    : 12·3 계엄 당시 실제 행동/참여도
// selfCenter  : 본인을 "중도"라고 자기보고했는지 플래그

export type Scores = Record<string, number>;

export interface QuestionOption {
  label: string;
  scores: Scores;
}
export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export interface Archetype {
  id: string;
  code: string; // 4글자 공유 코드 (중도/특수형은 "—")
  name: string; // 별명
  emoji: string;
  tagline: string;
  desc: string;
  good?: string; // 궁합 별명
  bad?: string; // 상극 별명
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

// ───────────────────────────── 질문 (22문항) ─────────────────────────────
const QUESTIONS_RAW: Question[] = [
  {
    id: "q1",
    text: "본인 정치성향을 한마디로 고른다면?",
    options: [
      { label: "확고한 진보 — 세상은 바뀌어야 한다", scores: { camp: -2, intensity: 1 } },
      { label: "온건 진보 — 대체로 민주당 쪽", scores: { camp: -1 } },
      { label: "나는 중도 — 사안마다 다르다", scores: { selfCenter: 1, bothsides: 1 } },
      { label: "온건 보수 — 대체로 국힘 쪽", scores: { camp: 1 } },
      { label: "확고한 보수 — 나라가 걱정된다", scores: { camp: 2, intensity: 1 } },
    ],
  },
  {
    id: "q2",
    text: "6·3 투표용지 부족 사태, 솔직히 부정선거였다고 본다?",
    options: [
      { label: "100% 부정선거다, 원천 무효", scores: { fraud: 2, camp: 1, basis: -1, intensity: 1 } },
      { label: "의심은 충분히 간다", scores: { fraud: 1, camp: 0.5 } },
      { label: "어이없는 행정참사일 뿐, 부정선거는 아니다", scores: { fraud: -1, basis: 1 } },
      { label: "또 부정선거 타령이냐, 지겹다", scores: { fraud: -2, camp: -1 } },
    ],
  },
  {
    id: "q3",
    text: "2024년 12·3 윤석열 비상계엄, 어떻게 평가하나?",
    options: [
      { label: "명백한 내란, 헌정 유린이다", scores: { camp: -2, mlSeverity: 2 } },
      { label: "분명히 잘못된 일이다", scores: { camp: -1, mlSeverity: 1 } },
      { label: "야당 입법폭주에 맞선 고육지책이었다", scores: { camp: 1, mlSeverity: -1 } },
      { label: "내란몰이가 과하다, 통치행위로 볼 여지 있다", scores: { camp: 1, mlSeverity: -2 } },
    ],
  },
  {
    id: "q4",
    text: "친일파 재산을 국가가 환수하는 '친일재산귀속법', 어떻게 생각하나?",
    options: [
      { label: "더 강하게 청산해야 한다", scores: { hist: -2, camp: -1 } },
      { label: "지금 정도 유지면 적절", scores: { hist: -1 } },
      { label: "사유재산 침해 소지가 있다", scores: { hist: 1, camp: 1 } },
      { label: "반일 선동에 불과, 폐지해야", scores: { hist: 2, camp: 1 } },
    ],
  },
  {
    id: "q5",
    text: "이재명 대통령, 한마디로 평가하면?",
    options: [
      { label: "유능한 개혁가, 밀어줘야 한다", scores: { camp: -2, leeFav: 2 } },
      { label: "완벽하진 않아도 그럭저럭 지지", scores: { camp: -1, leeFav: 1 } },
      { label: "사법리스크·정책이 영 미덥잖다", scores: { leeAntiFact: 1, camp: 0.5 } },
      { label: "생각만 해도 싫다 ('찢')", scores: { leeFav: -1, leeAntiEmo: 2, basis: -1, camp: 1 } },
    ],
  },
  {
    id: "q6",
    text: "정치인을 판단할 때, 당신이 가장 크게 보는 건?",
    options: [
      { label: "정책·실적·재판기록 같은 팩트", scores: { basis: 2 } },
      { label: "말투·이미지·왠지 모를 느낌", scores: { basis: -2 } },
      { label: "우리 편이냐 아니냐가 제일 중요", scores: { basis: -1, intensity: 1 } },
      { label: "솔직히 잘 모르겠다", scores: { knowledge: -1, intensity: -1 } },
    ],
  },
  {
    id: "q7",
    text: "검찰개혁에 대한 입장은?",
    options: [
      { label: "반드시 필요하다", scores: { camp: -2 } },
      { label: "필요하지만 속도 조절은 해야", scores: { camp: -1 } },
      { label: "사실상 검찰 길들이기다", scores: { camp: 1 } },
      { label: "검찰개혁이 뭐였더라", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q8",
    text: "종부세·부유세 등 '부자 증세'는?",
    options: [
      { label: "더 강화해야 한다", scores: { camp: -1 } },
      { label: "지금이 적당하다", scores: { camp: -0.5 } },
      { label: "완화하거나 없애야 한다", scores: { camp: 1 } },
      { label: "세금이라는 말 자체가 싫다", scores: { camp: 1, intensity: 1 } },
    ],
  },
  {
    id: "q9",
    text: "여성가족부와 '구조적 성차별'에 대해선?",
    options: [
      { label: "차별은 여전하다, 여가부 강화", scores: { camp: -1, gender: -2 } },
      { label: "지금 수준 유지면 된다", scores: { gender: -1 } },
      { label: "여가부 폐지에 찬성", scores: { camp: 1, gender: 2 } },
      { label: "남녀 갈라치기 자체가 지겹다", scores: { bothsides: 1 } },
    ],
  },
  {
    id: "q10",
    text: "대북·안보 노선이라면 어느 쪽?",
    options: [
      { label: "대화·협력 우선", scores: { camp: -1 } },
      { label: "강경 대응 우선", scores: { camp: 1 } },
      { label: "한미일 동맹 최우선", scores: { camp: 1, hist: 0.5 } },
      { label: "안보 얘기는 관심 없다", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q11",
    text: "6·3 사태로 사람들이 거리로 나가고 있다. 당신은?",
    options: [
      { label: "이미 나갔거나, 나갈 거다", scores: { action: 2, intensity: 1 } },
      { label: "온라인에서 열심히 싸운다", scores: { action: -1, basis: -0.5 } },
      { label: "공유·좋아요 정도만", scores: { action: -1 } },
      { label: "집회? 귀찮다", scores: { action: -2, intensity: -1 } },
    ],
  },
  {
    id: "q12",
    text: "2024년 12·3 계엄 그 밤, 당신은 실제로 무엇을 했나?",
    options: [
      { label: "국회·광장으로 뛰쳐나갔다", scores: { action: 1, mlAction: 2, camp: -1 } },
      { label: "밤새 온라인으로 응원·공유했다", scores: { camp: -1, mlAction: 1 } },
      { label: "뉴스만 지켜봤다", scores: { mlAction: 0 } },
      { label: "솔직히 별 관심 없었다 / 내 일 아니었다", scores: { mlAction: -2 } },
    ],
  },
  {
    id: "q13",
    text: "정치 얘기가 나왔을 때 당신의 스타일은?",
    options: [
      { label: "누가 뭐래도 끝까지 싸운다", scores: { intensity: 2 } },
      { label: "필요하면 목소리를 낸다", scores: { intensity: 1 } },
      { label: "조용히 내 갈 길 간다", scores: { intensity: -1 } },
      { label: "논쟁은 무조건 피한다", scores: { intensity: -2 } },
    ],
  },
  {
    id: "q14",
    text: "정치 얘기는 주로 어디서 접하나?",
    options: [
      { label: "트위터(X)·더쿠·클리앙", scores: { camp: -1 } },
      { label: "에펨코리아·디시·일베", scores: { camp: 1, basis: -1 } },
      { label: "유튜브 정치 채널 구독 다수", scores: { intensity: 1 } },
      { label: "그냥 포털 뉴스만 본다", scores: { basis: 1 } },
    ],
  },
  {
    id: "q15",
    text: "전한길·황교안 같은 인물에 대한 생각은?",
    options: [
      { label: "위험한 선동가다", scores: { camp: -1, basis: 1 } },
      { label: "일부는 일리가 있다", scores: { camp: 1, fraud: 1 } },
      { label: "속 시원하다, 영웅이다", scores: { camp: 2, fraud: 2, intensity: 1, basis: -1 } },
      { label: "그게 누구임?", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q16",
    text: "광장의 두 상징, 더 끌리는 쪽은?",
    options: [
      { label: "응원봉", scores: { camp: -2 } },
      { label: "태극기", scores: { camp: 2 } },
      { label: "둘 다 부담스럽다", scores: { bothsides: 1 } },
      { label: "관심 없다", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q17",
    text: "\"여야 둘 다 똑같이 썩었다\"는 말에 대해선?",
    options: [
      { label: "전적으로 동의한다", scores: { bothsides: 2 } },
      { label: "대체로 그렇다", scores: { bothsides: 1 } },
      { label: "그래도 덜한 쪽은 있다", scores: { bothsides: -1 } },
      { label: "아니다, 분명히 차이가 있다", scores: { bothsides: -2, intensity: 1 } },
    ],
  },
  {
    id: "q18",
    text: "국회 비례대표 '준연동형 의석 배분' 방식, 설명할 수 있나?",
    options: [
      { label: "대충 원리는 설명 가능", scores: { knowledge: 2 } },
      { label: "들어는 봤다", scores: { knowledge: 1 } },
      { label: "모른다", scores: { knowledge: -1 } },
      { label: "그게 뭔데?", scores: { knowledge: -2 } },
    ],
  },
  {
    id: "q19",
    text: "일제 강제동원 피해 '제3자 변제' 해법에 대한 입장은?",
    options: [
      { label: "굴욕외교다, 반대", scores: { hist: -1, camp: -1 } },
      { label: "현실적 타협으로 본다", scores: { hist: 1 } },
      { label: "미래지향적이라 잘한 일", scores: { hist: 2, camp: 1 } },
      { label: "그런 게 있었나", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q21",
    text: "5·18 기념일에 한 글로벌 브랜드의 '탱크' 마케팅이 조롱 논란이 됐고, 정부까지 나서 불매를 주도했다. 어떻게 보나?",
    options: [
      { label: "역사 모독엔 단호한 응징이 마땅, 잘한 일", scores: { camp: -1, intensity: 1 } },
      { label: "조롱은 잘못이나 '관(官) 주도 불매'는 과하다", scores: { basis: 1, camp: 0.5, intensity: -1 } },
      { label: "국가가 기업 불매를 주도하는 건 권력 남용이다", scores: { camp: 1, intensity: 1 } },
      { label: "기업 마케팅에 정치가 왜 끼나, 둘 다 피곤", scores: { bothsides: 1 } },
    ],
  },
  {
    id: "q22",
    text: "요즘 원/달러 환율이 1,500원 가까이 치솟았다. 누구 책임이 크다고 보나?",
    options: [
      { label: "이재명 정부 경제 실정 탓이 크다", scores: { camp: 1 } },
      { label: "정부도 책임 있지만 대외 요인이 더 크다", scores: { basis: 1 } },
      { label: "글로벌·전 정부 요인 탓, 정부만 탓할 건 아니다", scores: { camp: -1 } },
      { label: "환율이 왜 오르는지 솔직히 잘 모른다", scores: { knowledge: -1 } },
    ],
  },
  {
    id: "q20",
    text: "이 테스트 결과가 나오면 당신은?",
    options: [
      { label: "커뮤니티 가서 토론 붙는다", scores: { intensity: 1 } },
      { label: "친구들이랑 결과 공유한다", scores: { action: 0 } },
      { label: "내 결과만 보고 조용히 닫는다", scores: { action: -1, intensity: -1 } },
      { label: "캡처해서 박제해둔다", scores: { intensity: 0.5 } },
    ],
  },
];

// 진행 순서 — 즉답 가능한 '큰 골자' 문항을 앞 6개에 배치(피로↓), 정책·지식 문항은 뒤로.
// 점수 합산은 순서와 무관하므로 정밀 결과(20유형)는 동일하다.
const FLOW = [
  // 1차(빠른 진단) 6문항 — 즉답 가능한 시사 gut-take 위주
  "q1", "q5", "q3", "q2", "q21", "q22",
  // 2차 — 정책·정체성·지식
  "q16", "q17", "q14", "q13", "q9", "q6", "q7", "q8", "q10", "q11", "q12", "q15", "q4", "q19", "q18", "q20",
];
export const QUESTIONS: Question[] = FLOW.map(
  (id) => QUESTIONS_RAW.find((q) => q.id === id)!
);
export const INTERIM_AFTER = 6; // 6문항 후 1차 빠른 진단

// ───────────────── 1차 빠른 진단(큰 골자) — 앞 6문항만으로 거친 정체성 라벨 ─────────────────
export interface Coarse {
  emoji: string;
  label: string;
  desc: string;
  tone: "prog" | "cons" | "center";
  tease: string; // 2차 유도용 호기심 미끼 — 이 버킷이 정밀에서 어떻게 갈리는지
}
export function coarseResult(answers: QuestionOption[]): Coarse {
  const s: Scores = {};
  for (const opt of answers)
    for (const [k, v] of Object.entries(opt.scores)) s[k] = (s[k] ?? 0) + v;
  const camp = g(s, "camp");
  const both = g(s, "bothsides");
  const selfC = g(s, "selfCenter") > 0;
  const leeFav = g(s, "leeFav");
  const leeAntiEmo = g(s, "leeAntiEmo");
  const basis = g(s, "basis");

  // 중도·양비론·무당층
  if (both >= 3 || (selfC && Math.abs(camp) <= 1)) {
    return {
      emoji: "🤷",
      label: "한 발 빼고 보는 중도·관망러",
      desc: "아직 어느 쪽으로도 안 기울었거나 '여야 다 똑같다' 쪽.",
      tone: "center",
      tease: "진성 스윙보터일까, 한국에 필요없는 양비론자일까, 그냥 정알못일까?",
    };
  }
  if (camp < 0) {
    if (leeAntiEmo >= 2 || leeFav < 0) {
      return {
        emoji: "💔",
        label: "이재명이 불편한 비명(非明) 진보",
        desc: "진보는 맞는데 이재명한텐 정이 안 가는 타입.",
        tone: "prog",
        tease: "비판적 지지자? 조용한 실천가? 진보 8갈래 중 당신은 어디?",
      };
    }
    if (leeFav >= 2) {
      return {
        emoji: "💗",
        label: "이재명 찐지지 (개딸 기질)",
        desc: "이재명·민주당을 향한 화력이 남다른 강성 지지층.",
        tone: "prog",
        tease: "개혁의 딸? 대깨민주당? 광장의 빛? 진보 8갈래 중 당신은?",
      };
    }
    return {
      emoji: "🔵",
      label: "민주당 지지층",
      desc: "대체로 진보·민주당 쪽.",
      tone: "prog",
      tease: "광장의 빛부터 아묻따 민주까지 — 진보 8갈래 중 당신은 어디?",
    };
  }
  // 보수 진영
  if (basis < 0) {
    return {
      emoji: "🖥️",
      label: "밈으로 싸우는 강성 우파 (일베 감성)",
      desc: "커뮤니티 밈·짤로 무장한 온라인 강성 보수 기질.",
      tone: "cons",
      tease: "극우일베 전사? 올림픽공원 최전선? 보수 8갈래 중 당신은?",
    };
  }
  if (basis > 0) {
    return {
      emoji: "🎯",
      label: "뉴라이트·논리 우파",
      desc: "시장·통계·'팩트'를 앞세우는 이성 보수 쪽.",
      tone: "cons",
      tease: "정책 보수 투사? 강남 실리보수? 보수 8갈래 중 당신은?",
    };
  }
  return {
    emoji: "🔴",
    label: "국민의힘 지지층",
    desc: "대체로 보수·국힘 쪽.",
    tone: "cons",
    tease: "태극기 강성부터 합리적 우파까지 — 보수 8갈래 중 당신은?",
  };
}

// ───────────────────────────── 16 그리드 유형 ─────────────────────────────
// 코드: 진영(J 진보/B 보수) · 온도(G 강성/C 쿨) · 근거(L 논리/M 감정밈) · 행동(S 광장/O 관망)
const GRID: Record<string, Archetype> = {
  JGLS: {
    id: "JGLS", code: "JGLS", name: "광장의 빛", emoji: "🔦",
    tagline: "정책도 알고, 몸도 나가는 진성 운동권",
    desc: "신념과 논리를 갖추고 실제로 거리에도 나가는 행동하는 진보. 멋있지만 가끔 친구들 단톡방을 운동권 회의로 만든다.",
    good: "조용한 실천가", bad: "올림픽공원 최전선",
  },
  JGLO: {
    id: "JGLO", code: "JGLO", name: "응원봉 요정", emoji: "🪄",
    tagline: "이론도 알고 응원봉도 흔드는 온라인 전사",
    desc: "논리와 통계로 무장한 강성 진보. 온라인에선 토론을 끝내버리고, 집회엔 응원봉 들고 '마음으로' 함께한다.",
    good: "비판적 지지자", bad: "뉴라이트",
  },
  JGMS: {
    id: "JGMS", code: "JGMS", name: "개혁의 딸", emoji: "💪",
    tagline: "화력 하나는 전국구, 우리 편은 무적",
    desc: "이재명·민주당을 향한 팬덤형 충성과 행동력이 폭발하는 타입. 결집력은 최강이지만 '수박' 색출에도 진심이다.",
    good: "응원봉 인싸", bad: "극우일베 전사",
  },
  JGMO: {
    id: "JGMO", code: "JGMO", name: "대깨민주당", emoji: "🔁",
    tagline: "분노는 100%, 외출은 0%",
    desc: "감정과 충성으로 무장한 온라인 강성 지지자. 대깨·문빠의 유산을 이어 받아 인용 RT로 적을 처단한다.",
    good: "개혁의 딸", bad: "아묻따 국힘",
  },
  JCLS: {
    id: "JCLS", code: "JCLS", name: "조용한 실천가", emoji: "🌱",
    tagline: "시끄럽지 않게, 그러나 꾸준히",
    desc: "온건하지만 신념대로 봉사·투표·서명까지 실천하는 개혁가. 진영 싸움보단 실제 변화를 본다.",
    good: "광장의 빛", bad: "계엄 땐 잠수, 참정권엔 전사",
  },
  JCLO: {
    id: "JCLO", code: "JCLO", name: "비판적 지지자", emoji: "🤔",
    tagline: "민주당 찍지만, 깔 때는 깐다",
    desc: "대체로 진보를 지지하되 맹목적이진 않은 합리좌파. '우리 편이라고 다 옳냐'를 입에 달고 산다.",
    good: "강남 실리보수", bad: "대깨민주당",
  },
  JCMS: {
    id: "JCMS", code: "JCMS", name: "응원봉 인싸", emoji: "🎉",
    tagline: "분위기 타면 누구보다 앞줄",
    desc: "깊은 이론보단 현장의 에너지로 움직이는 타입. 12·3 광장에 응원봉 들고 나갔던 그 사람. 트렌드엔 빠르다.",
    good: "개혁의 딸", bad: "강남 실리보수",
  },
  JCMO: {
    id: "JCMO", code: "JCMO", name: "아묻따 민주", emoji: "🟦",
    tagline: "묻지도 따지지도 않고 1번",
    desc: "별 고민 없이 습관처럼 진보를 찍는 타입. 정책은 잘 몰라도 '국힘만은 안 된다'는 확고하다.",
    good: "응원봉 인싸", bad: "아묻따 국힘",
  },
  BGLS: {
    id: "BGLS", code: "BGLS", name: "정책 보수 투사", emoji: "📐",
    tagline: "이유 있는 보수, 현장도 뛴다",
    desc: "시장·안보 논리를 갖추고 실제로 행동까지 하는 보수. 음모론과는 선을 긋지만 신념은 단단하다.",
    good: "합리적 우파", bad: "대깨민주당",
  },
  BGLO: {
    id: "BGLO", code: "BGLO", name: "뉴라이트", emoji: "🎯",
    tagline: "댓글창의 논객, 출석은 온라인",
    desc: "뉴라이트·시장주의 논리로 무장한 키보드 우파. 통계와 '팩트'를 좋아하지만 가끔 체리피킹도 같이 좋아한다.",
    good: "강남 실리보수", bad: "응원봉 요정",
  },
  BGMS: {
    id: "BGMS", code: "BGMS", name: "올림픽공원 최전선", emoji: "🚩",
    tagline: "태극기 들고 제일 앞줄",
    desc: "전한길·태극기 집회에 직접 결집하는 강성 행동 보수. 신념의 화력은 최강, 다만 '부정선거' 확신도 최강이다.",
    good: "극우일베 전사", bad: "광장의 빛",
  },
  BGMO: {
    id: "BGMO", code: "BGMO", name: "극우일베 전사", emoji: "🖥️",
    tagline: "키보드로 싸우는 온라인 우익",
    desc: "커뮤니티 밈과 짤로 무장한 온라인 강성 보수. 화력은 좋지만 출처는 대체로 '어디서 봤음'.",
    good: "올림픽공원 최전선", bad: "개혁의 딸",
  },
  BCLS: {
    id: "BCLS", code: "BCLS", name: "합리적 우파", emoji: "📈",
    tagline: "시끄럽지 않은 합리 보수",
    desc: "자유시장·실용을 중시하되 진영 싸움엔 거리를 두는 온건 보수. 필요하면 조용히 행동도 한다.",
    good: "정책 보수 투사", bad: "응원봉 인싸",
  },
  BCLO: {
    id: "BCLO", code: "BCLO", name: "강남 실리보수", emoji: "💼",
    tagline: "경제는 우파, 사회는 쿨",
    desc: "세금·부동산·경제엔 보수지만 사회 이슈엔 유연한 실리형. 광장보단 자산 배분에 관심이 많다.",
    good: "비판적 지지자", bad: "올림픽공원 최전선",
  },
  BCMS: {
    id: "BCMS", code: "BCMS", name: "선택적 분노 전사", emoji: "🤿",
    tagline: "계엄 땐 잠수, 참정권엔 전사",
    desc: "큰 헌정 위기 땐 조용하다가 '내 참정권'이 걸리자 거리로 나선 선택적 행동파. 본인은 '이번엔 진짜'라고 믿는다.",
    good: "아묻따 국힘", bad: "조용한 실천가",
  },
  BCMO: {
    id: "BCMO", code: "BCMO", name: "아묻따 국힘", emoji: "🟥",
    tagline: "묻지도 따지지도 않고 2번",
    desc: "별 고민 없이 습관처럼 보수를 찍는 타입. 정책은 잘 몰라도 '좌파만은 안 된다'는 확고하다.",
    good: "아묻따 민주", bad: "응원봉 요정",
  },
};

// ───────────────────────────── 중도·무당층 4종 ─────────────────────────────
const CENTER: Record<string, Archetype> = {
  JUDGE: {
    id: "JUDGE", code: "—", name: "중도표방 유권자", emoji: "⚖️",
    tagline: "진짜 스윙보터, 표로 심판한다",
    desc: "진영보다 사안·실적으로 판단하고, 잘못한 쪽은 갈아치우는 진성 중도. 양쪽 모두 당신 눈치를 봐야 한다.",
    good: "비판적 지지자", bad: "한국에 필요없는 양비론자",
  },
  IGNORANT: {
    id: "IGNORANT", code: "—", name: "중도인 척 정알못", emoji: "🫥",
    tagline: "중도라 했지만 사실 잘 모름",
    desc: "스스로 '중도'라 하지만 답변은 왔다 갔다, 지식은 얕은 타입. 균형이 아니라 무관심에 가깝다. 그래도 솔직한 게 어디냐.",
    good: "정알못·무관심", bad: "응원봉 요정",
  },
  BOTHSIDES: {
    id: "BOTHSIDES", code: "—", name: "한국에 필요없는 양비론자", emoji: "🙄",
    tagline: "여야 다 썩었다, 한 발 빼고 관전",
    desc: "모든 사안에 '둘 다 문제'라며 등거리를 유지하는 양비론자. 쿨해 보이지만 가끔 그게 제일 편한 도피이기도.",
    good: "강남 실리보수", bad: "중도표방 유권자",
  },
  APATHY: {
    id: "APATHY", code: "—", name: "정알못·무관심", emoji: "😴",
    tagline: "정치? 테스트 왜 함",
    desc: "정치엔 관심도 지식도 별로 없는 타입. 사실 인구의 상당수가 여기다. 평화롭게 사는 것도 능력.",
    good: "중도인 척 정알못", bad: "광장의 빛",
  },
};

export const ALL_ARCHETYPES = { ...GRID, ...CENTER };

// ───────────────────────────── 특수 칭호(뱃지) ─────────────────────────────
export const BADGES: Record<string, Badge> = {
  PROJP: { id: "PROJP", emoji: "🏯", name: "친일파", desc: "역사 청산보다 '미래지향'을 외친다. 토착왜구 프레임이 따라붙는 위치." },
  FRAUD: { id: "FRAUD", emoji: "🗳️", name: "부정선거 신봉자", desc: "6·3을 '조작'으로 확신한다. 단, 법원·선관위·AFP는 근거 없음으로 본다는 점은 알아두자." },
  ANTILEE_FACT: { id: "ANTILEE_FACT", emoji: "🔪", name: "이재명 안티(근거형)", desc: "사법리스크·정책을 근거로 비판한다. '이유 있는 비판' 쪽." },
  ANTILEE_EMO: { id: "ANTILEE_EMO", emoji: "😡", name: "이재명 안티(감정형)", desc: "근거보다 '그냥 싫다'에 가깝다. '찢' 밈으로 사는 타입." },
  PROLEE: { id: "PROLEE", emoji: "💗", name: "이재명 지지자", desc: "이재명을 향한 충성과 화력이 남다르다. 수박 색출 주의." },
  HYPOCRITE: { id: "HYPOCRITE", emoji: "🤡", name: "윤어게인", desc: "12·3 계엄엔 관대했는데 6·3엔 분노 폭발. '윤 어게인' 정서와 통하는 선택적 분노." },
  ANTIFEM: { id: "ANTIFEM", emoji: "♂️", name: "안티페미", desc: "여가부·구조적 차별론에 강하게 반대한다." },
  FEM: { id: "FEM", emoji: "♀️", name: "페미 인증", desc: "구조적 성차별을 인정하고 시정에 적극적이다." },
  NOOB: { id: "NOOB", emoji: "🐣", name: "정알못 인증", desc: "정치 지식 게이지가 바닥. 그래도 투표는 하자." },
};

// ───────────────────────────── 채점 ─────────────────────────────
export interface Result {
  archetype: Archetype;
  badges: Badge[];
  scores: Scores;
}

function g(s: Scores, k: string): number {
  return s[k] ?? 0;
}

export function score(answers: QuestionOption[]): Result {
  const s: Scores = {};
  for (const opt of answers) {
    for (const [k, v] of Object.entries(opt.scores)) {
      s[k] = (s[k] ?? 0) + v;
    }
  }

  const camp = g(s, "camp");
  const intensity = g(s, "intensity");
  const basis = g(s, "basis");
  const action = g(s, "action");
  const knowledge = g(s, "knowledge");
  const bothsides = g(s, "bothsides");
  const selfCenter = g(s, "selfCenter") > 0;

  let archetype: Archetype;

  // 1) 중도·무당층 판정: 진영 점수가 약하거나 본인이 중도라고 했을 때
  const isCentrist = Math.abs(camp) <= 1 || selfCenter;
  if (bothsides >= 4) {
    archetype = CENTER.BOTHSIDES;
  } else if (isCentrist) {
    if (knowledge <= -2 || (selfCenter && knowledge <= 0 && Math.abs(camp) >= 2)) {
      // 중도라면서 지식이 얕거나, 자기보고는 중도인데 실제 답은 한쪽으로 쏠림
      archetype = CENTER.IGNORANT;
    } else if (knowledge <= -1 && action <= -1) {
      archetype = CENTER.APATHY;
    } else if (knowledge >= 2 && bothsides <= 1) {
      archetype = CENTER.JUDGE;
    } else if (bothsides >= 2) {
      archetype = CENTER.BOTHSIDES;
    } else {
      archetype = CENTER.JUDGE;
    }
  } else {
    // 2) 진영형: 4글자 코드 조합
    // 온도(G/C) 분기점은 0이 아닌 +2 — intensity 점수가 강성 쪽으로 구조적 편향(양수 13:음수 5)이라
    // 0에서 자르면 누구나 강성(G)이 되어 쿨(C) 8유형이 사장됨. 실측 분포 기준 +2에서 자르면 16유형이 고르게 분포.
    const code =
      (camp < 0 ? "J" : "B") +
      (intensity >= 2 ? "G" : "C") +
      (basis >= 0 ? "L" : "M") +
      (action >= 0 ? "S" : "O");
    archetype = GRID[code] ?? CENTER.JUDGE;
  }

  // 3) 특수 칭호(뱃지) — 독립적으로 점등
  const badges: Badge[] = [];
  const hist = g(s, "hist");
  const fraud = g(s, "fraud");
  const gender = g(s, "gender");
  const leeFav = g(s, "leeFav");
  const leeAntiFact = g(s, "leeAntiFact");
  const leeAntiEmo = g(s, "leeAntiEmo");
  const mlSeverity = g(s, "mlSeverity");
  const mlAction = g(s, "mlAction");

  if (hist >= 3) badges.push(BADGES.PROJP); // 강한 답(폐지/미래지향) 1개+α 필요 — 온건 답 누적으로 '친일파' 오점등 방지
  if (fraud >= 2) badges.push(BADGES.FRAUD);
  // 내로남불: 계엄은 가볍게 봤는데(낮은 심각도/낮은 참여) 6·3엔 분노(부정선거 동조)
  if ((mlSeverity <= -1 || mlAction <= -1) && fraud >= 1) badges.push(BADGES.HYPOCRITE);
  if (leeAntiEmo >= 2 && leeAntiEmo > leeAntiFact) badges.push(BADGES.ANTILEE_EMO);
  else if (leeAntiFact >= 1 && basis > 0) badges.push(BADGES.ANTILEE_FACT);
  if (leeFav >= 2 && intensity >= 1) badges.push(BADGES.PROLEE);
  if (gender >= 2) badges.push(BADGES.ANTIFEM);
  else if (gender <= -2) badges.push(BADGES.FEM);
  if (knowledge <= -2) badges.push(BADGES.NOOB);

  return { archetype, badges, scores: s };
}
