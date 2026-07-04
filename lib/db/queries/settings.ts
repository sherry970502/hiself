import { getDb } from '../index'
import { EMPTY_PROFILE, type BoardProfile } from '@/types'

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
