import logger from '../../utils/logger.js';
import { AiServiceError } from '../../errors/domain-errors.js';
import * as AiModel from '../../models/ai.model.js';
import { getAnthropicClient } from './anthropic-client.js';
import config from '../../config/index.js';

const log = logger.child({ service: 'ai:generation' });

export function interpolateTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

export async function execute({ task, agent, model, promptTemplate, variables = {}, ragContext }) {
  const systemPrompt = interpolateTemplate(promptTemplate.system_prompt || '', variables);
  let userPrompt = interpolateTemplate(promptTemplate.user_prompt || '', variables);

  if (ragContext) {
    userPrompt = `## Relevant Context\n${ragContext}\n\n${userPrompt}`;
  }

  const messages = [{ role: 'user', content: userPrompt }];

  log.info({ taskId: task.id, agentType: agent.agent_type, model: model.model_name }, 'Calling Anthropic API');

  let response;
  try {
    const client = getAnthropicClient();
    response = await client.messages.create({
      model: model.model_name,
      max_tokens: config.anthropic.maxTokens,
      temperature: config.anthropic.temperature,
      system: systemPrompt,
      messages,
    });
  } catch (error) {
    log.error({ err: error, taskId: task.id }, 'Anthropic API call failed');
    throw new AiServiceError('Anthropic API call failed', {
      taskId: task.id,
      statusCode: error.status,
      message: error.message,
    });
  }

  const content = response.content[0]?.text || '';
  const usage = {
    input_tokens: response.usage?.input_tokens || 0,
    output_tokens: response.usage?.output_tokens || 0,
  };
  const stopReason = response.stop_reason || 'unknown';

  let seq = 1;
  try {
    await AiModel.appendMessage({ task_id: task.id, role: 'system', content: systemPrompt, sequence_number: seq++ });
    await AiModel.appendMessage({ task_id: task.id, role: 'user', content: userPrompt, sequence_number: seq++ });
    await AiModel.appendMessage({ task_id: task.id, role: 'assistant', content, sequence_number: seq });
  } catch (error) {
    log.warn({ err: error, taskId: task.id }, 'Failed to persist task messages');
  }

  log.info({ taskId: task.id, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, stopReason }, 'Generation complete');

  return { content, usage, stopReason };
}
