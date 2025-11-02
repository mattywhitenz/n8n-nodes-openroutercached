# n8n-nodes-openrouter

This is an n8n community node for OpenRouter API integration. It allows you to interact with various AI models through the OpenRouter platform directly from your n8n workflows.

[![Follow on X](https://img.shields.io/twitter/follow/matthewsabia?style=social&logo=twitter)](https://x.com/matthewsabia)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[OpenRouter](https://openrouter.ai/) is a platform that provides access to various AI models through a unified API.

## Features

### Core Features
- Interact with multiple AI models through a single node
- Send chat messages to AI models
- Customize model parameters such as temperature, max tokens, frequency penalty, and presence penalty
- View truncated model descriptions and pricing information in the model selector
- Easy integration with n8n workflows

### Advanced Features (v0.4.0+)
- **Prompt Caching** - Reduce costs by caching large prompts (Anthropic, Gemini, OpenAI)
- **Reasoning Tokens** - Support for reasoning models (o1, o3, GPT-5, Claude 3.7+, DeepSeek R1)
- **Tool/Function Calling** - Enable AI to call functions and tools
- **Vision/Multimodal** - Send images to vision-capable models
- **Streaming Responses** - Get real-time streamed responses
- **Conversation History** - Full multi-turn conversation support
- **Zero Data Retention** - GDPR/HIPAA compliance with ZDR routing
- **Provider Routing** - Advanced routing strategies and fallbacks
- **Response Formatting** - JSON mode and structured outputs
- **Comprehensive Response Data** - Access reasoning, tool calls, token usage, and cache savings

## Installation

### Community Node (Recommended)

To install this node as a community node in n8n, follow these steps:

1. Open your n8n instance
2. Go to "Settings" > "Community Nodes"
3. Select "Install"
4. Enter `n8n-nodes-openrouter` in the "Enter npm package name" field
5. Agree to the risks of using community nodes (if prompted)
6. Click "Install"

After installation, the node will be available in the "OpenRouter" category in the node palette.

### Manual Installation (Advanced)

If you prefer manual installation or are using a custom n8n setup:

1. Open your n8n installation directory
2. Navigate to the `nodes` subdirectory
3. Run the following command:
   ```
   npm install n8n-nodes-openrouter
   ```
4. Restart your n8n instance

**Note:** If you're using Docker or a server deployment, you may need to rebuild your container or restart your server for the changes to take effect.

### Troubleshooting

If you encounter issues with the node not updating to new versions correctly or not displaying changes inside n8n, try the following:

1. Clear your browser cache
2. Restart your n8n instance
3. If using Docker, rebuild and restart your container:
   ```
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```
4. For server deployments, restart the n8n service:
   ```
   sudo systemctl restart n8n
   ```

## Usage

1. Add the OpenRouter node to your workflow
2. Configure the OpenRouter API credentials (see Configuration section)
3. Select the desired operation (currently only 'Chat' is available)
4. Choose an AI model from the dropdown list
5. (Optional) Provide a system prompt to set the behavior of the AI
6. Enter your message
7. Adjust additional parameters as needed (temperature, max tokens, etc.)
8. Execute the node to receive the AI's response

## Model Selection

The model selector provides truncated descriptions of each available model along with pricing information. The pricing is displayed as cost per 1 million tokens for both prompt and completion. This allows you to make informed decisions about which model to use based on capabilities and cost.

## Configuration

### OpenRouter API Credentials

To use this node, you need to set up OpenRouter API credentials:

1. Sign up for an account at [OpenRouter](https://openrouter.ai/)
2. Generate an API key in your OpenRouter dashboard
3. In n8n, create a new credential of type 'OpenRouter API'
4. Enter your API key

### Node Parameters

#### Basic Parameters
- **Operation**: Currently, only 'Chat' is available
- **Model**: Select the AI model you want to use
- **System Prompt**: (Optional) Set the behavior or role of the AI assistant
- **Message**: The user's input message to the AI
- **Temperature**: Controls the randomness of the AI's output (0.0 to 1.0)

#### Additional Fields
- **Frequency Penalty**: Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency
- **Max Tokens**: The maximum number of tokens to generate
- **Presence Penalty**: Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear
- **Top P**: Nucleus sampling parameter (0.0 to 1.0)
- **Response Format**: Specify output format (JSON mode or text)
- **Stop Sequences**: Comma-separated list of sequences where the API will stop generating
- **Seed**: Random seed for deterministic sampling
- **Number of Completions**: Generate multiple responses (n parameter)
- **Logit Bias**: JSON object to modify token likelihoods

#### Advanced Features

##### Conversation History
- **Conversation History**: Full conversation as JSON array
  ```json
  [
    {"role": "system", "content": "You are helpful"},
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"},
    {"role": "user", "content": "Tell me about AI"}
  ]
  ```

##### Prompt Caching
- **Enable System Prompt Caching**: Cache system prompt to reduce costs
- **Cache Message Content**: Large content to cache (books, CSV data, etc.)

##### Reasoning Tokens
- **Enable Reasoning**: Enable reasoning/thinking tokens
- **Effort Level**: High/Medium/Low (for OpenAI-style models)
- **Max Reasoning Tokens**: Specific token budget (for Anthropic/Gemini models)
- **Exclude Reasoning from Response**: Use reasoning internally but don't return it

##### Streaming
- **Streaming**: Enable real-time response streaming (SSE)

##### Tools / Function Calling
- **Tools**: JSON array of tools the model can call
  ```json
  [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string"}
        }
      }
    }
  }]
  ```
- **Tool Choice**: Control which tool is called ('none', 'auto', 'required')
- **Parallel Tool Calls**: Enable parallel function execution

##### Provider Routing
- **Route Strategy**: Default or Fallback
- **Require Parameters**: Only use providers supporting all parameters
- **Zero Data Retention**: Only route to ZDR providers (GDPR/HIPAA)
- **Provider Preferences**: JSON object for provider ordering

##### Vision / Images
- **Images**: Array of image URLs
  ```json
  ["https://example.com/image.jpg"]
  ```
  Or with detail level:
  ```json
  [{"url": "https://...", "detail": "high"}]
  ```

## Examples

### Basic Chat Workflow

1. Add a "Manual" trigger node
2. Connect an OpenRouter node
3. Configure the OpenRouter node:
   - Operation: Chat
   - Model: Choose a model (e.g., "gpt-3.5-turbo")
   - Message: "Hello, can you explain what n8n is?"
4. Execute the workflow
5. The OpenRouter node will return the AI's response explaining n8n

### Using Reasoning Tokens

1. Add OpenRouter node
2. Configure:
   - Model: "openai/o1" or "anthropic/claude-3.7-sonnet"
   - Message: "Solve this problem step by step: What's 157 * 23?"
   - Reasoning > Enable Reasoning: true
   - Reasoning > Effort Level: "high"
3. Execute
4. Response includes both reasoning and final answer

### Prompt Caching for Cost Savings

1. Add OpenRouter node
2. Configure:
   - Model: "anthropic/claude-3.5-sonnet"
   - System Prompt: "You are a helpful assistant"
   - Prompt Caching > Enable System Prompt Caching: true
   - Prompt Caching > Cache Message Content: "LARGE TEXT CONTENT HERE (e.g., entire book chapter)"
   - Message: "Summarize chapter 1"
3. First request pays full cost
4. Subsequent requests with same cached content cost ~90% less

### Function Calling

1. Add OpenRouter node
2. Configure:
   - Model: "openai/gpt-4o"
   - Message: "What's the weather in Boston?"
   - Tools:
     ```json
     [{
       "type": "function",
       "function": {
         "name": "get_weather",
         "description": "Get weather for a location",
         "parameters": {
           "type": "object",
           "properties": {
             "location": {"type": "string"}
           }
         }
       }
     }]
     ```
3. Response includes tool_calls with function to execute

### Vision/Image Analysis

1. Add OpenRouter node
2. Configure:
   - Model: "openai/gpt-4o" or "anthropic/claude-3.5-sonnet"
   - Message: "What's in this image?"
   - Images:
     ```json
     ["https://example.com/image.jpg"]
     ```
3. AI analyzes the image and responds

### Multi-turn Conversation

1. Add OpenRouter node
2. Instead of using System Prompt + Message, use Conversation History:
   ```json
   [
     {"role": "system", "content": "You are a helpful coding assistant"},
     {"role": "user", "content": "How do I reverse a string in Python?"},
     {"role": "assistant", "content": "You can use slicing: text[::-1]"},
     {"role": "user", "content": "Can you show a full example?"}
   ]
   ```
3. AI continues the conversation with context

### Zero Data Retention (Privacy/Compliance)

1. Add OpenRouter node
2. Configure:
   - Model: Any compatible model
   - Message: "Process this sensitive data: [patient info]"
   - Provider Routing > Zero Data Retention: true
3. Request only routes to ZDR-compliant providers (GDPR/HIPAA safe)

## Support

If you encounter any issues or have questions about this node, please [open an issue](https://github.com/mattywhitenz/n8n-nodes-openroutercached/issues) on the GitHub repository.

## Contributing

Contributions to improve this node are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the [MIT License](LICENSE.md).

## About n8n
n8n is a free and open [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation tool. It can be self-hosted, easily extended, and used to automate workflows across various services and applications. n8n enables you to connect anything to everything.

## About OpenRouter
OpenRouter is a platform that provides a unified API to access various AI models. It allows developers to integrate multiple AI services into their applications without managing separate API integrations for each model provider. OpenRouter supports a wide range of models from different providers, making it easier to experiment with and deploy various AI capabilities in your workflows.

## Changelog

### 0.4.0 - Major Feature Update
**Added:**
- ✨ **Prompt Caching** - Support for caching large prompts to reduce costs (Anthropic, Gemini, OpenAI)
- ✨ **Reasoning Tokens** - Full support for reasoning/thinking models (o1, o3, GPT-5, Claude 3.7+, DeepSeek R1)
  - Effort-based control (high/medium/low)
  - Token budget control (max_tokens)
  - Option to exclude reasoning from response
- ✨ **Tool/Function Calling** - Complete function calling support
  - Tools array parameter
  - Tool choice control
  - Parallel tool calls
- ✨ **Vision/Multimodal** - Image support for vision-capable models
  - URL-based images
  - Detail level control (auto/low/high)
- ✨ **Streaming** - Server-Sent Events (SSE) streaming support
- ✨ **Conversation History** - Full multi-turn conversation support via JSON
- ✨ **Zero Data Retention** - GDPR/HIPAA compliance routing
- ✨ **Provider Routing** - Advanced routing strategies
  - Fallback routing
  - Require parameters
  - Provider preferences
- ✨ **Response Formatting** - JSON mode support
- ✨ **Additional Parameters**
  - Stop sequences
  - Seed (deterministic sampling)
  - Number of completions (n)
  - Logit bias

**Changed:**
- Refactored message structure to support multipart content (text + images + cache_control)
- Enhanced response data with reasoning, tool_calls, cache_discount, and usage details
- Updated repository URL to mattywhitenz/n8n-nodes-openroutercached

**Breaking Changes:**
- None - all new features are opt-in and backward compatible

### 0.3.36
- Added truncated model descriptions in the model selector
- Included pricing information (cost per 1M tokens) for each model
- Updated default temperature to 0.9
- Various bug fixes and performance improvements

For a full list of changes, please refer to the [CHANGELOG.md](CHANGELOG.md) file.
