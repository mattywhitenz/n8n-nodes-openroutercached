const { OpenRouterCached } = require('./dist/nodes/OpenRouter/OpenRouterCached.node');
const { OpenRouterCachedApi } = require('./dist/credentials/OpenRouterCachedApi.credentials');

module.exports = {
    nodes: [
        OpenRouterCached
    ],
    credentials: [
        OpenRouterCachedApi
    ],
    version: require('./package.json').version,
};
