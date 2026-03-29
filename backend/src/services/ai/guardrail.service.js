import logger from '../../utils/logger.js';
import { AiServiceError } from '../../errors/domain-errors.js';
import * as AiModel from '../../models/ai.model.js';
import config from '../../config/index.js';

const log = logger.child({ service: 'ai:guardrails' });

const DEFAULT_PII_PATTERNS = [
  { type: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: 'PHONE', regex: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { type: 'DOB', regex: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g },
];

export async function runPreGenerationChecks({ agentType, input, taskId, caseId }) {
  const guardrails = await AiModel.findActiveGuardrails(agentType);
  const preTypes = ['INPUT_VALIDATION', 'PII_DETECTION', 'TOKEN_LIMIT', 'COST_LIMIT'];
  const applicable = guardrails.filter(g => preTypes.includes(g.guardrail_type));

  const violations = [];
  let redactedInput = input;

  for (const guardrail of applicable) {
    try {
      if (guardrail.guardrail_type === 'PII_DETECTION') {
        const matches = checkPii(JSON.stringify(input), guardrail);
        if (matches.length > 0) {
          violations.push({ guardrailId: guardrail.id, type: 'PII_DETECTION', severity: guardrail.severity || 'HIGH', matches });
        }
      }
      if (guardrail.guardrail_type === 'TOKEN_LIMIT') {
        const estimatedTokens = Math.ceil(JSON.stringify(input).length / 4);
        const violation = checkTokenLimits(estimatedTokens, guardrail.config || {});
        if (violation) {
          violations.push({ guardrailId: guardrail.id, type: 'TOKEN_LIMIT', severity: guardrail.severity || 'MEDIUM', detail: violation });
        }
      }
      if (guardrail.guardrail_type === 'COST_LIMIT') {
        const spendResult = await AiModel.getDailySpend(new Date());
        const dailySpend = parseFloat(spendResult?.total || 0);
        const limit = guardrail.config?.daily_limit_usd ?? config.ai.dailyCostLimitUsd;
        if (dailySpend >= limit) {
          violations.push({ guardrailId: guardrail.id, type: 'COST_LIMIT', severity: 'CRITICAL', detail: `Daily spend $${dailySpend.toFixed(2)} exceeds limit $${limit.toFixed(2)}` });
        }
      }
    } catch (error) {
      log.error({ err: error, guardrailId: guardrail.id, taskId }, 'Guardrail check failed');
    }
  }

  for (const v of violations) {
    try {
      await AiModel.createViolation({ guardrail_id: v.guardrailId, task_id: taskId, case_id: caseId, violation_type: v.type, severity: v.severity, details: JSON.stringify(v), resolved: false });
    } catch (error) {
      log.warn({ err: error, taskId }, 'Failed to log guardrail violation');
    }
  }

  const blocked = violations.some(v => v.severity === 'CRITICAL');
  if (violations.length > 0) log.warn({ taskId, count: violations.length, blocked }, 'Pre-generation guardrail violations');
  return { passed: !blocked, violations, redactedInput };
}

export async function runPostGenerationChecks({ agentType, output, taskId, caseId }) {
  const guardrails = await AiModel.findActiveGuardrails(agentType);
  const postTypes = ['OUTPUT_VALIDATION', 'PII_DETECTION', 'CONTENT_FILTER'];
  const applicable = guardrails.filter(g => postTypes.includes(g.guardrail_type));

  const violations = [];
  let redactedOutput = output;

  for (const guardrail of applicable) {
    try {
      if (guardrail.guardrail_type === 'PII_DETECTION') {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        const matches = checkPii(text, guardrail);
        if (matches.length > 0) {
          violations.push({ guardrailId: guardrail.id, type: 'PII_DETECTION', severity: guardrail.severity || 'HIGH', matches });
          const action = guardrail.config?.action || 'BLOCK';
          if (action === 'REDACT' && typeof redactedOutput === 'string') {
            for (const m of matches) {
              redactedOutput = redactedOutput.replace(new RegExp(escapeRegex(m.value), 'g'), `[REDACTED-${m.type}]`);
            }
          }
        }
      }
      if (guardrail.guardrail_type === 'OUTPUT_VALIDATION') {
        const requiredFields = guardrail.config?.required_fields || [];
        if (requiredFields.length > 0 && typeof output === 'object' && output !== null) {
          const missing = requiredFields.filter(f => !(f in output));
          if (missing.length > 0) {
            violations.push({ guardrailId: guardrail.id, type: 'OUTPUT_VALIDATION', severity: guardrail.severity || 'MEDIUM', detail: `Missing required fields: ${missing.join(', ')}` });
          }
        }
      }
    } catch (error) {
      log.error({ err: error, guardrailId: guardrail.id, taskId }, 'Post-generation guardrail check failed');
    }
  }

  for (const v of violations) {
    try {
      await AiModel.createViolation({ guardrail_id: v.guardrailId, task_id: taskId, case_id: caseId, violation_type: v.type, severity: v.severity, details: JSON.stringify(v), resolved: false });
    } catch (error) {
      log.warn({ err: error, taskId }, 'Failed to log guardrail violation');
    }
  }

  const blocked = violations.some(v => v.severity === 'CRITICAL');
  if (violations.length > 0) log.warn({ taskId, count: violations.length, blocked }, 'Post-generation guardrail violations');
  return { passed: !blocked, violations, redactedOutput };
}

export function checkPii(text, guardrail) {
  const patterns = guardrail.config?.patterns
    ? guardrail.config.patterns.map(p => ({ type: p.type, regex: new RegExp(p.regex, p.flags || 'g') }))
    : DEFAULT_PII_PATTERNS;
  const matches = [];
  for (const { type, regex } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ type, value: match[0] });
    }
  }
  return matches;
}

export function checkTokenLimits(estimatedTokens, limitConfig) {
  const maxTokens = limitConfig.max_input_tokens || config.anthropic.maxTokens * 4;
  if (estimatedTokens > maxTokens) return `Estimated ${estimatedTokens} tokens exceeds limit of ${maxTokens}`;
  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
