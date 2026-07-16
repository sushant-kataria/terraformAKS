import { type ModelSession, PAGE_AGENT_VERSION } from './providers'

export function oneCommandStart(): string {
	return 'npm start'
}

export function npmSnippet(session: ModelSession): string {
	const keyLine = session.apiKey ? `\n    apiKey: ${JSON.stringify(session.apiKey)},` : ''

	return `import { PageAgent } from 'page-agent'

const agent = new PageAgent({
    model: ${JSON.stringify(session.model)},
    baseURL: ${JSON.stringify(session.baseURL)},${keyLine}
    language: 'en-US',
})

await agent.execute('Click the login button')`
}

function demoScriptUrl(session: ModelSession): string {
	const params = new URLSearchParams({
		model: session.model,
		baseURL: session.baseURL,
		lang: 'en-US',
		showPanel: 'true',
	})
	if (session.apiKey) params.set('apiKey', session.apiKey)
	return `https://cdn.jsdelivr.net/npm/page-agent@${PAGE_AGENT_VERSION}/dist/iife/page-agent.demo.js?${params.toString()}`
}

export function scriptTagSnippet(session: ModelSession): string {
	return `<script
  src="${demoScriptUrl(session)}"
  crossorigin="anonymous"
></script>`
}

export function bookmarklet(session: ModelSession): string {
	const src = demoScriptUrl(session)
	const code = `
(function(){
  if(window.pageAgent){try{window.pageAgent.dispose()}catch(e){}}
  var s=document.createElement('script');
  s.src=${JSON.stringify(src)};
  s.crossOrigin='anonymous';
  document.documentElement.appendChild(s);
})();`
		.replace(/\s+/g, ' ')
		.trim()

	return `javascript:${encodeURIComponent(code)}`
}

export function maskKey(key: string): string {
	if (!key) return 'not required'
	if (key.length <= 8) return '••••••••'
	return `${key.slice(0, 3)}••••${key.slice(-4)}`
}
