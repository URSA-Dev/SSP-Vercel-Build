import OpenAI from 'openai';
import config from '../../config/index.js';
import * as AiModel from '../../models/ai.model.js';
import logger from '../../utils/logger.js';
import { AiServiceError } from '../../errors/domain-errors.js';

const log = logger.child({ service: 'ai:embedding' });

let client = null;

function getClient() {
  if (!client) {
    if (!config.openai.apiKey) {
      throw new AiServiceError('OPENAI_API_KEY not configured — cannot generate embeddings');
    }
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

export async function embedText(text) {
  const response = await getClient().embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
    dimensions: config.openai.embeddingDimensions,
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts) {
  const results = [];
  const batchSize = config.openai.batchSize;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await getClient().embeddings.create({
      model: config.openai.embeddingModel,
      input: batch,
      dimensions: config.openai.embeddingDimensions,
    });
    results.push(...response.data.map(d => d.embedding));
    log.info({ batch: Math.floor(i / batchSize) + 1, total: Math.ceil(texts.length / batchSize) }, 'Embedding batch processed');
  }

  return results;
}

export async function embedAndStoreChunks(sourceId) {
  const chunks = await AiModel.findChunksBySource(sourceId);
  const pending = chunks.filter(c => c.embedding_status !== 'COMPLETED');

  if (pending.length === 0) {
    log.info({ sourceId }, 'All chunks already embedded');
    return 0;
  }

  log.info({ sourceId, pendingCount: pending.length }, 'Embedding chunks');

  const texts = pending.map(c => c.content);
  const embeddings = await embedBatch(texts);

  const db = (await import('../../config/database.js')).default;

  for (let i = 0; i < pending.length; i++) {
    const vectorStr = `[${embeddings[i].join(',')}]`;
    await db('ai_knowledge_chunks')
      .where({ id: pending[i].id })
      .update({
        content_embedding: db.raw(`?::vector`, [vectorStr]),
        embedding_status: 'COMPLETED',
        embedding_model: config.openai.embeddingModel,
        updated_at: new Date(),
      });
  }

  log.info({ sourceId, embeddedCount: pending.length }, 'Chunks embedded successfully');
  return pending.length;
}
