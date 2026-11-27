import { prisma } from '@/lib/db';
import type { BotLang } from './i18n';

export interface ChatState {
  id: string;
  userId: string | null;
  lang: BotLang;
  langChosen: boolean;
  step: string | null;
  draft: Record<string, any>;
}

function normalize(row: any): ChatState {
  let draft: Record<string, any> = {};
  if (row?.draft && typeof row.draft === 'object') draft = row.draft as Record<string, any>;
  return {
    id: row.id,
    userId: row.userId ?? null,
    lang: (row.lang === 'ru' ? 'ru' : 'en') as BotLang,
    langChosen: row.langChosen ?? false,
    step: row.step ?? null,
    draft,
  };
}

// Maps a Telegram user's app language_code to our bot language. Russian users
// default to Russian; everyone else defaults to English.
export function detectBotLang(languageCode?: string | null): BotLang {
  return (languageCode || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

// Fetches the chat state row, creating it on first contact. When creating, the
// optional langHint (from Telegram's from.language_code) sets the initial
// language; defaults to English.
export async function ensureChat(tgId: string, langHint?: string | null): Promise<ChatState> {
  const row = await prisma.telegramChat.upsert({
    where: { id: tgId },
    update: {},
    create: { id: tgId, lang: detectBotLang(langHint) },
  });
  return normalize(row);
}

export async function setStep(tgId: string, step: string | null): Promise<void> {
  await prisma.telegramChat.update({ where: { id: tgId }, data: { step } });
}

export async function setDraft(tgId: string, draft: Record<string, any>): Promise<void> {
  await prisma.telegramChat.update({ where: { id: tgId }, data: { draft } });
}

export async function setStepAndDraft(
  tgId: string,
  step: string | null,
  draft: Record<string, any>
): Promise<void> {
  await prisma.telegramChat.update({ where: { id: tgId }, data: { step, draft } });
}

export async function resetFlow(tgId: string): Promise<void> {
  await prisma.telegramChat.update({ where: { id: tgId }, data: { step: null, draft: {} } });
}

export async function setLang(tgId: string, lang: BotLang): Promise<void> {
  await prisma.telegramChat.update({ where: { id: tgId }, data: { lang, langChosen: true } });
}

// Links this Telegram chat to an Eatwise user account. Because userId is unique,
// any other chat pointing at the same user is unlinked first.
export async function linkUser(tgId: string, userId: string): Promise<void> {
  await prisma.telegramChat.updateMany({
    where: { userId, NOT: { id: tgId } },
    data: { userId: null },
  });
  await prisma.telegramChat.update({
    where: { id: tgId },
    data: { userId, step: null, draft: {} },
  });
}

export async function unlinkUser(tgId: string): Promise<void> {
  await prisma.telegramChat.update({
    where: { id: tgId },
    data: { userId: null, step: null, draft: {} },
  });
}

// Returns the linked user (with profile) or null.
export async function getLinkedUser(tgId: string) {
  const chat = await prisma.telegramChat.findUnique({ where: { id: tgId } });
  if (!chat?.userId) return null;
  return prisma.user.findUnique({
    where: { id: chat.userId },
    include: { profile: true },
  });
}

// Finds the Telegram chat linked to a given user (for outbound notifications).
export async function findChatByUserId(userId: string): Promise<string | null> {
  const chat = await prisma.telegramChat.findFirst({ where: { userId } });
  return chat?.id ?? null;
}
