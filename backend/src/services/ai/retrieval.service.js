import logger from '../../utils/logger.js';
import * as AiModel from '../../models/ai.model.js';
import config from '../../config/index.js';
import { embedText } from './embedding.service.js';

const log = logger.child({ service: 'ai:retrieval' });

export async function search({ query, agentType, taskId, topK, threshold }) {
  const resolvedTopK = topK || config.ai.defaultTopK;
  const resolvedThreshold = threshold || config.ai.similarityThreshold;
  const start = Date.now();

  if (!config.openai.apiKey) {
    log.warn('OPENAI_API_KEY not set — returning empty RAG results');
    await AiModel.logRagQuery({
      task_id: taskId || null,
      agent_type: agentType,
      query_text: query,
      query_embedding: null,
      retrieved_chunk_ids: null,
      retrieved_scores: null,
      top_k: resolvedTopK,
      similarity_threshold: resolvedThreshold,
      total_results: 0,
      latency_ms: Date.now() - start,
    });
    return { chunks: [], totalResults: 0, latencyMs: 0 };
  }

  const queryEmbedding = await embedText(query);
  const chunks = await AiModel.vectorSearch(queryEmbedding, resolvedTopK, resolvedThreshold);
  const latencyMs = Date.now() - start;

  await AiModel.logRagQuery({
    task_id: taskId || null,
    agent_type: agentType,
    query_text: query,
    query_embedding: null,
    retrieved_chunk_ids: chunks.map(c => c.id),
    retrieved_scores: chunks.map(c => parseFloat(c.similarity)),
    top_k: resolvedTopK,
    similarity_threshold: resolvedThreshold,
    total_results: chunks.length,
    latency_ms: latencyMs,
  });

  log.info({ query: query.slice(0, 100), resultsCount: chunks.length, latencyMs }, 'RAG search completed');
  return { chunks, totalResults: chunks.length, latencyMs };
}

export function formatContextForPrompt(chunks) {
  if (!chunks || chunks.length === 0) return '';
  return chunks.map(c => `--- Source: ${c.source_title} (${c.source_reference}) ---\n${c.content}\n`).join('\n');
}
