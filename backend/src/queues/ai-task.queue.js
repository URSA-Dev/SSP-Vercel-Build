import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const log = logger.child({ module: 'ai-queue' });

const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

export const aiTaskQueue = new Queue('ai-tasks', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const aiTaskQueueEvents = new QueueEvents('ai-tasks', {
  connection: new IORedis(config.redis.url, { maxRetriesPerRequest: null }),
});

export async function addTaskToQueue(taskId, options = {}) {
  const job = await aiTaskQueue.add('process-task', { taskId }, {
    jobId: taskId,
    priority: options.priority || 0,
    ...options,
  });
  log.info({ taskId, jobId: job.id }, 'Task added to queue');
  return job;
}

export async function closeQueue() {
  await aiTaskQueue.close();
  await aiTaskQueueEvents.close();
  connection.disconnect();
  log.info('AI task queue closed');
}
