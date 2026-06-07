"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  INTERIM_AFTER,
  coarseResult,
  score,
  type Coarse,
  type QuestionOption,
  type Result,
} from "./quizData";

// 👉 운영자가 채워 넣을 오픈카톡 링크 (커뮤니티/유머·토론 목적)
//    실제 오픈채팅 URL로 바꾸면 결과 화면 하단 버튼에 연결됩니다.
const OPENCHAT_URL = "https://open.kakao.com/o/REPLACE_ME";

// 진영색 테마 — 진보=블루 / 보수=레드 / 중도=슬레이트 (결과·1차 진단 공용, literal이라 Tailwind JIT 포함)
const THEME = {
  prog: {
    card: "from-blue-50 to-white border-blue-100",
    accentBg: "bg-blue-600",
    accentBgHover: "hover:bg-blue-700",
    accentText: "text-blue-700",
    chip: "border-blue-200",
    line: "border-blue-100",
    soft: "bg-blue-50 border-blue-100",
  },
  cons: {
    card: "from-red-50 to-white border-red-100",
    accentBg: "bg-red-600",
    accentBgHover: "hover:bg-red-700",
    accentText: "text-red-700",
    chip: "border-red-200",
    line: "border-red-100",
    soft: "bg-red-50 border-red-100",
  },
  center: {
    card: "from-slate-100 to-white border-slate-200",
    accentBg: "bg-slate-600",
    accentBgHover: "hover:bg-slate-700",
    accentText: "text-slate-700",
    chip: "border-slate-200",
    line: "border-slate-200",
    soft: "bg-slate-100 border-slate-200",
  },
} as const;

// GA4 이벤트 (gtag 없으면 무시) — 방문/퍼널/공유 추적용
function track(event: string, params?: Record<string, unknown>) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof window !== "undefined" && typeof w.gtag === "function") {
    w.gtag("event", event, params || {});
  }
}

type Stage = "intro" | "quiz" | "interim" | "result";

export default function QuizClient() {
  const [stage, setStage] = useState<Stage>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(QuestionOption | null)[]>(
    () => QUESTIONS.map(() => null)
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.host), []);

  const result: Result | null = useMemo(() => {
    if (stage !== "result") return null;
    return score(answers.filter(Boolean) as QuestionOption[]);
  }, [stage, answers]);

  const coarse: Coarse | null = useMemo(() => {
    if (stage !== "interim") return null;
    return coarseResult(
      answers.slice(0, INTERIM_AFTER).filter(Boolean) as QuestionOption[]
    );
  }, [stage, answers]);

  // 퍼널 추적: 1차 진단 도달 / 정밀 결과 도달
  useEffect(() => {
    if (stage === "interim" && coarse) track("interim_reached", { coarse: coarse.label });
    if (stage === "result" && result)
      track("result_reached", { type: result.archetype.name, code: result.archetype.code });
  }, [stage, coarse, result]);

  const progress = Math.round((idx / QUESTIONS.length) * 100);

  function choose(opt: QuestionOption) {
    const next = [...answers];
    next[idx] = opt;
    setAnswers(next);
    if (idx + 1 === INTERIM_AFTER) {
      setStage("interim"); // 6문항 후 1차 빠른 진단
    } else if (idx + 1 < QUESTIONS.length) {
      setIdx(idx + 1);
    } else {
      setStage("result");
    }
  }

  function continueQuiz() {
    setIdx(INTERIM_AFTER);
    setStage("quiz");
  }

  function restart() {
    setAnswers(QUESTIONS.map(() => null));
    setIdx(0);
    setStage("intro");
  }

  async function saveImage() {
    const el = cardRef.current;
    if (!el || !result) return;
    track("save_image", { type: result.archetype.name });
    setSaving(true);
    try {
      // 웹폰트 로딩 보장 — 안 기다리면 html2canvas가 폴백폰트(다른 메트릭)로 그려 간격이 깨짐
      if (document.fonts?.ready) await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const fileName = `정치성향_${result.archetype.name}.png`;
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/png")
      );
      if (!blob) throw new Error("no-blob");
      const file = new File([blob], fileName, { type: "image/png" });

      // 1) 모바일(iOS·안드로이드): 공유 시트 → '사진에 저장'/카톡 전송 가능
      //    iOS 사파리·카톡 인앱은 <a download>를 무시하므로 Web Share가 유일하게 먹힌다.
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "내 정치성향 결과" });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return; // 사용자가 취소
          // 그 외엔 아래 폴백
        }
      }

      // 2) 데스크톱: Blob URL 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      // 3) 최후 폴백: 새 탭에 이미지 띄워 길게 눌러 저장(인앱 브라우저 대비)
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
        const w = window.open();
        if (w) w.document.write(`<img src="${canvas.toDataURL("image/png")}" style="width:100%"/><p style="font-family:sans-serif;text-align:center">이미지를 길게 눌러 저장하세요</p>`);
        else alert("이미지 저장에 실패했어요. 화면을 캡처해 저장해 주세요.");
      } catch {
        alert("이미지 저장에 실패했어요. 화면을 캡처해 저장해 주세요.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function share() {
    if (!result) return;
    const a = result.archetype;
    track("share_click", { type: a.name });
    const badgeText = result.badges.map((b) => `${b.emoji}${b.name}`).join(" ");
    const text =
      `나는 [${a.emoji} ${a.name}] 나왔다.\n` +
      `"${a.tagline}"\n` +
      (badgeText ? `🏅 ${badgeText}\n` : "") +
      `\n📢 이 시국에 이건 다들 한 번씩 해봐야 됨.\n` +
      `너는 개딸? 뉴라이트? 양비론자? 21문항으로 진단 👇\n` +
      `#정치성향테스트 #나는어떤정치성향`;
    // 결과 딥링크: 친구가 이 링크를 열면 '내 결과 카드'가 카톡/X 미리보기로 뜬다
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}?r=${a.id}`
        : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "정치성향 테스트 결과", text, url });
        return;
      }
    } catch {
      /* 사용자가 공유 취소 — 무시 */
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert("결과가 복사됐어요! 원하는 곳에 붙여넣기 하세요.");
    } catch {
      alert(text);
    }
  }

  // ─────────────────────────── 인트로 ───────────────────────────
  if (stage === "intro") {
    return (
      <Shell>
        <div className="text-center">
          <div className="text-6xl mb-4">🧭</div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            나는 어떤 정치성향?
          </h1>
          <p className="mb-4 leading-relaxed text-gray-600">
            개딸? 뉴라이트? 양비론자? 일베 감성?
            <br />
            진영·온도·근거·행동 <b>4축</b>으로 <b>20가지 유형</b> 중 하나로 진단.
          </p>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3.5 py-1.5 text-sm font-bold text-pink-700">
            ⚡ 6문항이면 1차 결과 · 끝까지 풀면 정밀 유형
          </div>
          <p className="mb-8 text-xs leading-relaxed text-gray-400">
            ⚠️ 재미로 보는 <b>풍자 테스트</b>예요. 양 진영을 골고루 풍자하며,
            결과는 자가진단일 뿐 누군가를 규정하지 않습니다.
          </p>
          <button
            onClick={() => {
              track("test_start");
              setStage("quiz");
            }}
            className="rounded-2xl bg-pink-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-pink-700"
          >
            시작하기 →
          </button>
          <div className="mt-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← 홈으로
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ─────────────────────────── 퀴즈 ───────────────────────────
  if (stage === "quiz") {
    const q = QUESTIONS[idx];
    return (
      <Shell>
        {/* 진행 바 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              {idx + 1} / {QUESTIONS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
          Q{idx + 1}. {q.text}
        </h2>

        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(opt)}
              className="text-left px-5 py-4 rounded-xl border border-gray-200 hover:border-pink-400 hover:bg-pink-50 transition text-gray-800"
            >
              {opt.label}
            </button>
          ))}
        </div>

        {idx > 0 && (
          <button
            onClick={() => setIdx(idx - 1)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600"
          >
            ← 이전 질문
          </button>
        )}
      </Shell>
    );
  }

  // ─────────────────────── 1차 빠른 진단(중간) ───────────────────────
  if (stage === "interim" && coarse) {
    const t = THEME[coarse.tone];
    return (
      <Shell>
        <div className="text-center">
          {/* 투자감 — 이미 6문항 풀었다는 진척 신호 */}
          <div className="mb-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
            <span
              className={`rounded-full ${t.accentBg} px-2 py-0.5 font-bold text-white`}
            >
              1차 완료
            </span>
            <span>· 6문항 분석 끝</span>
          </div>

          <p className={`text-xs font-bold tracking-wide ${t.accentText}`}>
            ⚡ 당신을 큰 그림으로 보면
          </p>
          <div className="my-4 text-7xl">{coarse.emoji}</div>
          <h2 className="text-2xl font-extrabold leading-snug text-gray-900">
            {coarse.label}
          </h2>
          <p className="mt-3 leading-relaxed text-gray-600">{coarse.desc}</p>

          {/* 호기심 갭 + 보상 (노력 대신 궁금증·보상을 앞세움) */}
          <div
            className={`mt-7 rounded-2xl border bg-gradient-to-b ${t.soft} p-5`}
          >
            <p className="text-base font-extrabold text-gray-900">
              🔍 그래서, 정확히 어떤 타입?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {coarse.tease}
            </p>
            <p className={`mt-3 text-sm font-bold ${t.accentText}`}>
              1분만 더 — 20유형 중 내 유형 + 숨은 특수 칭호 공개
            </p>
          </div>

          <button
            onClick={continueQuiz}
            className={`mt-6 w-full rounded-xl ${t.accentBg} ${t.accentBgHover} px-6 py-3.5 font-bold text-white transition`}
          >
            내 정확한 유형 확인하기 →
          </button>
          <button
            onClick={restart}
            className="mt-3 text-xs text-gray-400 underline-offset-2 hover:underline"
          >
            처음부터 다시
          </button>
        </div>
      </Shell>
    );
  }

  // ─────────────────────────── 결과 ───────────────────────────
  if (stage === "result" && result) {
    const a = result.archetype;
    // 진영색 테마 — 진보(J)=블루, 보수(B)=레드, 중도(—)=슬레이트. (literal 클래스라 Tailwind JIT 포함됨)
    const faction =
      a.code === "—" ? "center" : a.code[0] === "J" ? "prog" : "cons";
    const theme = THEME[faction];
    return (
      <Shell>
        <div
          ref={cardRef}
          className={`rounded-2xl bg-gradient-to-b ${theme.card} break-keep border p-6 text-center`}
        >
          <p className="text-xs font-medium tracking-wide text-gray-400">
            나의 정치성향 유형
          </p>
          <ArchetypeVisual id={a.id} emoji={a.emoji} name={a.name} />
          <h1 className="pb-1 text-3xl font-extrabold leading-snug text-gray-900">
            {a.name}
          </h1>
          <p className={`mt-3 text-lg font-semibold ${theme.accentText}`}>
            “{a.tagline}”
          </p>
          <p className="mt-3 leading-relaxed text-gray-700">{a.desc}</p>

          {result.badges.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs text-gray-400">획득한 특수 칭호</p>
              <div className="flex flex-col items-center gap-1">
                {result.badges.map((b) => (
                  <p
                    key={b.id}
                    title={b.desc}
                    className="text-sm font-semibold text-gray-800"
                  >
                    {b.emoji} {b.name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {(a.good || a.bad) && (
            <div className="mt-6 flex justify-center gap-8 text-sm">
              {a.good && (
                <div>
                  <p className="text-gray-400">환상의 케미</p>
                  <p className="mt-0.5 font-semibold text-green-600">{a.good}</p>
                </div>
              )}
              {a.bad && (
                <div>
                  <p className="text-gray-400">물과 기름</p>
                  <p className="mt-0.5 font-semibold text-red-500">{a.bad}</p>
                </div>
              )}
            </div>
          )}

          {/* 출처 CTA — 저장/공유 이미지에 같이 박혀서 본 사람이 테스트로 유입 */}
          <div className={`mt-6 border-t pt-4 ${theme.line}`}>
            <p className={`text-sm font-extrabold ${theme.accentText}`}>
              🧭 나는 어떤 정치성향?
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {host ? `${host}/test 에서 테스트` : "지금 바로 테스트하기"}
            </p>
          </div>
        </div>

        {/* 뱃지 상세 설명 */}
        {result.badges.length > 0 && (
          <div className="mt-4 space-y-1">
            {result.badges.map((b) => (
              <p key={b.id} className="text-xs text-gray-500">
                <b>
                  {b.emoji} {b.name}
                </b>{" "}
                — {b.desc}
              </p>
            ))}
          </div>
        )}

        {/* 액션 */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={share}
            className="px-6 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition"
          >
            결과 공유하기
          </button>
          <button
            onClick={saveImage}
            disabled={saving}
            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50"
          >
            {saving ? "이미지 생성 중…" : "🖼️ 이미지로 저장 (PNG)"}
          </button>
          {OPENCHAT_URL && !OPENCHAT_URL.includes("REPLACE_ME") && (
            <a
              href={OPENCHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition text-center"
            >
              💬 같은 유형 사람들과 수다 떨기 (오픈카톡)
            </a>
          )}
          <button
            onClick={restart}
            className="px-6 py-3 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            다시 하기
          </button>
        </div>

        <Guestbook type={a.name} emoji={a.emoji} tone={faction} />

        <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
          이 테스트는 풍자·오락용이며 학술적 진단이 아닙니다.
          <br />
          6·3 사태 관련 '부정선거' 주장은 법원·선관위·AFP 팩트체크에서
          근거 없음으로 확인된 바 있습니다.
        </p>
      </Shell>
    );
  }

  return null;
}

// ─────────────────────────── 방명록 ───────────────────────────
type GbEntry = {
  nick: string;
  msg: string;
  type: string;
  emoji: string;
  tone: "prog" | "cons" | "center";
  ts: number;
};
const TONE_TEXT: Record<string, string> = {
  prog: "text-blue-600",
  cons: "text-red-600",
  center: "text-slate-600",
};

function Guestbook({
  type,
  emoji,
  tone,
}: {
  type: string;
  emoji: string;
  tone: "prog" | "cons" | "center";
}) {
  const [entries, setEntries] = useState<GbEntry[]>([]);
  const [configured, setConfigured] = useState(true);
  const [nick, setNick] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || []);
        setConfigured(d.configured !== false);
      })
      .catch(() => setConfigured(false));
  }, []);

  async function submit() {
    if (!msg.trim() || sending) return;
    setSending(true);
    setErr("");
    try {
      const r = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, msg, type, emoji, tone }),
      });
      const d = await r.json();
      if (d.ok) {
        track("guestbook_submit", { type });
        setEntries((prev) => [d.entry, ...prev]);
        setMsg("");
        setNick("");
      } else setErr(d.error || "남기지 못했어요.");
    } catch {
      setErr("네트워크 오류가 났어요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 break-keep">
      <h3 className="text-lg font-extrabold text-gray-900">📝 방명록</h3>
      <p className="mt-1 text-xs text-gray-400">
        내 유형과 함께 한마디 남기기 · 누구나 볼 수 있어요
      </p>

      {!configured ? (
        <p className="mt-3 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-400">
          방명록 준비 중이에요. 곧 열려요!
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              maxLength={12}
              placeholder="닉네임 (1회용)"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="한마디 남기기… (최대 200자)"
              className="resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button
              onClick={submit}
              disabled={sending || !msg.trim()}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:opacity-40"
            >
              {sending ? "남기는 중…" : `${emoji} ${type}(으)로 남기기`}
            </button>
          </div>

          <div className="mt-5 space-y-2.5">
            {entries.length === 0 && (
              <p className="py-2 text-center text-xs text-gray-300">
                아직 방명록이 없어요. 첫 한마디를 남겨보세요!
              </p>
            )}
            {entries.map((e, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3 text-left">
                <p className="text-xs">
                  <b className="text-gray-800">{e.nick}</b>
                  <span
                    className={`ml-1.5 font-semibold ${
                      TONE_TEXT[e.tone] || "text-slate-600"
                    }`}
                  >
                    {e.emoji} {e.type}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">
                  {e.msg}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 유형 일러스트 슬롯: /test-images/{ID}.png 가 있으면 사용, 없으면 이모지로 폴백.
// (앱에서 뽑은 AI 캐릭터 PNG를 public/test-images/ 에 넣으면 코드 수정 없이 자동 적용)
function ArchetypeVisual({
  id,
  emoji,
  name,
}: {
  id: string;
  emoji: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="my-4 flex justify-center">
      {failed ? (
        <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-white/70 text-7xl ring-1 ring-pink-100">
          {emoji}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/test-images/${id}.png`}
          alt={name}
          onError={() => setFailed(true)}
          className="h-36 w-36 rounded-2xl object-contain shadow-sm ring-1 ring-black/5"
        />
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8 break-keep">
        {children}
      </div>
    </main>
  );
}
