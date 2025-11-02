# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-11-02

### Added
- **Prompt Caching**: Support for caching large prompts to reduce costs
  - Works with Anthropic, Gemini, and OpenAI models
  - System prompt caching option
  - Custom cache content parameter
  - Cache control breakpoints in message content
- **Reasoning Tokens**: Full support for reasoning/thinking models
  - Compatible with o1, o3, GPT-5, Claude 3.7+, DeepSeek R1, and other reasoning models
  - Effort-based control (high/medium/low) for OpenAI-style models
  - Token budget control (max_tokens) for Anthropic/Gemini-style models
  - Option to exclude reasoning from response while still using it internally
  - Response includes reasoning and reasoning_details fields
- **Tool/Function Calling**: Complete function calling support
  - Tools array parameter for defining available functions
  - Tool choice control (none/auto/required/specific function)
  - Parallel tool calls option
  - Tool calls returned in response
- **Vision/Multimodal**: Image support for vision-capable models
  - Accept image URLs in messages
  - Support for detail level control (auto/low/high)
  - Multipart message content structure
- **Streaming**: Server-Sent Events (SSE) streaming support
  - Collects and returns complete streamed responses
  - Preserves reasoning tokens in streaming mode
  - Usage and token information from streams
- **Conversation History**: Full multi-turn conversation support
  - JSON array format for complete conversation history
  - Overrides simple System Prompt + Message when provided
  - Preserves reasoning_details for tool calling workflows
- **Zero Data Retention**: GDPR/HIPAA compliance routing
  - Only routes to providers with Zero Data Retention policies
  - Essential for privacy-sensitive applications
- **Provider Routing**: Advanced routing strategies
  - Fallback routing for reliability
  - Require parameters option (only use providers supporting all parameters)
  - Provider preferences via JSON configuration
  - Route strategy selection
- **Response Formatting**: JSON mode support
  - Specify response_format for structured outputs
  - Text or JSON object output types
- **Additional Parameters**:
  - Stop sequences (comma-separated list)
  - Seed for deterministic sampling
  - Number of completions (n parameter)
  - Logit bias (JSON object for token likelihood modification)

### Changed
- Refactored message structure to support multipart content (text + images + cache_control)
- Enhanced response data structure:
  - Added reasoning field for thinking tokens
  - Added reasoning_details array for structured reasoning
  - Added tool_calls field for function calling results
  - Added cache_discount field for cost savings tracking
  - Added detailed usage information with cache and reasoning token breakdowns
  - Added full_response field for advanced users
- Updated repository URL to mattywhitenz/n8n-nodes-openroutercached
- Updated package description and keywords
- Enhanced TypeScript interfaces for better type safety

### Fixed
- Improved error handling for JSON parsing of advanced parameters
- Better handling of optional parameters
- Fixed displayOptions syntax issues

### Breaking Changes
- None - all new features are opt-in and backward compatible with existing workflows

## [0.3.37] - 2023-10-15

### Added
- Truncated model descriptions in the model selector
- Pricing information (cost per 1M tokens) for each model
- Better model organization and display

### Changed
- Updated default temperature to 0.9
- Improved model selection UX

## [0.2.5] - 2023-10-10

### Added
- Dropdown menu for model selection, displaying all available models from OpenRouter
- Settings to adjust model parameters:
  - Frequency penalty
  - Presence penalty
  - Top P

### Changed
- Moved adjustable model parameters (temperature, max_tokens) from options to main properties for easier access
- Updated TypeScript types to align with n8n-workflow version 1.48.0

### Fixed
- Resolved ESLint issues and improved code formatting

## [0.2.0] - 2023-05-14

### Added
- Support for streaming responses from the OpenRouter API
- Additional options for API requests:
  - Temperature
  - Max tokens
- Improved error handling and input validation
- Dropdown selector for OpenRouter models

### Changed
- Updated the node icon to use an SVG file
- Improved description and formatting of node properties

## [0.1.0] - 2023-05-01

### Added
- Initial release of the OpenRouter node for n8n
- Basic chat completion functionality using the OpenRouter API
