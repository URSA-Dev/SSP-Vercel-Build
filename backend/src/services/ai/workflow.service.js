import * as AiModel from '../../models/ai.model.js';
import * as taskService from './task.service.js';
import logger from '../../utils/logger.js';
import { AiServiceError } from '../../errors/domain-errors.js';

const log = logger.child({ service: 'ai:workflow' });

const COMPLETION_HANDLERS = {
  'Document Processing Pipeline': async (run) => {
    if (run.document_id && run.context?.extractedFields) {
      const DocumentModel = (await import('../../models/document.model.js')).default;
      await DocumentModel.update(run.document_id, { status: 'awaiting', extracted_fields: JSON.stringify(run.context.extractedFields) });
      log.info({ documentId: run.document_id }, 'Document status updated to awaiting');
    }
  },
};

export async function triggerWorkflow({ triggerEvent, caseId, documentId, initiatedBy, context = {} }) {
  const workflow = await AiModel.findWorkflowByTrigger(triggerEvent);
  if (!workflow) { log.warn({ triggerEvent }, 'No active workflow found for trigger event'); return null; }

  const run = await AiModel.createWorkflowRun({ workflow_id: workflow.id, case_id: caseId, document_id: documentId, status: 'RUNNING', context, initiated_by: initiatedBy, started_at: new Date() });
  log.info({ runId: run.id, workflowName: workflow.name, triggerEvent }, 'Workflow triggered');

  const entrySteps = await AiModel.findEntryEdges(workflow.id);
  for (const step of entrySteps) await executeStep(run.id, step.id);
  return run;
}

export async function executeStep(runId, stepId) {
  const step = await AiModel.findStepById(stepId);
  const run = await AiModel.findWorkflowRunById(runId);
  if (!step || !run) return;

  const stepRun = await AiModel.createStepRun({ run_id: runId, step_id: stepId, status: 'RUNNING', input_data: run.context, started_at: new Date() });
  await AiModel.updateWorkflowRun(runId, { current_step_id: stepId });
  log.info({ runId, stepId, stepType: step.step_type, stepName: step.step_name }, 'Executing step');

  try {
    switch (step.step_type) {
      case 'AGENT_TASK': {
        const enqueueResult = await taskService.enqueueTask({ caseId: run.case_id, agentType: step.agent_type, triggerType: 'CHAINED', inputPayload: run.context, initiatedBy: run.initiated_by });
        if (!enqueueResult.ok) throw new AiServiceError('Failed to enqueue task', enqueueResult.error);
        const task = enqueueResult.value;
        const timeoutMs = (step.timeout_seconds || 300) * 1000;
        const completedTask = await waitForTaskCompletion(task.id, timeoutMs);
        const outputData = completedTask.output_payload || {};
        await AiModel.updateStepRun(stepRun.id, { status: 'COMPLETED', output_data: outputData, completed_at: new Date(), duration_ms: Date.now() - new Date(stepRun.started_at).getTime() });
        const updatedContext = { ...run.context, ...outputData };
        await AiModel.updateWorkflowRun(runId, { context: updatedContext });
        await advanceToNextSteps(runId, stepId);
        break;
      }
      case 'CONDITION': {
        await AiModel.updateStepRun(stepRun.id, { status: 'COMPLETED', completed_at: new Date() });
        const edges = await AiModel.findEdgesFromStep(stepId);
        const currentRun = await AiModel.findWorkflowRunById(runId);
        for (const edge of edges) {
          if (evaluateCondition(edge.condition_field, edge.condition_operator, edge.condition_value, currentRun.context)) { await executeStep(runId, edge.to_step_id); break; }
        }
        break;
      }
      case 'WAIT_FOR_HUMAN': {
        await AiModel.updateStepRun(stepRun.id, { status: 'WAITING' });
        await AiModel.updateWorkflowRun(runId, { status: 'PAUSED' });
        log.info({ runId, stepName: step.step_name }, 'Workflow paused — awaiting human review');
        return;
      }
      case 'NOTIFICATION': {
        await AiModel.createEvent({ agent_type: step.agent_type || 'SUSPENSE_MONITOR', case_id: run.case_id, event_type: 'NOTIFICATION_SENT', event_data: { stepName: step.step_name, config: step.config } });
        await AiModel.updateStepRun(stepRun.id, { status: 'COMPLETED', completed_at: new Date() });
        await advanceToNextSteps(runId, stepId);
        break;
      }
      default:
        log.warn({ stepType: step.step_type }, 'Unknown step type');
        await AiModel.updateStepRun(stepRun.id, { status: 'SKIPPED' });
        await advanceToNextSteps(runId, stepId);
    }
  } catch (err) {
    log.error({ err, runId, stepId, stepName: step.step_name }, 'Step execution failed');
    await AiModel.updateStepRun(stepRun.id, { status: 'FAILED', error_payload: { message: err.message, code: err.code }, completed_at: new Date() });
    const onFailure = step.on_failure || 'ABORT';
    if (onFailure === 'SKIP') await advanceToNextSteps(runId, stepId);
    else if (onFailure === 'RETRY' && (stepRun.attempt_number || 1) < 3) { await AiModel.updateStepRun(stepRun.id, { status: 'PENDING', attempt_number: (stepRun.attempt_number || 1) + 1 }); await executeStep(runId, stepId); }
    else if (onFailure === 'FALLBACK' && step.fallback_step_id) await executeStep(runId, step.fallback_step_id);
    else await AiModel.updateWorkflowRun(runId, { status: 'FAILED', error_payload: { stepId, message: err.message }, completed_at: new Date() });
  }
}

export function evaluateCondition(field, operator, value, context) {
  if (!operator || operator === 'ALWAYS') return true;
  const contextValue = field ? field.split('.').reduce((obj, key) => obj?.[key], context) : undefined;
  switch (operator) {
    case 'EQUALS': return String(contextValue) === String(value);
    case 'GT': return parseFloat(contextValue) > parseFloat(value);
    case 'LT': return parseFloat(contextValue) < parseFloat(value);
    case 'GTE': return parseFloat(contextValue) >= parseFloat(value);
    case 'LTE': return parseFloat(contextValue) <= parseFloat(value);
    case 'IN': try { return JSON.parse(value).includes(contextValue); } catch { return false; }
    case 'NOT_NULL': return contextValue != null;
    default: return false;
  }
}

export async function resumeWorkflow(runId) {
  const stepRuns = await AiModel.findStepRunsByRun(runId);
  const waitingStep = stepRuns.find(sr => sr.status === 'WAITING');
  if (!waitingStep) { log.warn({ runId }, 'No waiting step found to resume'); return; }
  await AiModel.updateStepRun(waitingStep.id, { status: 'COMPLETED', completed_at: new Date() });
  await AiModel.updateWorkflowRun(runId, { status: 'RUNNING' });
  log.info({ runId, stepId: waitingStep.step_id }, 'Workflow resumed');
  await advanceToNextSteps(runId, waitingStep.step_id);
}

export async function advanceToNextSteps(runId, completedStepId) {
  const edges = await AiModel.findEdgesFromStep(completedStepId);
  if (edges.length === 0) {
    const stepRuns = await AiModel.findStepRunsByRun(runId);
    if (stepRuns.every(sr => ['COMPLETED', 'SKIPPED', 'FAILED'].includes(sr.status))) await completeWorkflowRun(runId);
    return;
  }
  const run = await AiModel.findWorkflowRunById(runId);
  for (const edge of edges) {
    if (evaluateCondition(edge.condition_field, edge.condition_operator, edge.condition_value, run.context)) await executeStep(runId, edge.to_step_id);
  }
}

async function waitForTaskCompletion(taskId, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const task = await AiModel.findTaskById(taskId);
    if (task.status === 'COMPLETED' || task.status === 'AWAITING_HUMAN_REVIEW') return task;
    if (task.status === 'FAILED') throw new AiServiceError('Task failed', task.error_payload);
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new AiServiceError('Task timed out waiting for completion');
}

async function completeWorkflowRun(runId) {
  const run = await AiModel.findWorkflowRunById(runId);
  if (!run) return;
  await AiModel.updateWorkflowRun(runId, { status: 'COMPLETED', completed_at: new Date(), duration_ms: run.started_at ? Date.now() - new Date(run.started_at).getTime() : null });
  const workflow = await AiModel.findWorkflowById(run.workflow_id);
  if (workflow && COMPLETION_HANDLERS[workflow.name]) {
    try { await COMPLETION_HANDLERS[workflow.name](run); } catch (err) { log.error({ err, runId, workflowName: workflow.name }, 'Completion handler failed'); }
  }
  log.info({ runId, workflowName: workflow?.name }, 'Workflow completed');
}
