import type { Metadata } from "next";
import QuizClient from "./QuizClient";
import { ALL_ARCHETYPES } from "./quizData";

// 배포 도메인 자동 감지: 직접 지정(NEXT_PUBLIC_SITE_URL) → Vercel 자동(VERCEL_URL) → 로컬
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3300");

const DEFAULT_TITLE = "나는 어떤 정치성향? — 20유형 정치성향 테스트";
const DEFAULT_DESC =
  "응원봉? 태극기? 양비론자? 진영·온도·근거·행동 4축으로 나를 20유형 + 특수칭호 9종으로 분류하는 한국형 정치성향 풍자 테스트. 친구랑 결과 비교해보자.";

// 결과별 공유(딥링크 ?r=유형ID): 친구가 받은 링크에 '그 사람의 결과 카드'가 미리보기로 뜬다 → 바이럴 루프
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const r = typeof sp.r === "string" ? sp.r : undefined;
  const a = r ? ALL_ARCHETYPES[r as keyof typeof ALL_ARCHETYPES] : undefined;

  if (a) {
    const title = `내 정치성향은 '${a.name}' ${a.emoji}`;
    const desc = `"${a.tagline}" — 너는 어떤 유형? 3분이면 나옴 👇`;
    const img = `/test-images/og/${a.id}.png`;
    return {
      metadataBase: new URL(SITE_URL),
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        type: "website",
        locale: "ko_KR",
        images: [{ url: img, width: 1200, height: 630, alt: a.name }],
      },
      twitter: { card: "summary_large_image", title, description: desc, images: [img] },
    };
  }

  return {
    metadataBase: new URL(SITE_URL),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    openGraph: {
      title: "나는 어떤 정치성향? 🧭",
      description:
        "광장의 빛 · 대깨민주당 · 뉴라이트 · 한국에 필요없는 양비론자… 당신은 20유형 중 어디? 3분 만에 확인하고 친구랑 비교해봐.",
      type: "website",
      locale: "ko_KR",
      images: [{ url: "/test-images/og.png", width: 1200, height: 630, alt: "정치성향 유형 테스트" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "나는 어떤 정치성향? 🧭",
      description: "20유형 정치성향 풍자 테스트 — 친구랑 결과 비교해봐.",
      images: ["/test-images/og.png"],
    },
  };
}

export default function TestPage() {
  return <QuizClient />;
}
