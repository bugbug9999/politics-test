import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";

const KEY = "guestbook";
const MAX_KEEP = 500; // 최근 500개만 보관
const LIST_N = 50; // 화면엔 최근 50개

// env가 없으면 null → 앱은 안 깨지고 "준비 중"으로 동작
function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

type Entry = {
  nick: string;
  msg: string;
  type: string;
  emoji: string;
  tone: "prog" | "cons" | "center";
  ts: number;
};

// 제어문자(개행/탭 등)만 제거, 정상 텍스트·공백은 유지
function clean(s: string): string {
  return s.replace(/[\u0000-\u001F\u007F]+/g, "").trim();
}

export async function GET() {
  const redis = getRedis();
  if (!redis) return NextResponse.json({ entries: [], configured: false });
  try {
    const raw = await redis.lrange(KEY, 0, LIST_N - 1);
    const entries = raw.map((r) =>
      typeof r === "string" ? (JSON.parse(r) as Entry) : (r as Entry)
    );
    return NextResponse.json({ entries, configured: true });
  } catch {
    return NextResponse.json({ entries: [], configured: false });
  }
}

export async function POST(req: NextRequest) {
  const redis = getRedis();
  if (!redis)
    return NextResponse.json(
      { ok: false, error: "방명록이 아직 준비 중이에요." },
      { status: 503 }
    );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const nick = clean(String(body.nick ?? "")).slice(0, 12) || "익명";
  const msg = clean(String(body.msg ?? "")).slice(0, 200);
  const type = String(body.type ?? "").slice(0, 30);
  const emoji = String(body.emoji ?? "").slice(0, 8);
  const tone = ["prog", "cons", "center"].includes(String(body.tone))
    ? (body.tone as Entry["tone"])
    : "center";

  if (!msg)
    return NextResponse.json(
      { ok: false, error: "한마디를 입력해주세요." },
      { status: 400 }
    );

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    // 도배 방지: IP당 분당 5개
    const rlKey = `rl:${ip}`;
    const n = await redis.incr(rlKey);
    if (n === 1) await redis.expire(rlKey, 60);
    if (n > 5)
      return NextResponse.json(
        { ok: false, error: "잠시 후 다시 시도해주세요." },
        { status: 429 }
      );

    const entry: Entry = { nick, msg, type, emoji, tone, ts: Date.now() };
    await redis.lpush(KEY, JSON.stringify(entry));
    await redis.ltrim(KEY, 0, MAX_KEEP - 1);
    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json(
      { ok: false, error: "저장에 실패했어요." },
      { status: 500 }
    );
  }
}
