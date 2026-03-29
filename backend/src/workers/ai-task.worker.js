import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import * as AiModel from '../models/ai.model.js';
import * as taskService from '../services/ai/task.service.js';

const log = logger.child({ module: 'ai-worker' });

let worker = null;

export function startWorker() {
  const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

  worker = new Worker('ai-tasks', async (job) => {
    const { taskId } = job.data;
    log.info({ taskId, attempt: job.attemptsMade + 1 }, 'Processing AI task');

    const task = await AiModel.findTaskById(taskId);
    if (!task) { log.warn({ taskId }, 'Task not found, skipping'); return; }
    if (task.status !== 'QUEUED' && task.status !== 'RETRYING') { log.warn({ taskId, status: task.status }, 'Task not in queueable state, skipping'); return; }

    await AiModel.updateTaskStatus(taskId, 'RUNNING', { started_at: new Date() });
    const result = await taskService.executeTask(task);
    return result;
  }, {
    connection,
    concurrency: config.ai.maxConcurrentTasks,
  });

  worker.on('completed', (job) => { log.info({ taskId: job.data.taskId, jobId: job.id }, 'Task completed'); });
  worker.on('failed', (job, err) => { log.error({ taskId: job?.data?.taskId, jobId: job?.id, err: err.message }, 'Task failed'); });
  worker.on('error', (err) => { log.error({ err: err.message }, 'Worker error'); });

  log.info({ concurrency: config.ai.maxConcurrentTasks }, 'AI task worker started');
  return worker;
}

export async function stopWorker() {
  if (worker) { await worker.close(); log.info('AI task worker stopped'); }
}
