import { useEffect, useMemo, useState } from 'react'

import {
	DEMO_PROVIDER,
	type ModelSession,
	PAGE_AGENT_VERSION,
	PROVIDERS,
	type ProviderId,
	getProvider,
} from './lib/providers'
import { bookmarklet, maskKey, npmSnippet, oneCommandStart, scriptTagSnippet } from './lib/snippet'
import {
	getActiveSession,
	loadSessions,
	removeSession,
	setActiveSessionKey,
	upsertSession,
} from './lib/storage'

type SnippetKind = 'command' | 'script' | 'npm' | 'bookmarklet'

const PAGE_AGENT_CDN = `https://cdn.jsdelivr.net/npm/page-agent@${PAGE_AGENT_VERSION}/dist/iife/page-agent.demo.js?autoInit=false`

export default function App() {
	const [sessions, setSessions] = useState<ModelSession[]>(() => loadSessions())
	const [active, setActive] = useState<ModelSession>(() => getActiveSession())
	const [providerId, setProviderId] = useState<ProviderId>(active.providerId)
	const [apiKey, setApiKey] = useState(active.apiKey)
	const [model, setModel] = useState(active.model)
	const [customBaseURL, setCustomBaseURL] = useState(
		active.providerId === 'custom' ? active.baseURL : ''
	)
	const [customModel, setCustomModel] = useState(active.providerId === 'custom' ? active.model : '')
	const [snippetKind, setSnippetKind] = useState<SnippetKind>('command')
	const [toast, setToast] = useState<string | null>(null)
	const [agentStatus, setAgentStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
	const [task, setTask] = useState('Fill the demo form with a sample user and submit')

	const provider = useMemo(() => getProvider(providerId), [providerId])

	useEffect(() => {
		if (!toast) return
		const id = window.setTimeout(() => setToast(null), 2200)
		return () => window.clearTimeout(id)
	}, [toast])

	useEffect(() => {
		if (providerId === 'custom') return
		if (!provider.models.includes(model)) {
			setModel(provider.models[0] ?? '')
		}
		if (providerId !== 'custom' && active.providerId === providerId && active.apiKey) {
			setApiKey(active.apiKey)
		}
	}, [providerId, provider.models, model, active])

	const showToast = (message: string) => setToast(message)

	const copyText = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value)
			showToast(`${label} copied`)
		} catch {
			showToast('Could not copy — select and copy manually')
		}
	}

	const handleSave = () => {
		const baseURL = providerId === 'custom' ? customBaseURL.trim() : provider.baseURL
		const selectedModel = providerId === 'custom' ? customModel.trim() : model.trim()

		if (!baseURL) {
			showToast('Base URL is required')
			return
		}
		if (!selectedModel) {
			showToast('Model is required')
			return
		}
		if (provider.needsKey && !apiKey.trim()) {
			showToast('API key is required for this provider')
			return
		}

		const session: ModelSession = {
			providerId,
			providerName: provider.name,
			baseURL,
			model: selectedModel,
			apiKey: apiKey.trim(),
			savedAt: new Date().toISOString(),
		}
		const next = upsertSession(session)
		setSessions(next)
		setActive(session)
		showToast(`${provider.name} saved`)
	}

	const selectSession = (session: ModelSession) => {
		setActiveSessionKey(session.providerId, session.model)
		setActive(session)
		setProviderId(session.providerId)
		setApiKey(session.apiKey)
		setModel(session.model)
		if (session.providerId === 'custom') {
			setCustomBaseURL(session.baseURL)
			setCustomModel(session.model)
		}
	}

	const deleteSession = (session: ModelSession) => {
		const next = removeSession(session.providerId, session.model)
		setSessions(next)
		const fallback = getActiveSession()
		setActive(fallback)
		setProviderId(fallback.providerId)
		setApiKey(fallback.apiKey)
		setModel(fallback.model)
		showToast('Model removed')
	}

	const ensureAgentLoaded = async () => {
		if (window.PageAgent) return
		setAgentStatus('loading')
		await new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>('script[data-page-agent-connect]')
			if (existing) {
				existing.addEventListener('load', () => resolve(), { once: true })
				existing.addEventListener('error', () => reject(new Error('load failed')), { once: true })
				return
			}
			const script = document.createElement('script')
			script.src = PAGE_AGENT_CDN
			script.crossOrigin = 'anonymous'
			script.dataset.pageAgentConnect = 'true'
			script.onload = () => resolve()
			script.onerror = () => reject(new Error('Failed to load PageAgent'))
			document.head.appendChild(script)
		})
	}

	const connectAgent = async () => {
		try {
			await ensureAgentLoaded()
			if (!window.PageAgent) throw new Error('PageAgent unavailable')
			if (window.pageAgent) {
				try {
					window.pageAgent.dispose()
				} catch {
					// ignore dispose errors from previous sessions
				}
			}
			window.pageAgent = new window.PageAgent({
				model: active.model,
				baseURL: active.baseURL,
				apiKey: active.apiKey || undefined,
				language: 'en-US',
			})
			window.pageAgent.panel.show()
			setAgentStatus('ready')
			showToast(`Connected · ${active.model}`)
		} catch (error) {
			console.error(error)
			setAgentStatus('error')
			showToast('Could not load PageAgent from CDN')
		}
	}

	const runTask = async () => {
		if (!window.pageAgent) {
			await connectAgent()
		}
		if (!window.pageAgent) return
		try {
			await window.pageAgent.execute(task)
		} catch (error) {
			console.error(error)
			showToast('Task failed — check model credentials')
		}
	}

	const snippet = useMemo(() => {
		switch (snippetKind) {
			case 'script':
				return scriptTagSnippet(active)
			case 'npm':
				return npmSnippet(active)
			case 'bookmarklet':
				return bookmarklet(active)
			case 'command':
			default:
				return oneCommandStart()
		}
	}, [snippetKind, active])

	return (
		<div className="app">
			<header className="topbar">
				<a className="brand" href="#top" aria-label="PageAgent Connect">
					<span className="brand-mark" aria-hidden="true" />
					<span className="brand-name">PageAgent</span>
				</a>
				<nav className="top-links">
					<a href="#models">Models</a>
					<a href="#connect">Connect</a>
					<a href="#playground">Playground</a>
					<a href="https://github.com/alibaba/page-agent" target="_blank" rel="noreferrer">
						Upstream
					</a>
				</nav>
			</header>

			<main>
				<section className="hero" id="top">
					<p className="hero-brand">PageAgent</p>
					<h2>Connect any page to your models in one command.</h2>
					<p>
						Start the local Connect UI, log in a provider with your API key, pick a model, then drop
						a one-line script onto any site.
					</p>
					<div className="cta-row">
						<div className="command-pill">
							<code>{oneCommandStart()}</code>
							<button
								type="button"
								className="btn btn-ghost btn-small"
								onClick={() => copyText(oneCommandStart(), 'Command')}
							>
								Copy
							</button>
						</div>
						<a className="btn btn-primary" href="#models">
							Add a model
						</a>
						<button type="button" className="btn btn-ghost" onClick={connectAgent}>
							Launch on this page
						</button>
					</div>
				</section>

				<section className="section" id="models">
					<div className="section-head">
						<h3>Log in providers, add models</h3>
						<p>
							Keys stay in your browser localStorage. Use the free demo to evaluate, or bring your
							own OpenAI-compatible endpoint.
						</p>
					</div>

					<div className="provider-grid">
						{PROVIDERS.map((item) => (
							<button
								key={item.id}
								type="button"
								className={`provider-option${providerId === item.id ? ' active' : ''}`}
								onClick={() => {
									setProviderId(item.id)
									if (item.id !== 'custom') {
										setModel(item.models[0] ?? '')
									}
									if (!item.needsKey) setApiKey('')
								}}
							>
								<strong>{item.name}</strong>
								<span>{item.tagline}</span>
							</button>
						))}
					</div>

					<div className="login-panel">
						<div className="login-grid">
							<form
								onSubmit={(event) => {
									event.preventDefault()
									handleSave()
								}}
							>
								{providerId === 'custom' ? (
									<>
										<div className="field">
											<label htmlFor="baseURL">Base URL</label>
											<input
												id="baseURL"
												value={customBaseURL}
												onChange={(e) => setCustomBaseURL(e.target.value)}
												placeholder="https://your-proxy.example/v1"
												autoComplete="off"
											/>
										</div>
										<div className="field">
											<label htmlFor="customModel">Model</label>
											<input
												id="customModel"
												value={customModel}
												onChange={(e) => setCustomModel(e.target.value)}
												placeholder="your-model-id"
												autoComplete="off"
											/>
										</div>
									</>
								) : (
									<div className="field">
										<label htmlFor="model">Model</label>
										<select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
											{provider.models.map((item) => (
												<option key={item} value={item}>
													{item}
												</option>
											))}
										</select>
									</div>
								)}

								{provider.needsKey && (
									<div className="field">
										<label htmlFor="apiKey">API key</label>
										<input
											id="apiKey"
											type="password"
											value={apiKey}
											onChange={(e) => setApiKey(e.target.value)}
											placeholder={provider.keyHint || 'API key'}
											autoComplete="off"
										/>
									</div>
								)}

								{!provider.needsKey && providerId !== 'demo' && (
									<p className="helper">No API key needed for local runtimes. Enable CORS first.</p>
								)}
								{providerId === 'demo' && (
									<p className="helper">
										Demo endpoint is for evaluation only.{' '}
										<a href={DEMO_PROVIDER.docsUrl} target="_blank" rel="noreferrer">
											Terms
										</a>
									</p>
								)}
								{provider.docsUrl && providerId !== 'demo' && (
									<p className="helper">
										Get a key from{' '}
										<a href={provider.docsUrl} target="_blank" rel="noreferrer">
											{provider.name}
										</a>
										.
									</p>
								)}

								<div className="cta-row">
									<button type="submit" className="btn btn-primary">
										Save model login
									</button>
								</div>
							</form>

							<div className="session-list">
								{sessions.length === 0 ? (
									<div className="session-item">
										<strong>No saved logins yet</strong>
										<span className="helper">
											Active fallback: {DEMO_PROVIDER.name} · {DEMO_PROVIDER.models[0]}
										</span>
									</div>
								) : (
									sessions.map((session) => {
										const isActive =
											session.providerId === active.providerId && session.model === active.model
										return (
											<div
												key={`${session.providerId}:${session.model}`}
												className={`session-item${isActive ? ' active' : ''}`}
											>
												<div className="meta">
													<strong>{session.providerName}</strong>
													{isActive && <span className="chip">active</span>}
												</div>
												<code>{session.model}</code>
												<span className="helper">key: {maskKey(session.apiKey)}</span>
												<div className="session-actions">
													<button
														type="button"
														className="btn btn-ghost btn-small"
														onClick={() => selectSession(session)}
													>
														Use
													</button>
													<button
														type="button"
														className="btn btn-ghost btn-small"
														onClick={() => deleteSession(session)}
													>
														Remove
													</button>
												</div>
											</div>
										)
									})
								)}
							</div>
						</div>
					</div>
				</section>

				<section className="section" id="connect">
					<div className="section-head">
						<h3>One-command connect</h3>
						<p>
							Active model: <strong>{active.model}</strong> via {active.providerName}. Copy the
							snippet that fits how you want to ship.
						</p>
					</div>

					<div className="snippet-tabs" role="tablist" aria-label="Snippet type">
						{(
							[
								['command', 'npm start'],
								['script', 'Script tag'],
								['npm', 'NPM'],
								['bookmarklet', 'Bookmarklet'],
							] as const
						).map(([id, label]) => (
							<button
								key={id}
								type="button"
								className={snippetKind === id ? 'active' : ''}
								onClick={() => setSnippetKind(id)}
							>
								{label}
							</button>
						))}
					</div>

					<div className="snippet-box">
						<button
							type="button"
							className="btn btn-ghost btn-small copy"
							onClick={() => copyText(snippet, 'Snippet')}
						>
							Copy
						</button>
						<pre>{snippet}</pre>
					</div>
					{snippetKind === 'bookmarklet' && (
						<p className="helper" style={{ marginTop: '0.75rem' }}>
							Drag the copied bookmarklet into your bookmarks bar, then click it on any page.
						</p>
					)}
				</section>

				<section className="section" id="playground">
					<div className="section-head">
						<h3>Try it here</h3>
						<p>
							Load PageAgent on this page with your active model and run a natural-language task.
						</p>
					</div>

					<div className="playground">
						<div className="playground-toolbar">
							<span className={`status${agentStatus === 'ready' ? ' ready' : ''}`}>
								{agentStatus === 'ready'
									? `Ready · ${active.model}`
									: agentStatus === 'loading'
										? 'Loading PageAgent…'
										: agentStatus === 'error'
											? 'CDN load failed'
											: 'Not connected'}
							</span>
							<div className="cta-row">
								<button type="button" className="btn btn-ghost btn-small" onClick={connectAgent}>
									Connect
								</button>
								<button type="button" className="btn btn-primary btn-small" onClick={runTask}>
									Run task
								</button>
							</div>
						</div>
						<div className="demo-page">
							<h4>Sample checkout form</h4>
							<p>Ask the agent to fill and submit this form.</p>
							<form
								className="demo-form"
								onSubmit={(event) => {
									event.preventDefault()
									showToast('Form submitted')
								}}
							>
								<div className="field">
									<label htmlFor="name">Full name</label>
									<input id="name" name="name" placeholder="Ada Lovelace" />
								</div>
								<div className="field">
									<label htmlFor="email">Email</label>
									<input id="email" name="email" type="email" placeholder="ada@example.com" />
								</div>
								<div className="field">
									<label htmlFor="plan">Plan</label>
									<select id="plan" name="plan" defaultValue="">
										<option value="" disabled>
											Select a plan
										</option>
										<option value="starter">Starter</option>
										<option value="pro">Pro</option>
										<option value="team">Team</option>
									</select>
								</div>
								<div className="field">
									<label htmlFor="task">Agent task</label>
									<input id="task" value={task} onChange={(e) => setTask(e.target.value)} />
								</div>
								<button type="submit" className="btn btn-primary">
									Submit order
								</button>
							</form>
						</div>
					</div>
				</section>
			</main>

			<footer className="footer">
				<span>Based on alibaba/page-agent v{PAGE_AGENT_VERSION}</span>
				<span>Model keys never leave your browser in this Connect UI.</span>
			</footer>

			{toast && (
				<div className="toast" role="status">
					{toast}
				</div>
			)}
		</div>
	)
}
