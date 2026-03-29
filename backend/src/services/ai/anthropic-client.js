import Anthropic from '@anthropic-ai/sdk';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

let client = null;

export function getAnthropicClient() {
  if (!client) {
    if (!config.anthropic.apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set — AI calls will fail');
    }
    client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return client;
}
