/**
 * Seed 014 — Default AI Workflows
 * Pre-configured document processing and case adjudication pipelines.
 */
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex) {
  await knex('ai_workflow_step_runs').del();
  await knex('ai_workflow_runs').del();
  await knex('ai_workflow_edges').del();
  await knex('ai_workflow_steps').del();
  await knex('ai_workflows').del();

  const now = new Date().toISOString();

  // =============================================================
  // Workflow 1: Document Processing Pipeline
  // DOCUMENT_UPLOADED → Intake → Extraction → Human Review
  // =============================================================
  const docWorkflowId = uuidv4();
  await knex('ai_workflows').insert({
    id: docWorkflowId,
    name: 'Document Processing Pipeline',
    description: 'Automated document intake, classification, OCR extraction, and human review gate',
    version: 1,
    trigger_event: 'DOCUMENT_UPLOADED',
    trigger_conditions: JSON.stringify({}),
    is_active: true,
    max_duration_seconds: 600,
    created_at: now,
    updated_at: now
  });

  const docStep1 = uuidv4(); // Intake
  const docStep2 = uuidv4(); // Extraction
  const docStep3 = uuidv4(); // Confidence check
  const docStep4 = uuidv4(); // Human review (low confidence)
  const docStep5 = uuidv4(); // Auto-confirm (high confidence)

  await knex('ai_workflow_steps').insert([
    {
      id: docStep1,
      workflow_id: docWorkflowId,
      step_name: 'Document Intake & Classification',
      step_order: 1,
      agent_type: 'DOCUMENT_INTAKE',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({ validate_file: true, classify_type: true }),
      timeout_seconds: 60,
      on_failure: 'ABORT',
      created_at: now,
      updated_at: now
    },
    {
      id: docStep2,
      workflow_id: docWorkflowId,
      step_name: 'OCR & Field Extraction',
      step_order: 2,
      agent_type: 'EXTRACTION',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({ use_document_ai: true, confidence_threshold: 0.70 }),
      timeout_seconds: 120,
      on_failure: 'RETRY',
      created_at: now,
      updated_at: now
    },
    {
      id: docStep3,
      workflow_id: docWorkflowId,
      step_name: 'Confidence Gate',
      step_order: 3,
      step_type: 'CONDITION',
      config: JSON.stringify({ evaluate: 'output.overall_confidence' }),
      timeout_seconds: 5,
      on_failure: 'ABORT',
      created_at: now,
      updated_at: now
    },
    {
      id: docStep4,
      workflow_id: docWorkflowId,
      step_name: 'Human Review (Low Confidence)',
      step_order: 4,
      step_type: 'WAIT_FOR_HUMAN',
      config: JSON.stringify({
        review_type: 'FIELD_BY_FIELD',
        notify_roles: ['ADJUDICATOR'],
        message: 'Extraction confidence below threshold — manual field review required'
      }),
      timeout_seconds: 86400, // 24 hours
      is_optional: false,
      on_failure: 'ABORT',
      created_at: now,
      updated_at: now
    },
    {
      id: docStep5,
      workflow_id: docWorkflowId,
      step_name: 'Auto-Confirm (High Confidence)',
      step_order: 4,
      step_type: 'NOTIFICATION',
      config: JSON.stringify({
        action: 'AUTO_CONFIRM',
        notify_roles: ['ADJUDICATOR'],
        message: 'Extraction completed with high confidence — spot-check recommended'
      }),
      timeout_seconds: 10,
      is_optional: false,
      on_failure: 'SKIP',
      created_at: now,
      updated_at: now
    }
  ]);

  // Edges: linear flow + conditional branch at step 3
  await knex('ai_workflow_edges').insert([
    {
      id: uuidv4(),
      workflow_id: docWorkflowId,
      from_step_id: docStep1,
      to_step_id: docStep2,
      condition_operator: 'ALWAYS',
      priority: 0,
      created_at: now
    },
    {
      id: uuidv4(),
      workflow_id: docWorkflowId,
      from_step_id: docStep2,
      to_step_id: docStep3,
      condition_operator: 'ALWAYS',
      priority: 0,
      created_at: now
    },
    // If confidence < 0.85 → human review
    {
      id: uuidv4(),
      workflow_id: docWorkflowId,
      from_step_id: docStep3,
      to_step_id: docStep4,
      condition_field: 'output.overall_confidence',
      condition_operator: 'LT',
      condition_value: '0.85',
      priority: 10,
      created_at: now
    },
    // If confidence >= 0.85 → auto-confirm
    {
      id: uuidv4(),
      workflow_id: docWorkflowId,
      from_step_id: docStep3,
      to_step_id: docStep5,
      condition_field: 'output.overall_confidence',
      condition_operator: 'GTE',
      condition_value: '0.85',
      priority: 5,
      created_at: now
    }
  ]);

  // =============================================================
  // Workflow 2: Case Adjudication Pipeline
  // CASE_ASSIGNED → Issue ID → Risk Scoring → Memo Draft → QA
  // =============================================================
  const adjWorkflowId = uuidv4();
  await knex('ai_workflows').insert({
    id: adjWorkflowId,
    name: 'Case Adjudication Pipeline',
    description: 'Full adjudication workflow: issue identification, risk scoring, memo drafting, and QA validation',
    version: 1,
    trigger_event: 'STATUS_CHANGED',
    trigger_conditions: JSON.stringify({ status: 'ASSIGNED', has_confirmed_documents: true }),
    is_active: true,
    max_duration_seconds: 1800,
    created_at: now,
    updated_at: now
  });

  const adjStep1 = uuidv4(); // Issue ID
  const adjStep2 = uuidv4(); // Risk Scoring
  const adjStep3 = uuidv4(); // Memo Drafting
  const adjStep4 = uuidv4(); // Human Review of Memo
  const adjStep5 = uuidv4(); // QA Validation

  await knex('ai_workflow_steps').insert([
    {
      id: adjStep1,
      workflow_id: adjWorkflowId,
      step_name: 'Issue Identification',
      step_order: 1,
      agent_type: 'ISSUE_IDENTIFICATION',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({ analyze_guidelines: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'] }),
      timeout_seconds: 300,
      on_failure: 'RETRY',
      created_at: now,
      updated_at: now
    },
    {
      id: adjStep2,
      workflow_id: adjWorkflowId,
      step_name: 'Risk Scoring',
      step_order: 2,
      agent_type: 'RISK_SCORING',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({ dimensions: ['financial', 'behavioral', 'foreign_influence', 'criminal', 'substance', 'personal_conduct'] }),
      timeout_seconds: 120,
      on_failure: 'SKIP',
      is_optional: true,
      created_at: now,
      updated_at: now
    },
    {
      id: adjStep3,
      workflow_id: adjWorkflowId,
      step_name: 'Memo Drafting',
      step_order: 3,
      agent_type: 'MEMO_DRAFTING',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({
        required_sections: ['Subject Information', 'Applicable Guidelines', 'Disqualifying Conditions', 'Mitigating Factors', 'Whole-Person Analysis', 'Disposition Recommendation'],
        include_risk_scores: true
      }),
      timeout_seconds: 300,
      on_failure: 'RETRY',
      created_at: now,
      updated_at: now
    },
    {
      id: adjStep4,
      workflow_id: adjWorkflowId,
      step_name: 'Human Review of Memo',
      step_order: 4,
      step_type: 'WAIT_FOR_HUMAN',
      config: JSON.stringify({
        review_type: 'MEMO_REVIEW',
        notify_roles: ['ADJUDICATOR', 'SUPERVISOR'],
        message: 'AI-drafted memo ready for adjudicator review and editing'
      }),
      timeout_seconds: 172800, // 48 hours
      on_failure: 'ABORT',
      created_at: now,
      updated_at: now
    },
    {
      id: adjStep5,
      workflow_id: adjWorkflowId,
      step_name: 'QA Validation',
      step_order: 5,
      agent_type: 'QA_VALIDATION',
      step_type: 'AGENT_TASK',
      config: JSON.stringify({
        checklist: ['completeness', 'guideline_compliance', 'consistency', 'professional_tone', 'factual_accuracy', 'legal_sufficiency', 'format_compliance', 'disposition_support']
      }),
      timeout_seconds: 120,
      on_failure: 'RETRY',
      created_at: now,
      updated_at: now
    }
  ]);

  // Edges: linear pipeline
  await knex('ai_workflow_edges').insert([
    { id: uuidv4(), workflow_id: adjWorkflowId, from_step_id: adjStep1, to_step_id: adjStep2, condition_operator: 'ALWAYS', priority: 0, created_at: now },
    { id: uuidv4(), workflow_id: adjWorkflowId, from_step_id: adjStep2, to_step_id: adjStep3, condition_operator: 'ALWAYS', priority: 0, created_at: now },
    { id: uuidv4(), workflow_id: adjWorkflowId, from_step_id: adjStep3, to_step_id: adjStep4, condition_operator: 'ALWAYS', priority: 0, created_at: now },
    { id: uuidv4(), workflow_id: adjWorkflowId, from_step_id: adjStep4, to_step_id: adjStep5, condition_operator: 'ALWAYS', priority: 0, created_at: now }
  ]);
}
