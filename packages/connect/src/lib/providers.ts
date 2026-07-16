export type ProviderId =
	'demo' | 'dashscope' | 'openai' | 'openrouter' | 'deepseek' | 'ollama' | 'lmstudio' | 'custom'

export interface ProviderDefinition {
	id: ProviderId
	name: string
	tagline: string
	baseURL: string
	models: string[]
	needsKey: boolean
	docsUrl?: string
	keyHint?: string
}

export const PAGE_AGENT_VERSION = '1.12.1'

export const DEMO_PROVIDER: ProviderDefinition = {
	id: 'demo',
	name: 'Free Demo',
	tagline: 'Try instantly with the public testing API',
	baseURL: 'https://page-ag-testing-ohftxirgbn.cn-shanghai.fcapp.run',
	models: ['qwen3.5-plus', 'qwen3.5-flash'],
	needsKey: false,
	docsUrl: 'https://alibaba.github.io/page-agent/docs/features/models#free-testing-api',
}

export const PROVIDERS: ProviderDefinition[] = [
	DEMO_PROVIDER,
	{
		id: 'dashscope',
		name: 'Alibaba Bailian',
		tagline: 'DashScope OpenAI-compatible endpoint',
		baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
		models: ['qwen3.5-plus', 'qwen3.5-flash', 'qwen3-max'],
		needsKey: true,
		docsUrl: 'https://bailian.console.aliyun.com/',
		keyHint: 'DashScope API key',
	},
	{
		id: 'openai',
		name: 'OpenAI',
		tagline: 'GPT models with tool calling',
		baseURL: 'https://api.openai.com/v1',
		models: ['gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-4.1-mini'],
		needsKey: true,
		docsUrl: 'https://platform.openai.com/api-keys',
		keyHint: 'sk-...',
	},
	{
		id: 'openrouter',
		name: 'OpenRouter',
		tagline: 'One key for many providers',
		baseURL: 'https://openrouter.ai/api/v1',
		models: ['openai/gpt-5.4-mini', 'google/gemini-2.5-flash', 'anthropic/claude-haiku-4.5'],
		needsKey: true,
		docsUrl: 'https://openrouter.ai/keys',
		keyHint: 'sk-or-...',
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		tagline: 'Fast tool-calling models',
		baseURL: 'https://api.deepseek.com',
		models: ['deepseek-v4-flash', 'deepseek-3.2'],
		needsKey: true,
		docsUrl: 'https://platform.deepseek.com/api_keys',
		keyHint: 'DeepSeek API key',
	},
	{
		id: 'ollama',
		name: 'Ollama',
		tagline: 'Local models on your machine',
		baseURL: 'http://localhost:11434/v1',
		models: ['qwen3:14b', 'qwen3:30b'],
		needsKey: false,
		docsUrl: 'https://ollama.com/',
	},
	{
		id: 'lmstudio',
		name: 'LM Studio',
		tagline: 'Local OpenAI-compatible server',
		baseURL: 'http://127.0.0.1:1234/v1',
		models: ['qwen/qwen3.5-27b'],
		needsKey: false,
		docsUrl: 'https://lmstudio.ai/',
	},
	{
		id: 'custom',
		name: 'Custom endpoint',
		tagline: 'Any OpenAI-compatible base URL',
		baseURL: '',
		models: [],
		needsKey: true,
		keyHint: 'Optional if your proxy does not need one',
	},
]

export interface ModelSession {
	providerId: ProviderId
	providerName: string
	baseURL: string
	model: string
	apiKey: string
	savedAt: string
}

export function getProvider(id: ProviderId): ProviderDefinition {
	return PROVIDERS.find((p) => p.id === id) ?? DEMO_PROVIDER
}
