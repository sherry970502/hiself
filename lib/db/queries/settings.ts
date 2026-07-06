import { randomBytes } from 'crypto'
import { getDb } from '../index'
import { EMPTY_PROFILE, EMPTY_ACCESS, type BoardProfile, type BoardAccess } from '@/types'

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  getDb().prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value)
}

export function getBoardProfile(): BoardProfile {
  const raw = getSetting('board_profile')
  if (!raw) return EMPTY_PROFILE
  try {
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) }
  } catch {
    return EMPTY_PROFILE
  }
}

export function setBoardProfile(profile: BoardProfile) {
  setSetting('board_profile', JSON.stringify(profile))
}

// ─── 看板访问权限 ─────────────────────────────────────────────────────────────

const genId = () => `c_${randomBytes(5).toString('hex')}`

export function getBoardAccess(): BoardAccess {
  const raw = getSetting('board_access')
  if (!raw) return { ...EMPTY_ACCESS }
  try {
    const p = JSON.parse(raw)
    return {
      mode: p.mode === 'private' ? 'private' : 'public',
      challenges: Array.isArray(p.challenges)
        ? p.challenges
            .map((c: { id?: string; question?: string; answer?: string }) => ({
              id: typeof c.id === 'string' && c.id ? c.id : genId(),
              question: String(c.question ?? '').trim(),
              answer: String(c.answer ?? '').trim(),
            }))
            .filter((c: { question: string; answer: string }) => c.question && c.answer)
        : [],
      token: typeof p.token === 'string' ? p.token : '',
    }
  } catch {
    return { ...EMPTY_ACCESS }
  }
}

/** 保存访问设置。凭据 token 一经生成保持稳定(改题目不会把已进入的访客踢出)。 */
export function setBoardAccess(input: { mode?: unknown; challenges?: unknown }): BoardAccess {
  const existing = getBoardAccess()
  const mode: BoardAccess['mode'] = input.mode === 'private' ? 'private' : 'public'
  const challenges = Array.isArray(input.challenges)
    ? input.challenges
        .map((c: { id?: string; question?: string; answer?: string }) => ({
          id: typeof c?.id === 'string' && c.id ? c.id : genId(),
          question: String(c?.question ?? '').trim(),
          answer: String(c?.answer ?? '').trim(),
        }))
        .filter((c: { question: string; answer: string }) => c.question && c.answer)
        .slice(0, 20)
    : []
  const token = existing.token || randomBytes(24).toString('hex')
  const access: BoardAccess = { mode, challenges, token }
  setSetting('board_access', JSON.stringify(access))
  return access
}

export const normalizeAnswer = (s: string) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')

/** 校验某道题的答案是否正确 */
export function verifyChallenge(id: string, answer: string): boolean {
  const c = getBoardAccess().challenges.find(x => x.id === id)
  return !!c && normalizeAnswer(c.answer) === normalizeAnswer(answer)
}
