/// <reference types="vite/client" />

interface PageAgentInstance {
	panel: { show: () => void; hide: () => void }
	execute: (task: string) => Promise<unknown>
	dispose: () => void
	config: Record<string, unknown>
}

type PageAgentConstructor = new (config: {
	model: string
	baseURL: string
	apiKey?: string
	language?: string
}) => PageAgentInstance

interface Window {
	PageAgent?: PageAgentConstructor
	pageAgent?: PageAgentInstance
}
