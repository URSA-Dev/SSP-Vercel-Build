/**
 * Seed: AI Agentic Layer — Models, Agents, Prompt Templates
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clean AI tables (reverse dependency order)
  await knex('ai_agent_events').del();
  await knex('ai_feature_store').del();
  await knex('ai_metrics').del();
  await knex('ai_human_reviews').del();
  await knex('ai_outputs').del();
  await knex('ai_task_messages').del();
  await knex('ai_tasks').del();
  await knex('ai_prompt_templates').del();
  await knex('ai_agents').del();
  await knex('ai_models').del();

  // ─── AI Models ────────────────────────────────────────────────────

  const [claudeSonnet] = await knex('ai_models').insert({
    provider: 'ANTHROPIC',
    model_name: 'claude-sonnet-4-20250514',
    model_version: '4.0',
    display_name: 'Claude Sonnet 4',
    capabilities: JSON.stringify(['text_generation', 'analysis', 'memo_drafting', 'qa_validation']),
    config: JSON.stringify({ max_tokens: 4096, temperature: 0.3 }),
    cost_per_input_token: 0.000003,
    cost_per_output_token: 0.000015,
    is_active: true,
  }).returning('id');

  const [documentAi] = await knex('ai_models').insert({
    provider: 'GCP_DOCUMENT_AI',
    model_name: 'form-parser-v2',
    model_version: '2.0',
    display_name: 'GCP Document AI Form Parser',
    capabilities: JSON.stringify(['document_extraction', 'ocr', 'form_parsing']),
    config: JSON.stringify({ processor_id: 'form-parser', region: 'us-central1' }),
    cost_per_input_token: null,
    cost_per_output_token: null,
    is_active: true,
  }).returning('id');

  const [vertexCustom] = await knex('ai_models').insert({
    provider: 'GCP_VERTEX',
    model_name: 'ssp-risk-scorer',
    model_version: '1.0',
    display_name: 'SSP Risk Scoring Model',
    capabilities: JSON.stringify(['risk_scoring', 'pattern_detection', 'analytics']),
    config: JSON.stringify({ endpoint: 'case-analysis', region: 'us-central1' }),
    cost_per_input_token: null,
    cost_per_output_token: null,
    is_active: true,
  }).returning('id');

  // ─── AI Agents ────────────────────────────────────────────────────

  const agents = [
    {
      agent_type: 'DOCUMENT_INTAKE',
      name: 'Document Intake Agent',
      description: 'Receives uploaded documents, validates file integrity, classifies document type, and triggers the extraction pipeline.',
      model_id: claudeSonnet.id,
      status: 'TESTING',
      config: JSON.stringify({ auto_classify: true, max_file_size_mb: 50 }),
      capabilities: JSON.stringify({ input: ['file_upload'], output: ['classification', 'validation_result'] }),
      requires_human_review: false,
    },
    {
      agent_type: 'EXTRACTION',
      name: 'Document Extraction Agent',
      description: 'Runs OCR and form parsing via Document AI to extract structured fields from case documents. Produces confidence-scored field extractions.',
      model_id: documentAi.id,
      status: 'TESTING',
      config: JSON.stringify({ confidence_threshold: 0.70, retry_on_low_confidence: true }),
      capabilities: JSON.stringify({ input: ['document_binary'], output: ['extracted_fields', 'confidence_scores'] }),
      requires_human_review: true,
    },
    {
      agent_type: 'ISSUE_IDENTIFICATION',
      name: 'Issue Identification Agent',
      description: 'Analyzes extracted case data against SEAD 4 adjudicative guidelines (A-M). Suggests issues with severity, guideline references, and mitigation recommendations.',
      model_id: claudeSonnet.id,
      status: 'TESTING',
      config: JSON.stringify({ temperature: 0.2, guidelines: 'SEAD_4_A_THROUGH_M' }),
      capabilities: JSON.stringify({ input: ['extracted_fields', 'case_context'], output: ['suggested_issues'] }),
      requires_human_review: true,
    },
    {
      agent_type: 'MEMO_DRAFTING',
      name: 'Memo Drafting Agent',
      description: 'Generates adjudicative recommendation memoranda using case evidence, identified issues, and mitigating factors. Applies whole-person analysis framework.',
      model_id: claudeSonnet.id,
      status: 'TESTING',
      config: JSON.stringify({ temperature: 0.3, max_tokens: 4096, required_sections: ['Subject', 'Guidelines', 'Disqualifying Conditions', 'Mitigating Conditions', 'Whole-Person Analysis', 'Disposition'] }),
      capabilities: JSON.stringify({ input: ['case_data', 'issues', 'documents'], output: ['memo_draft'] }),
      requires_human_review: true,
    },
    {
      agent_type: 'QA_VALIDATION',
      name: 'QA Validation Agent',
      description: 'Validates recommendation memos against the 8-point QA checklist. Checks for completeness, guideline compliance, and professional standards.',
      model_id: claudeSonnet.id,
      status: 'TESTING',
      config: JSON.stringify({ checklist_version: '1.0', strict_mode: true }),
      capabilities: JSON.stringify({ input: ['memo_text', 'case_data'], output: ['qa_result', 'checklist_scores'] }),
      requires_human_review: false,
    },
    {
      agent_type: 'SUSPENSE_MONITOR',
      name: 'Suspense Monitor Agent',
      description: 'Monitors 48-hour and 3-business-day suspense deadlines. Generates alerts, escalation notices, and compliance reports for overdue cases.',
      model_id: claudeSonnet.id,
      status: 'TESTING',
      config: JSON.stringify({ check_interval_minutes: 15, warn_threshold_pct: 75 }),
      capabilities: JSON.stringify({ input: ['case_suspense_data'], output: ['alerts', 'escalation_notices'] }),
      requires_human_review: false,
    },
    {
      agent_type: 'RISK_SCORING',
      name: 'Risk Scoring Agent',
      description: 'Computes composite risk scores across financial, behavioral, foreign influence, and other dimensions. Produces feature vectors for analytical dashboards.',
      model_id: vertexCustom.id,
      status: 'TESTING',
      config: JSON.stringify({ dimensions: ['financial', 'behavioral', 'foreign_influence', 'criminal', 'substance', 'personal_conduct'] }),
      capabilities: JSON.stringify({ input: ['case_data', 'issues', 'documents'], output: ['risk_scores', 'feature_vectors'] }),
      requires_human_review: false,
    },
  ];

  await knex('ai_agents').insert(agents);

  // ─── AI Prompt Templates ──────────────────────────────────────────

  const templates = [
    {
      agent_type: 'DOCUMENT_INTAKE',
      name: 'Document Classification',
      version: 1,
      system_prompt: 'You are a document classification agent for the DoW Security Support Platform. Classify uploaded documents into one of the standard document types used in personnel security adjudication.',
      user_prompt_template: 'Classify the following document:\n\nFilename: {{filename}}\nFile type: {{mime_type}}\nFirst 500 characters: {{preview}}\n\nReturn the document type from this list: Investigation Report (ROI), Credit Report Summary, Questionnaire (SF-86), Interview Summary, National Agency Check, Local Agency Check, Reference Check Summary, Employment Verification, Court Records, Financial Records, Other.',
      variables: JSON.stringify([{ name: 'filename', type: 'string' }, { name: 'mime_type', type: 'string' }, { name: 'preview', type: 'string' }]),
      is_active: true,
    },
    {
      agent_type: 'EXTRACTION',
      name: 'Field Extraction Post-Processing',
      version: 1,
      system_prompt: 'You are a field extraction validation agent. Review Document AI extraction results and normalize field names and values for consistency.',
      user_prompt_template: 'Document type: {{doc_type}}\nRaw extracted fields:\n{{raw_fields}}\n\nNormalize field names to standard schema. Flag any fields with confidence below {{threshold}}.',
      variables: JSON.stringify([{ name: 'doc_type', type: 'string' }, { name: 'raw_fields', type: 'json' }, { name: 'threshold', type: 'number' }]),
      is_active: true,
    },
    {
      agent_type: 'ISSUE_IDENTIFICATION',
      name: 'Adjudicative Issue Analysis',
      version: 1,
      system_prompt: 'You are an adjudicative issue identification agent for DoW personnel security cases. Analyze case evidence against SEAD 4 Adjudicative Guidelines A through M. For each potential issue, identify the guideline, assign a severity (CRITICAL, HIGH, MODERATE, LOW, ADMINISTRATIVE), describe the concern, and suggest mitigating factors if present.',
      user_prompt_template: 'Case: {{case_number}} ({{case_type}})\nSubject: {{subject_name}}\n\nExtracted document fields:\n{{extracted_data}}\n\nExisting issues already identified:\n{{existing_issues}}\n\nAnalyze for additional adjudicative issues under SEAD 4 Guidelines A-M. For each issue found, provide: guideline letter, category, subcategory, severity, description, and any mitigating factors.',
      variables: JSON.stringify([{ name: 'case_number', type: 'string' }, { name: 'case_type', type: 'string' }, { name: 'subject_name', type: 'string' }, { name: 'extracted_data', type: 'json' }, { name: 'existing_issues', type: 'json' }]),
      is_active: true,
    },
    {
      agent_type: 'MEMO_DRAFTING',
      name: 'Recommendation Memo Generator',
      version: 1,
      system_prompt: 'You are a memo drafting agent for DoW personnel security adjudication. Generate formal recommendation memoranda following the standard format: Subject identification, Guidelines at Issue, Disqualifying Conditions with evidence, Mitigating Conditions, Whole-Person Analysis, and Proposed Disposition. Use professional, objective language appropriate for government adjudicative proceedings.',
      user_prompt_template: 'Draft a recommendation memo for:\n\nCase: {{case_number}} ({{case_type}})\nSubject: {{subject_name}}\nProposed Disposition: {{disposition}}\n\nIdentified Issues:\n{{issues}}\n\nCase Documents:\n{{documents}}\n\nCommunications Log:\n{{communications}}\n\nGenerate a complete adjudicative recommendation memo.',
      variables: JSON.stringify([{ name: 'case_number', type: 'string' }, { name: 'case_type', type: 'string' }, { name: 'subject_name', type: 'string' }, { name: 'disposition', type: 'string' }, { name: 'issues', type: 'json' }, { name: 'documents', type: 'json' }, { name: 'communications', type: 'json' }]),
      is_active: true,
    },
    {
      agent_type: 'QA_VALIDATION',
      name: 'Memo QA Checklist',
      version: 1,
      system_prompt: 'You are a QA validation agent. Evaluate recommendation memos against the 8-point quality checklist. Be strict and objective.',
      user_prompt_template: 'Evaluate this memo against the QA checklist:\n\nMemo text:\n{{memo_text}}\n\nCase data:\n- Subject: {{subject_name}}\n- Type: {{case_type}}\n- Issues: {{issue_count}}\n- Documents: {{doc_count}} ({{confirmed_count}} confirmed)\n- Communications: {{comm_count}}\n\nChecklist:\n1. Subject information complete\n2. Case type specified\n3. At least one issue documented\n4. All issues have severity and description\n5. At least one communication logged\n6. Memo written\n7. Memo has substantive content (100+ characters)\n8. All documents confirmed\n\nReturn pass/fail for each item with explanation.',
      variables: JSON.stringify([{ name: 'memo_text', type: 'string' }, { name: 'subject_name', type: 'string' }, { name: 'case_type', type: 'string' }, { name: 'issue_count', type: 'number' }, { name: 'doc_count', type: 'number' }, { name: 'confirmed_count', type: 'number' }, { name: 'comm_count', type: 'number' }]),
      is_active: true,
    },
    {
      agent_type: 'SUSPENSE_MONITOR',
      name: 'Suspense Alert Generator',
      version: 1,
      system_prompt: 'You are a suspense monitoring agent. Generate clear, actionable alerts for cases approaching or exceeding suspense deadlines.',
      user_prompt_template: 'Generate suspense alerts for cases:\n\n{{cases_data}}\n\nCurrent time: {{current_time}}\nAlert threshold: {{threshold_pct}}% of deadline elapsed\n\nFor each case, determine: status (on_track, at_risk, overdue), time remaining, recommended action.',
      variables: JSON.stringify([{ name: 'cases_data', type: 'json' }, { name: 'current_time', type: 'string' }, { name: 'threshold_pct', type: 'number' }]),
      is_active: true,
    },
    {
      agent_type: 'RISK_SCORING',
      name: 'Composite Risk Scorer',
      version: 1,
      system_prompt: 'You are a risk scoring agent. Compute dimensional risk scores for personnel security cases based on identified issues, document evidence, and case metadata.',
      user_prompt_template: 'Score the following case across risk dimensions:\n\nCase: {{case_number}}\nIssues: {{issues}}\nDocuments: {{documents}}\n\nDimensions to score (0.0 to 1.0):\n- financial_risk\n- behavioral_risk\n- foreign_influence_risk\n- criminal_risk\n- substance_risk\n- personal_conduct_risk\n- composite_risk (weighted average)\n\nReturn scores with brief justification for each.',
      variables: JSON.stringify([{ name: 'case_number', type: 'string' }, { name: 'issues', type: 'json' }, { name: 'documents', type: 'json' }]),
      is_active: true,
    },
  ];

  await knex('ai_prompt_templates').insert(templates);
}
