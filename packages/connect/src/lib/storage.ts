import type { ModelSession, ProviderId } from './providers'
import { DEMO_PROVIDER } from './providers'

const SESSIONS_KEY = 'page-agent-connect.sessions'
const ACTIVE_KEY = 'page-agent-connect.active'

export function loadSessions(): ModelSession[] {
	try {
		const raw = localStorage.getItem(SESSIONS_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw) as ModelSession[]
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

export function saveSessions(sessions: ModelSession[]): void {
	localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function upsertSession(session: ModelSession): ModelSession[] {
	const sessions = loadSessions().filter(
		(item) => !(item.providerId === session.providerId && item.model === session.model)
	)
	const next = [session, ...sessions]
	saveSessions(next)
	setActiveSessionKey(session.providerId, session.model)
	return next
}

export function removeSession(providerId: ProviderId, model: string): ModelSession[] {
	const next = loadSessions().filter(
		(item) => !(item.providerId === providerId && item.model === model)
	)
	saveSessions(next)
	const active = getActiveSession()
	if (active?.providerId === providerId && active.model === model) {
		localStorage.removeItem(ACTIVE_KEY)
	}
	return next
}

export function setActiveSessionKey(providerId: ProviderId, model: string): void {
	localStorage.setItem(ACTIVE_KEY, JSON.stringify({ providerId, model }))
}

export function getActiveSession(): ModelSession | null {
	const sessions = loadSessions()
	try {
		const raw = localStorage.getItem(ACTIVE_KEY)
		if (raw) {
			const { providerId, model } = JSON.parse(raw) as {
				providerId: ProviderId
				model: string
			}
			const match = sessions.find((s) => s.providerId === providerId && s.model === model)
			if (match) return match
		}
	} catch {
		// fall through
	}
	if (sessions[0]) return sessions[0]
	return {
		providerId: DEMO_PROVIDER.id,
		providerName: DEMO_PROVIDER.name,
		baseURL: DEMO_PROVIDER.baseURL,
		model: DEMO_PROVIDER.models[0],
		apiKey: '',
		savedAt: new Date(0).toISOString(),
	}
}
