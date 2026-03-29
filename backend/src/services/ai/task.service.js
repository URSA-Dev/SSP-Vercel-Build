import logger from '../../utils/logger.js';
import { AiServiceError, NotFoundError } from '../../errors/domain-errors.js';
import { ok, err } from '../../utils/result.js';
import * as AiModel from '../../models/ai.model.js';
import * as generationService from './generation.service.js';
import * as retrievalService from './retrieval.service.js';
import * as guardrailService from './guardrail.service.js';
import * as metricsService from './metrics.service.js';
import config from '../../config/index.js';
import { addTaskToQueue } from '../../queues/ai-task.queue.js';

const log = logger.child({ service: 'ai:task' });

export async function enqueueTask({ caseId, agentType, triggerType, inputPayload, priority = 5, initiatedBy }) {
  try {
    const agent = await AiModel.findAgentByType(agentType);
    if (!agent) return err(new NotFoundError('AiAgent', agentType));

    const task = await AiModel.createTask({
      case_id: caseId, agent_id: agent.id, agent_type: agentType,
      trigger_type: triggerType, input_payload: JSON.stringify(inputPayload),
      status: 'QUEUED', priority, initiated_by: initiatedBy, attempt_number: 1,
    });

    await AiModel.createEvent({
      agent_id: agent.id, agent_type: agentType, task_id: task.id, case_id: caseId,
      event_type: 'TASK_CREATED', event_data: JSON.stringify({ triggerType, priority }),
      initiated_by: initiatedBy,
    });

    log.info({ taskId: task.id, agentType, caseId }, 'Task enqueued');
    await addTaskToQueue(task.id, { priority: priority || 0 });
    return ok(task);
  } catch (error) {
    log.error({ err: error, agentType, caseId }, 'Failed to enqueue task');
    return err(new AiServiceError('Failed to enqueue AI task', { message: error.message }));
  }
}

export async function executeTask(task) {
  const startMs = Date.now();
  try {
    const agent = await AiModel.findAgentById(task.agent_id);
    if (!agent) { await failTask(task.id, { error: 'Agent not found' }); return err(new NotFoundError('AiAgent', task.agent_id)); }

    const model = await AiModel.findActiveModel('anthropic', config.anthropic.model);
    if (!model) { await failTask(task.id, { error: 'No active model found' }); return err(new AiServiceError('No active AI model configured')); }

    const promptTemplate = await AiModel.findActivePrompt(agent.agent_type);
    if (!promptTemplate) { await failTask(task.id, { error: 'No active prompt template' }); return err(new AiServiceError('No active prompt template for agent', { agentType: agent.agent_type })); }

    const inputPayload = typeof task.input_payload === 'string' ? JSON.parse(task.input_payload) : task.input_payload || {};

    const preCheck = await guardrailService.runPreGenerationChecks({ agentType: agent.agent_type, input: inputPayload, taskId: task.id, caseId: task.case_id });
    if (!preCheck.passed) {
      await failTask(task.id, { error: 'Blocked by pre-generation guardrails', violations: preCheck.violations });
      return err(new AiServiceError('Task blocked by guardrails', { violations: preCheck.violations }));
    }

    let ragContext = '';
    if (agent.config?.use_rag) {
      const ragResult = await retrievalService.search({ query: inputPayload.query || JSON.stringify(inputPayload), agentType: agent.agent_type, taskId: task.id });
      ragContext = retrievalService.formatContextForPrompt(ragResult.chunks);
    }

    const genResult = await generationService.execute({ task, agent, model, promptTemplate, variables: inputPayload, ragContext: ragContext || undefined });

    const postCheck = await guardrailService.runPostGenerationChecks({ agentType: agent.agent_type, output: genResult.content, taskId: task.id, caseId: task.case_id });
    const finalContent = postCheck.redactedOutput ?? genResult.content;

    const latencyMs = Date.now() - startMs;
    try {
      await metricsService.recordMetrics({ taskId: task.id, modelId: model.id, agentType: agent.agent_type, tokensInput: genResult.usage.input_tokens, tokensOutput: genResult.usage.output_tokens, latencyMs, cacheHit: false, errorCount: 0 });
    } catch (metricsError) {
      log.warn({ err: metricsError, taskId: task.id }, 'Metrics recording failed (non-blocking)');
    }

    const reviewStatus = agent.requires_human_review ? 'PENDING' : 'APPROVED';
    const output = await AiModel.createOutput({ task_id: task.id, case_id: task.case_id, agent_id: agent.id, agent_type: agent.agent_type, output_type: promptTemplate.output_type || 'TEXT', content: finalContent, review_status: reviewStatus });

    const finalStatus = agent.requires_human_review ? 'AWAITING_HUMAN_REVIEW' : 'COMPLETED';
    await AiModel.updateTaskStatus(task.id, finalStatus, { output_payload: JSON.stringify({ outputId: output.id, stopReason: genResult.stopReason }), started_at: task.started_at });

    await AiModel.createEvent({ agent_id: agent.id, agent_type: agent.agent_type, task_id: task.id, case_id: task.case_id, event_type: 'TASK_COMPLETED', event_data: JSON.stringify({ status: finalStatus, tokensUsed: genResult.usage.input_tokens + genResult.usage.output_tokens, latencyMs }) });

    log.info({ taskId: task.id, status: finalStatus, latencyMs }, 'Task execution complete');
    return ok(output);
  } catch (error) {
    log.error({ err: error, taskId: task.id }, 'Task execution failed');
    await failTask(task.id, { error: error.message });
    return err(new AiServiceError('Task execution failed', { taskId: task.id, message: error.message }));
  }
}

export async function completeTask(taskId, outputPayload) {
  try {
    const task = await AiModel.updateTaskStatus(taskId, 'COMPLETED', { output_payload: JSON.stringify(outputPayload) });
    log.info({ taskId }, 'Task marked COMPLETED');
    return ok(task);
  } catch (error) {
    log.error({ err: error, taskId }, 'Failed to complete task');
    return err(new AiServiceError('Failed to complete task', { taskId }));
  }
}

export async function failTask(taskId, errorPayload) {
  try {
    const task = await AiModel.updateTaskStatus(taskId, 'FAILED', { error_payload: JSON.stringify(errorPayload) });
    log.warn({ taskId }, 'Task marked FAILED');
    return ok(task);
  } catch (error) {
    log.error({ err: error, taskId }, 'Failed to mark task as FAILED');
    return err(new AiServiceError('Failed to fail task', { taskId }));
  }
}

export async function retryTask(taskId) {
  try {
    const existing = await AiModel.findTaskById(taskId);
    if (!existing) return err(new NotFoundError('AiTask', taskId));
    const task = await AiModel.updateTaskStatus(taskId, 'QUEUED', { attempt_number: (existing.attempt_number || 1) + 1, error_payload: null, started_at: null, completed_at: null, duration_ms: null });
    log.info({ taskId, attempt: task.attempt_number }, 'Task reset for retry');
    return ok(task);
  } catch (error) {
    log.error({ err: error, taskId }, 'Failed to retry task');
    return err(new AiServiceError('Failed to retry task', { taskId }));
  }
}
