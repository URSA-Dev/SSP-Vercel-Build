/**
 * Seed 015 — SEAD-4 Adjudicative Guidelines Knowledge Base
 * Seeds the RAG knowledge base with the 13 adjudicative guidelines
 * used for personnel security clearance determinations.
 *
 * NOTE: Embeddings are not generated here — they require the embedding
 * service to be running. Chunks are seeded with embedding_status='PENDING'
 * and will be processed by the embedding pipeline on first run.
 */
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex) {
  await knex('ai_rag_query_log').del();
  await knex('ai_knowledge_chunks').del();
  await knex('ai_knowledge_sources').del();

  const now = new Date().toISOString();

  // Check if content_embedding column exists (pgvector may not be installed)
  const colCheck = await knex.raw(`
    SELECT count(*)::int as cnt FROM information_schema.columns
    WHERE table_name = 'ai_knowledge_chunks' AND column_name = 'content_embedding'
  `);
  const hasEmbedding = colCheck.rows[0].cnt > 0;

  // Zero vector placeholder (1536 dimensions) — will be replaced by embedding service
  const zeroVector = `[${new Array(1536).fill(0).join(',')}]`;

  // =============================================================
  // Source: SEAD-4 Adjudicative Guidelines
  // =============================================================
  const sead4Id = uuidv4();
  await knex('ai_knowledge_sources').insert({
    id: sead4Id,
    source_type: 'GUIDELINE',
    title: 'Security Executive Agent Directive 4 — National Security Adjudicative Guidelines',
    description: 'The 13 adjudicative guidelines used for national security eligibility determinations. Effective June 8, 2017.',
    source_reference: 'SEAD-4',
    version: '2017-06-08',
    total_chunks: 13,
    is_active: true,
    effective_date: '2017-06-08',
    created_at: now,
    updated_at: now
  });

  const guidelines = [
    {
      letter: 'A',
      title: 'Allegiance to the United States',
      content: 'Guideline A — Allegiance to the United States. The concern is that an individual must be of unquestioned allegiance to the United States. The willingness to safeguard classified information is in doubt if there is any reason to suspect an individual\'s allegiance to the United States. Conditions that could raise a security concern include involvement in acts of sabotage, espionage, treason, terrorism, seditious conspiracy, or any act to overthrow the U.S. Government. Mitigating conditions include the behavior happening so long ago or under such unusual circumstances that it is unlikely to recur and does not cast doubt on the individual\'s current reliability, trustworthiness, or loyalty.'
    },
    {
      letter: 'B',
      title: 'Foreign Influence',
      content: 'Guideline B — Foreign Influence. The concern is that foreign contacts and interests may be a security concern if the individual has divided loyalties or foreign financial interests that may lead to a conflict of interest. Adjudicators must consider the identity of the foreign country, including its intelligence-gathering history and human rights record. Disqualifying conditions include having a foreign family member, business associate, or contact who could create a potential conflict of interest. Mitigating conditions include the nature of relationships being casual and infrequent, or the value of foreign interests being minimal.'
    },
    {
      letter: 'C',
      title: 'Foreign Preference',
      content: 'Guideline C — Foreign Preference. The concern is that when an individual acts in a way that indicates a preference for a foreign country over the United States, they may provide information or make decisions harmful to U.S. interests. Disqualifying conditions include possession or use of a foreign passport, accepting benefits from a foreign government, or performing military service for a foreign country. Mitigating conditions include the foreign passport being surrendered, or the individual having expressed willingness to renounce dual citizenship.'
    },
    {
      letter: 'D',
      title: 'Sexual Behavior',
      content: 'Guideline D — Sexual Behavior. The concern is that sexual behavior that involves a criminal offense, reflects a lack of judgment, or creates vulnerability to exploitation is a security concern. Disqualifying conditions include sexual behavior of a criminal nature, compulsive or addictive sexual behavior, or behavior that causes exposure to coercion. Mitigating conditions include the behavior occurring during or prior to adolescence with no recurrence, or the behavior no longer serving as a basis for coercion or vulnerability.'
    },
    {
      letter: 'E',
      title: 'Personal Conduct',
      content: 'Guideline E — Personal Conduct. The concern is that conduct involving questionable judgment, lack of candor, dishonesty, or unwillingness to comply with rules raises questions about reliability, trustworthiness, and ability to protect classified information. Disqualifying conditions include deliberate omission or falsification of relevant facts from any personnel security questionnaire, refusal to provide full cooperation with security processing, and credible adverse information not covered by other guidelines. Mitigating conditions include the refusal to cooperate being the result of legal advice, or the offense being minor and not recent.'
    },
    {
      letter: 'F',
      title: 'Financial Considerations',
      content: 'Guideline F — Financial Considerations. The concern is that failure to meet financial obligations may indicate unwillingness to abide by rules, and can raise questions about reliability and trustworthiness. Disqualifying conditions include a history of not meeting financial obligations, deceptive financial practices, unexplained affluence, and failure to file tax returns. Mitigating conditions include the behavior being unlikely to recur, the conditions being beyond the person\'s control, the individual receiving financial counseling, or good-faith effort to resolve debts.'
    },
    {
      letter: 'G',
      title: 'Alcohol Consumption',
      content: 'Guideline G — Alcohol Consumption. The concern is that excessive alcohol consumption often leads to exercising questionable judgment or failing to control impulses. Disqualifying conditions include alcohol-related incidents (DUI, domestic violence), habitual or binge consumption, diagnosis of alcohol use disorder, and failure to follow treatment advice. Mitigating conditions include the passage of time without recurrence, the individual acknowledging the issue and establishing a pattern of responsible use, and successful completion of treatment.'
    },
    {
      letter: 'H',
      title: 'Drug Involvement and Substance Misuse',
      content: 'Guideline H — Drug Involvement and Substance Misuse. The concern is that illegal drug use or misuse of prescription drugs raises questions about willingness to comply with laws. Disqualifying conditions include any substance misuse, testing positive for drug use, diagnosis of substance use disorder, failure to complete treatment, and use after being granted a security clearance. Mitigating conditions include the behavior happening long ago, demonstrated intent not to use again, successful completion of treatment, and a signed statement of intent to abstain.'
    },
    {
      letter: 'I',
      title: 'Psychological Conditions',
      content: 'Guideline I — Psychological Conditions. The concern is that certain emotional, mental, and personality conditions can impair judgment, reliability, or trustworthiness. Disqualifying conditions include behavior indicating a psychological condition that may impair judgment or reliability, failure to follow treatment advice, and opinion by a qualified professional that the individual has a condition that impairs functioning. Mitigating conditions include opinion that the condition is manageable, the individual voluntarily entering counseling, and there being no indication of a current problem.'
    },
    {
      letter: 'J',
      title: 'Criminal Conduct',
      content: 'Guideline J — Criminal Conduct. The concern is that criminal activity creates doubt about judgment, reliability, and trustworthiness, and calls into question willingness to comply with laws. Disqualifying conditions include a pattern of criminal offenses, conviction in a federal or state court, and allegations supported by credible evidence. Mitigating conditions include the criminal behavior being not recent, the circumstances being unlikely to recur, evidence of successful rehabilitation, and the offense being minor.'
    },
    {
      letter: 'K',
      title: 'Handling Protected Information',
      content: 'Guideline K — Handling Protected Information. The concern is that deliberate or negligent failure to comply with rules for protecting classified or sensitive information raises doubt about trustworthiness and the ability to safeguard such information. Disqualifying conditions include deliberate or negligent disclosure, failure to comply with rules for handling, and unauthorized removal. Mitigating conditions include the behavior being infrequent, done inadvertently, or the individual responding favorably to counseling.'
    },
    {
      letter: 'L',
      title: 'Outside Activities',
      content: 'Guideline L — Outside Activities. The concern is that involvement in certain types of outside employment or activities could pose a conflict with an individual\'s security responsibilities. Disqualifying conditions include any service for a foreign government or entity, and employment with an organization that advocates the overthrow of the U.S. government. Mitigating conditions include evaluation of the activity in the context of ongoing national security concerns.'
    },
    {
      letter: 'M',
      title: 'Use of Information Technology',
      content: 'Guideline M — Use of Information Technology. The concern is that failure to comply with rules, procedures, guidelines, or regulations pertaining to information technology systems may raise security concerns about trustworthiness. Disqualifying conditions include unauthorized entry into IT systems, illegal downloading or installation, unauthorized modification, introduction of malware, and disabling or circumventing security measures. Mitigating conditions include the behavior being minor and not recent, or the misuse being due to improper training rather than intent.'
    }
  ];

  const chunks = guidelines.map((g, i) => ({
    id: uuidv4(),
    source_id: sead4Id,
    chunk_index: i,
    content: g.content,
    ...(hasEmbedding ? { content_embedding: zeroVector } : {}),
    token_count: Math.ceil(g.content.split(/\s+/).length * 1.3), // rough estimate
    metadata: JSON.stringify({
      guideline_letter: g.letter,
      title: g.title,
      section: 'SEAD-4 Adjudicative Guidelines'
    }),
    embedding_model: 'text-embedding-3-large',
    embedding_status: 'PENDING',
    created_at: now,
    updated_at: now
  }));

  await knex('ai_knowledge_chunks').insert(chunks);

  // Update chunk count
  await knex('ai_knowledge_sources')
    .where({ id: sead4Id })
    .update({ total_chunks: chunks.length });

  // =============================================================
  // Source: Executive Order 12968
  // =============================================================
  const eo12968Id = uuidv4();
  await knex('ai_knowledge_sources').insert({
    id: eo12968Id,
    source_type: 'REGULATION',
    title: 'Executive Order 12968 — Access to Classified Information',
    description: 'Establishes a uniform Federal personnel security program for employees who will be considered for access to classified information.',
    source_reference: 'EO 12968',
    version: '1995-08-02',
    total_chunks: 1,
    is_active: true,
    effective_date: '1995-08-02',
    created_at: now,
    updated_at: now
  });

  await knex('ai_knowledge_chunks').insert({
    id: uuidv4(),
    source_id: eo12968Id,
    chunk_index: 0,
    content: 'Executive Order 12968 establishes that eligibility for access to classified information shall be granted only to employees who have a need-to-know, have been determined to be eligible, and have signed an approved nondisclosure agreement. Access shall be granted only where facts and circumstances indicate access is clearly consistent with the national security interests of the United States. Any doubt shall be resolved in favor of national security. The order establishes the Security Policy Board and provides for reciprocity of clearances across agencies.',
    ...(hasEmbedding ? { content_embedding: zeroVector } : {}),
    token_count: 90,
    metadata: JSON.stringify({ section: 'Core Principles', document: 'EO 12968' }),
    embedding_model: 'text-embedding-3-large',
    embedding_status: 'PENDING',
    created_at: now,
    updated_at: now
  });
}
