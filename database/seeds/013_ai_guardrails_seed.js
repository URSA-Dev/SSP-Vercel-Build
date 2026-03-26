/**
 * Seed 013 — Default AI Guardrails
 * PII detection, content filtering, token/cost limits, and output
 * validation rules for DoW compliance.
 */
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex) {
  await knex('ai_guardrail_violations').del();
  await knex('ai_guardrails').del();

  const now = new Date().toISOString();

  await knex('ai_guardrails').insert([
    // ---- PII Detection ----
    {
      id: uuidv4(),
      name: 'SSN Detection & Redaction',
      description: 'Detects Social Security Numbers in AI inputs and outputs, redacts before processing',
      guardrail_type: 'PII_DETECTION',
      agent_type: null, // applies to all agents
      severity: 'CRITICAL',
      action: 'REDACT',
      config: JSON.stringify({
        patterns: ['SSN', 'SOCIAL_SECURITY'],
        regex: ['\\b\\d{3}-\\d{2}-\\d{4}\\b', '\\b\\d{9}\\b'],
        redaction_format: '[REDACTED-SSN]',
        scan_locations: ['input', 'output']
      }),
      is_active: true,
      priority: 100,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'Personal Contact Info Detection',
      description: 'Detects phone numbers, email addresses, and physical addresses in AI outputs',
      guardrail_type: 'PII_DETECTION',
      agent_type: null,
      severity: 'WARNING',
      action: 'WARN',
      config: JSON.stringify({
        patterns: ['PHONE', 'EMAIL', 'ADDRESS'],
        regex: [
          '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
          '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b'
        ],
        scan_locations: ['output']
      }),
      is_active: true,
      priority: 90,
      created_at: now,
      updated_at: now
    },

    // ---- Content Filtering ----
    {
      id: uuidv4(),
      name: 'Classification Boundary Guard',
      description: 'Blocks AI from generating content above UNCLASSIFIED/CUI level',
      guardrail_type: 'CONTENT_FILTER',
      agent_type: null,
      severity: 'BLOCK',
      action: 'BLOCK',
      config: JSON.stringify({
        blocked_classifications: ['SECRET', 'TOP_SECRET', 'SCI'],
        regex_patterns: [
          '(?i)\\b(SECRET|TOP SECRET|TS\\/SCI|NOFORN|ORCON)\\b'
        ],
        scan_locations: ['output']
      }),
      is_active: true,
      priority: 95,
      created_at: now,
      updated_at: now
    },

    // ---- Output Validation ----
    {
      id: uuidv4(),
      name: 'Memo Draft Structure Validation',
      description: 'Validates AI-generated memos contain all required sections per DoW format',
      guardrail_type: 'OUTPUT_VALIDATION',
      agent_type: 'MEMO_DRAFTING',
      severity: 'BLOCK',
      action: 'BLOCK',
      config: JSON.stringify({
        required_sections: [
          'Subject Information',
          'Applicable Guidelines',
          'Disqualifying Conditions',
          'Mitigating Factors',
          'Whole-Person Analysis',
          'Disposition Recommendation'
        ],
        min_length: 500,
        max_length: 50000
      }),
      is_active: true,
      priority: 80,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'Issue Identification Schema Validation',
      description: 'Validates AI-identified issues include severity, guideline reference, and description',
      guardrail_type: 'OUTPUT_VALIDATION',
      agent_type: 'ISSUE_IDENTIFICATION',
      severity: 'BLOCK',
      action: 'BLOCK',
      config: JSON.stringify({
        required_fields: ['category', 'severity', 'guideline', 'description'],
        valid_severities: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'ADMINISTRATIVE'],
        valid_guidelines: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
      }),
      is_active: true,
      priority: 80,
      created_at: now,
      updated_at: now
    },

    // ---- Token & Cost Limits ----
    {
      id: uuidv4(),
      name: 'Token Budget Per Task',
      description: 'Limits token usage per individual AI task to prevent runaway costs',
      guardrail_type: 'TOKEN_LIMIT',
      agent_type: null,
      severity: 'BLOCK',
      action: 'BLOCK',
      config: JSON.stringify({
        max_input_tokens: 100000,
        max_output_tokens: 8000,
        max_total_tokens: 108000
      }),
      is_active: true,
      priority: 70,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'Daily Cost Ceiling',
      description: 'Alerts when daily AI spend exceeds threshold',
      guardrail_type: 'COST_LIMIT',
      agent_type: null,
      severity: 'WARNING',
      action: 'ESCALATE',
      config: JSON.stringify({
        daily_limit_usd: 500.00,
        alert_threshold_pct: 80,
        escalate_to_role: 'ADMIN'
      }),
      is_active: true,
      priority: 60,
      created_at: now,
      updated_at: now
    },

    // ---- Bias Check ----
    {
      id: uuidv4(),
      name: 'Adjudication Bias Monitor',
      description: 'Monitors AI disposition recommendations for statistical bias patterns',
      guardrail_type: 'BIAS_CHECK',
      agent_type: 'RISK_SCORING',
      severity: 'WARNING',
      action: 'LOG',
      config: JSON.stringify({
        monitored_fields: ['disposition_recommendation', 'risk_score'],
        statistical_tests: ['chi_squared', 'disparity_ratio'],
        evaluation_window_days: 30,
        min_sample_size: 50,
        disparity_threshold: 0.8
      }),
      is_active: true,
      priority: 50,
      created_at: now,
      updated_at: now
    }
  ]);
}
