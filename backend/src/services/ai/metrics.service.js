import logger from '../../utils/logger.js';
import { AiServiceError } from '../../errors/domain-errors.js';
import * as AiModel from '../../models/ai.model.js';

const log = logger.child({ service: 'ai:metrics' });

export async function recordMetrics({ taskId, modelId, agentType, tokensInput, tokensOutput, latencyMs, cacheHit = false, errorCount = 0 }) {
  try {
    const model = await AiModel.findModelById(modelId);
    if (!model) log.warn({ modelId, taskId }, 'Model not found for cost calculation — using zero rates');

    const costPerInput = parseFloat(model?.cost_per_input_token || 0);
    const costPerOutput = parseFloat(model?.cost_per_output_token || 0);
    const costUsd = tokensInput * costPerInput + tokensOutput * costPerOutput;

    const row = await AiModel.createMetrics({
      task_id: taskId, model_id: modelId, agent_type: agentType,
      tokens_input: tokensInput, tokens_output: tokensOutput,
      cost_usd: costUsd, latency_ms: latencyMs, cache_hit: cacheHit, error_count: errorCount,
    });

    log.info({ taskId, tokensInput, tokensOutput, costUsd: costUsd.toFixed(6), latencyMs }, 'Metrics recorded');
    return row;
  } catch (error) {
    log.error({ err: error, taskId }, 'Failed to record metrics');
    throw new AiServiceError('Failed to record AI metrics', { taskId, message: error.message });
  }
}

export async function getDailySpend(date) {
  return AiModel.getDailySpend(date);
}

export async function getAgentMetrics({ agentType, startDate, endDate } = {}) {
  return AiModel.aggregateMetrics({ agentType, startDate, endDate });
}
