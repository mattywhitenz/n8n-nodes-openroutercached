import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodePropertyOptions,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

interface IOpenRouterModel {
	id: string;
	name: string;
	description?: string;
	context_length: number;
	pricing: {
		prompt: string;
		completion: string;
	};
}

interface IMessageContent {
	type: 'text' | 'image_url';
	text?: string;
	image_url?: {
		url: string;
		detail?: 'auto' | 'low' | 'high';
	};
	cache_control?: {
		type: 'ephemeral';
	};
}

interface IMessage {
	role: string;
	content: string | IMessageContent[];
	name?: string;
	tool_calls?: Array<{
		id: string;
		type: string;
		function: {
			name: string;
			arguments: string;
		};
	}>;
	tool_call_id?: string;
	reasoning_details?: Array<IDataObject>;
}

interface IReasoningDetail {
	type: 'reasoning.summary' | 'reasoning.encrypted' | 'reasoning.text';
	summary?: string;
	data?: string;
	text?: string;
	signature?: string | null;
	id: string | null;
	format: string;
	index?: number;
}

interface IOpenRouterResponse extends IDataObject {
	id: string;
	model: string;
	created: number;
	object: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
		prompt_tokens_details?: {
			cached_tokens?: number;
		};
		completion_tokens_details?: {
			reasoning_tokens?: number;
		};
	};
	cache_discount?: number;
	choices: Array<{
		message: {
			role: string;
			content: string;
			tool_calls?: Array<{
				id: string;
				type: string;
				function: {
					name: string;
					arguments: string;
				};
			}>;
			reasoning?: string;
			reasoning_details?: IReasoningDetail[];
		};
		finish_reason: string;
		index: number;
	}>;
}

export class OpenRouterCached implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenRouter Cached',
		name: 'openRouterCached',
		icon: 'file:openrouter.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with OpenRouter API with advanced caching and reasoning features',
		defaults: {
			name: 'OpenRouter Cached',
		},
		inputs: '={{["main"]}}',
		outputs: '={{["main"]}}',
		credentials: [
			{
				name: 'openRouterCachedApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
						description: 'Send a chat message',
						action: 'Send a chat message',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
			{
				displayName: 'System Prompt',
				name: 'system_prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'System message to set the behavior of the assistant',
				placeholder: 'You are a helpful assistant...',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The message to send to the chat model',
				required: true,
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.9,
				description: 'What sampling temperature to use',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency.',
					},
					{
						displayName: 'Logit Bias',
						name: 'logit_bias',
						type: 'json',
						default: '{}',
						description: 'Modify likelihood of specified tokens appearing. JSON object mapping token IDs to bias values.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						description: 'The maximum number of tokens to generate',
					},
					{
						displayName: 'Number of Completions',
						name: 'n',
						type: 'number',
						default: 1,
						description: 'Number of chat completion choices to generate',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far.',
					},
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'fixedCollection',
						default: {},
						description: 'Specify output format (e.g., JSON mode)',
						options: [
							{
								name: 'format',
								displayName: 'Format',
								values: [
									{
										displayName: 'Type',
										name: 'type',
										type: 'options',
										default: 'json_object',
										options: [
											{
												name: 'JSON Object',
												value: 'json_object',
											},
											{
												name: 'Text',
												value: 'text',
											},
										],
									},
								],
							},
						],
					},
					{
						displayName: 'Seed',
						name: 'seed',
						type: 'number',
						default: undefined,
						description: 'Random seed for deterministic sampling',
					},
					{
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						description: 'Up to 4 sequences where the API will stop generating. Separate with commas.',
						placeholder: 'END,STOP',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						default: 1,
						description:
							'An alternative to sampling with temperature, called nucleus sampling',
					},
				],
			},
			{
				displayName: 'Conversation History',
				name: 'conversationHistory',
				type: 'json',
				default: '[]',
				description: 'Full conversation history as JSON array of message objects. If provided, overrides System Prompt and Message fields. Format: [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi!"}]',
				placeholder: '[{"role": "user", "content": "Hello"}]',
			},
			{
				displayName: 'Prompt Caching',
				name: 'promptCaching',
				type: 'fixedCollection',
				default: {},
				description: 'Enable prompt caching to reduce costs on repeated requests',
				options: [
					{
						name: 'caching',
						displayName: 'Caching Options',
						values: [
							{
								displayName: 'Enable System Prompt Caching',
								name: 'cacheSystemPrompt',
								type: 'boolean',
								default: false,
								description: 'Whether to cache the system prompt (works with Anthropic, Gemini)',
							},
							{
								displayName: 'Cache Message Content',
								name: 'cacheContent',
								type: 'json',
								default: '',
								description: 'Large content to cache (e.g., book chapters, CSV data). Will be added to message with cache_control.',
								placeholder: 'Large text content to cache...',
								displayOptions: {
									show: {
										cacheSystemPrompt: [true],
									},
								},
							},
						],
					},
				],
			},
			{
				displayName: 'Reasoning Tokens',
				name: 'reasoning',
				type: 'fixedCollection',
				default: {},
				description: 'Configure reasoning/thinking tokens for models that support them (o1, o3, GPT-5, Claude 3.7+, DeepSeek R1, etc.)',
				options: [
					{
						name: 'config',
						displayName: 'Reasoning Configuration',
						values: [
							{
								displayName: 'Enable Reasoning',
								name: 'enabled',
								type: 'boolean',
								default: false,
								description: 'Whether to enable reasoning tokens',
							},
							{
								displayName: 'Effort Level',
								name: 'effort',
								type: 'options',
								default: 'medium',
								options: [
									{
										name: 'High',
										value: 'high',
										description: '~80% of max_tokens for reasoning',
									},
									{
										name: 'Medium',
										value: 'medium',
										description: '~50% of max_tokens for reasoning',
									},
									{
										name: 'Low',
										value: 'low',
										description: '~20% of max_tokens for reasoning',
									},
								],
								description: 'How much computational effort to use (OpenAI-style)',
								displayOptions: {
									show: {
										enabled: [true],
									},
								},
							},
							{
								displayName: 'Max Reasoning Tokens',
								name: 'max_tokens',
								type: 'number',
								default: 0,
								description: 'Specific token limit for reasoning (Anthropic/Gemini-style). If set, overrides effort level.',
								displayOptions: {
									show: {
										enabled: [true],
									},
								},
							},
							{
								displayName: 'Exclude Reasoning From Response',
								name: 'exclude',
								type: 'boolean',
								default: false,
								description: 'Whether to exclude reasoning tokens from the response (model still uses them internally)',
								displayOptions: {
									show: {
										enabled: [true],
									},
								},
							},
						],
					},
				],
			},
			{
				displayName: 'Streaming',
				name: 'stream',
				type: 'boolean',
				default: false,
				description: 'Whether to stream the response back in real-time (SSE)',
			},
			{
				displayName: 'Provider Routing',
				name: 'providerRouting',
				type: 'fixedCollection',
				default: {},
				description: 'Configure provider routing and preferences (OpenRouter-specific)',
				options: [
					{
						name: 'routing',
						displayName: 'Routing Options',
						values: [
							{
								displayName: 'Route Strategy',
								name: 'route',
								type: 'options',
								default: '',
								options: [
									{
										name: 'Default',
										value: '',
										description: 'Use default routing',
									},
									{
										name: 'Fallback',
										value: 'fallback',
										description: 'Enable fallback routing for reliability',
									},
								],
							},
							{
								displayName: 'Require Parameters',
								name: 'require_parameters',
								type: 'boolean',
								default: false,
								description: 'Whether to only route to providers that support all specified parameters',
							},
							{
								displayName: 'Zero Data Retention',
								name: 'zero_data_retention',
								type: 'boolean',
								default: false,
								description: 'Whether to only route to providers with Zero Data Retention policies (GDPR/HIPAA compliance)',
							},
							{
								displayName: 'Provider Preferences',
								name: 'provider',
								type: 'json',
								default: '{}',
								description: 'Provider preferences and ordering. Format: {"order": ["OpenAI", "Anthropic"], "require_parameters": true}.',
							},
						],
					},
				],
			},
			{
				displayName: 'Vision / Images',
				name: 'images',
				type: 'json',
				default: '[]',
				description: 'Array of image URLs to include in the message. Format: ["https://example.com/image.jpg"] or [{"URL": "...", "detail": "high"}].',
				placeholder: '["https://example.com/image.jpg"]',
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('openRouterCachedApi');
				const options: IRequestOptions = {
					url: 'https://openrouter.ai/api/v1/models',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
						'HTTP-Referer': 'https://github.com/MatthewSabia/n8n-nodes-openrouter',
						'X-Title': 'n8n OpenRouter Node',
						'Content-Type': 'application/json',
					},
					method: 'GET' as IHttpRequestMethods,
					json: true,
				};

				try {
					const response = await this.helpers.request(options);

					if (!response?.data || !Array.isArray(response.data)) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid response format from OpenRouter API',
						);
					}

					const truncateAndAddPricing = (model: IOpenRouterModel): string => {
						const originalDescription = model.description || '';
						const truncatedDescription = originalDescription.slice(0, Math.floor(originalDescription.length / 2));
						const pricing = `Price: $${parseFloat(model.pricing.prompt) * 1000000}/1M tokens (prompt), $${parseFloat(model.pricing.completion) * 1000000}/1M tokens (completion)`;
						const combinedDescription = `${truncatedDescription} ${pricing}`.trim();
						return combinedDescription.length > originalDescription.length
							? combinedDescription.slice(0, originalDescription.length - 3) + '...'
							: combinedDescription;
					};

					const models = response.data
						.filter((model: IOpenRouterModel) => model.id && model.name)
						.map((model: IOpenRouterModel) => ({
							name: model.name,
							value: model.id,
							description: truncateAndAddPricing(model),
						}))
						.sort((a: INodePropertyOptions, b: INodePropertyOptions) =>
							a.name.localeCompare(b.name),
						);

					if (models.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No models found in OpenRouter API response',
						);
					}

					return models;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to load models: ${(error as Error).message}`,
					);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('openRouterCachedApi');
		if (!credentials?.apiKey) {
			throw new NodeOperationError(this.getNode(), 'No valid API key provided');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const systemPrompt = this.getNodeParameter('system_prompt', i, '') as string;
				const message = this.getNodeParameter('message', i) as string;
				const temperature = this.getNodeParameter('temperature', i) as number;
				const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

				// New parameters
				const conversationHistoryRaw = this.getNodeParameter('conversationHistory', i, '[]') as string;
				const promptCaching = this.getNodeParameter('promptCaching', i, {}) as IDataObject;
				const reasoning = this.getNodeParameter('reasoning', i, {}) as IDataObject;
				const stream = this.getNodeParameter('stream', i, false) as boolean;
				const providerRouting = this.getNodeParameter('providerRouting', i, {}) as IDataObject;
				const imagesRaw = this.getNodeParameter('images', i, '[]') as string;

				if (operation === 'chat') {
					let messages: IMessage[] = [];

					// Build messages from conversation history or simple inputs
					try {
						const conversationHistory = JSON.parse(conversationHistoryRaw);
						if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
							// Use conversation history
							messages = conversationHistory;
						} else {
							// Build from system prompt + message
							if (systemPrompt) {
								messages.push({
									role: 'system',
									content: systemPrompt,
								});
							}
							messages.push({
								role: 'user',
								content: message,
							});
						}
					} catch (error) {
						// If JSON parsing fails, use simple message format
						if (systemPrompt) {
							messages.push({
								role: 'system',
								content: systemPrompt,
							});
						}
						messages.push({
							role: 'user',
							content: message,
						});
					}

					// Handle vision/images
					try {
						const images = JSON.parse(imagesRaw);
						if (Array.isArray(images) && images.length > 0) {
							// Add images to the last user message
							const lastUserMessageIndex = messages.map((m, idx) => ({ idx, role: m.role }))
								.filter(m => m.role === 'user')
								.pop()?.idx;

							if (lastUserMessageIndex !== undefined) {
								const lastMessage = messages[lastUserMessageIndex];
								const content: IMessageContent[] = [];

								// Add existing text
								if (typeof lastMessage.content === 'string') {
									content.push({
										type: 'text',
										text: lastMessage.content,
									});
								}

								// Add images
								images.forEach((img: any) => {
									if (typeof img === 'string') {
										content.push({
											type: 'image_url',
											image_url: { url: img },
										});
									} else if (img.url) {
										content.push({
											type: 'image_url',
											image_url: {
												url: img.url,
												detail: img.detail || 'auto',
											},
										});
									}
								});

								messages[lastUserMessageIndex].content = content;
							}
						}
					} catch (error) {
						// Ignore image parsing errors
					}

					// Handle prompt caching
					const cachingConfig = (promptCaching as any)?.caching || {};
					if (cachingConfig.cacheSystemPrompt) {
						// Find system message and add cache_control
						const systemMessageIndex = messages.findIndex(m => m.role === 'system');
						if (systemMessageIndex !== -1) {
							const systemMessage = messages[systemMessageIndex];
							const content: IMessageContent[] = [];

							if (typeof systemMessage.content === 'string') {
								content.push({
									type: 'text',
									text: systemMessage.content,
								});
							}

							// Add cached content if provided
							if (cachingConfig.cacheContent) {
								content.push({
									type: 'text',
									text: cachingConfig.cacheContent as string,
									cache_control: {
										type: 'ephemeral',
									},
								});
							} else {
								// Mark the last text block for caching
								if (content.length > 0) {
									content[content.length - 1].cache_control = {
										type: 'ephemeral',
									};
								}
							}

							messages[systemMessageIndex].content = content;
						}
					}

					// Build request body
					const requestBody: any = {
						model,
						messages,
						temperature,
					};

					// Add additional fields
					for (const [key, value] of Object.entries(additionalFields)) {
						if (key === 'stop' && typeof value === 'string' && value) {
							// Convert comma-separated string to array
							requestBody.stop = value.split(',').map(s => s.trim());
						} else if (key === 'response_format' && value) {
							const format = (value as any)?.format;
							if (format?.type) {
								requestBody.response_format = { type: format.type };
							}
						} else if (key === 'logit_bias' && value) {
							try {
								requestBody.logit_bias = JSON.parse(value as string);
							} catch (error) {
								// Ignore invalid JSON
							}
						} else if (value !== undefined && value !== null && value !== '') {
							requestBody[key] = value;
						}
					}

					// Add reasoning configuration
					const reasoningConfig = (reasoning as any)?.config || {};
					if (reasoningConfig.enabled) {
						requestBody.reasoning = {};

						if (reasoningConfig.max_tokens && reasoningConfig.max_tokens > 0) {
							requestBody.reasoning.max_tokens = reasoningConfig.max_tokens;
						} else if (reasoningConfig.effort) {
							requestBody.reasoning.effort = reasoningConfig.effort;
						}

						if (reasoningConfig.exclude) {
							requestBody.reasoning.exclude = true;
						}
					}

					// Add streaming
					if (stream) {
						requestBody.stream = true;
					}

					// Add provider routing
					const routingConfig = (providerRouting as any)?.routing || {};
					if (routingConfig.route) {
						requestBody.route = routingConfig.route;
					}
					if (routingConfig.require_parameters) {
						requestBody.require_parameters = true;
					}
					if (routingConfig.zero_data_retention) {
						requestBody.zero_data_retention = true;
					}
					if (routingConfig.provider) {
						try {
							requestBody.provider = JSON.parse(routingConfig.provider);
						} catch (error) {
							// Ignore invalid JSON
						}
					}

					const options: IRequestOptions = {
						url: 'https://openrouter.ai/api/v1/chat/completions',
						headers: {
							Authorization: `Bearer ${credentials.apiKey}`,
							'HTTP-Referer': 'https://github.com/mattywhitenz/n8n-nodes-openroutercached',
							'X-Title': 'n8n OpenRouter Node',
							'Content-Type': 'application/json',
						},
						method: 'POST' as IHttpRequestMethods,
						body: requestBody,
						json: true,
					};

					// Handle streaming vs non-streaming
					if (stream) {
						// For streaming with SSE, we'll collect all chunks and return the complete response
						// Note: This provides basic streaming support by collecting chunks
						const streamOptions: IRequestOptions = {
							...options,
							json: false, // Don't parse as JSON initially
							encoding: 'utf8',
						};

						const streamResponse = await this.helpers.request(streamOptions);

						// Parse SSE response
						let fullContent = '';
						let fullReasoning = '';
						let finishReason = '';
						let usage: any = {};
						let responseModel = model;

						const lines = streamResponse.split('\n');
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const data = line.substring(6);
								if (data === '[DONE]') break;

								try {
									const chunk = JSON.parse(data);
									const delta = chunk.choices?.[0]?.delta;

									if (delta?.content) {
										fullContent += delta.content;
									}
									if (delta?.reasoning) {
										fullReasoning += delta.reasoning;
									}
									if (chunk.choices?.[0]?.finish_reason) {
										finishReason = chunk.choices[0].finish_reason;
									}
									if (chunk.usage) {
										usage = chunk.usage;
									}
									if (chunk.model) {
										responseModel = chunk.model;
									}
								} catch (error) {
									// Ignore parsing errors for individual chunks
								}
							}
						}

						const result: IDataObject = {
							response: fullContent.trim(),
							model: responseModel,
							usage,
							finish_reason: finishReason,
							streamed: true,
						};

						if (fullReasoning) {
							result.reasoning = fullReasoning;
						}

						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					} else {
						const response = await this.helpers.request(options);

						if (!response?.choices?.[0]?.message) {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid response format from OpenRouter API',
							);
						}

						const typedResponse = response as IOpenRouterResponse;
						const choice = typedResponse.choices[0];
						const messageContent = choice.message.content?.trim() || '';

						// Build comprehensive response
						const result: IDataObject = {
							response: messageContent,
							model: typedResponse.model,
							usage: typedResponse.usage,
						};

						// Add reasoning if present
						if (choice.message.reasoning) {
							result.reasoning = choice.message.reasoning;
						}
						if (choice.message.reasoning_details) {
							result.reasoning_details = choice.message.reasoning_details;
						}

						// Add cache discount if present
						if (typedResponse.cache_discount !== undefined) {
							result.cache_discount = typedResponse.cache_discount;
						}

						// Add finish reason
						result.finish_reason = choice.finish_reason;

						// Add full response for advanced users
						result.full_response = typedResponse;

						returnData.push({
							json: result,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
