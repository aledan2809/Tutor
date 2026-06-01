import type { Metadata } from "next";
import { getMagicQuizPublic } from "@/lib/magic-quiz";
import { DuelClient } from "./duel-client";

export const dynamic = "force-dynamic";

const BASE = process.env.AUTH_URL || "https://etutor.ro";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const ro = locale !== "en";
  const quiz = await getMagicQuizPublic(id);
  const s = quiz?.sharerScore ?? 0;
  const t = quiz?.total ?? 5;
  const who = quiz?.creatorName ? quiz.creatorName : ro ? "Cineva" : "Someone";
  const title = ro
    ? `Provocare: bate scorul de ${s}/${t} 🎯`
    : `Challenge: beat ${s}/${t} 🎯`;
  const description = ro
    ? `${who} te provoacă la un quiz generat de AI pe etutor.ro. Reușești?`
    : `${who} challenges you to an AI-generated quiz on etutor.ro. Can you beat it?`;
  const ogUrl = `${BASE}/api/og/score?s=${s}&t=${t}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function DuelPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return <DuelClient quizId={id} locale={locale} />;
}
