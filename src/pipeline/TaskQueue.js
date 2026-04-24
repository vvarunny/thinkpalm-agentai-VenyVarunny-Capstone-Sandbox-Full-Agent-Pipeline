import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';

export class TaskQueue extends EventEmitter {
  constructor(maxConcurrency = 5) {
    super();
    this.queues = {
      high: [],
      normal: [],
      low: []
    };
    this.running = new Map();
    this.completed = [];
    this.failed = [];
    this.maxConcurrency = maxConcurrency;
    this.processing = false;
    this.taskExecutor = null;
  }

  enqueue(task, priority = 'normal') {
    if (!this.queues[priority]) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    const taskWrapper = {
      id: uuidv4(),
      task,
      priority,
      status: 'queued',
      created_at: new Date().toISOString(),
      attempts: 0,
      max_attempts: 3
    };

    this.queues[priority].push(taskWrapper);
    this.emit('task_queued', taskWrapper);
    
    this.processQueue();
    return taskWrapper.id;
  }

  async processQueue() {
    if (this.processing || this.running.size >= this.maxConcurrency) {
      return;
    }

    this.processing = true;

    while (this.running.size < this.maxConcurrency && this.hasQueuedTasks()) {
      const taskWrapper = this.getNextTask();
      if (taskWrapper) {
        this.executeTask(taskWrapper);
      } else {
        break;
      }
    }

    this.processing = false;
  }

  getNextTask() {
    // Check queues in priority order: high, normal, low
    for (const priority of ['high', 'normal', 'low']) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift();
      }
    }
    return null;
  }

  hasQueuedTasks() {
    return this.queues.high.length > 0 || 
           this.queues.normal.length > 0 || 
           this.queues.low.length > 0;
  }

  async executeTask(taskWrapper) {
    taskWrapper.status = 'running';
    taskWrapper.started_at = new Date().toISOString();
    this.running.set(taskWrapper.id, taskWrapper);
    
    this.emit('task_started', taskWrapper);

    try {
      const result = await this.runTask(taskWrapper.task);
      
      taskWrapper.status = 'completed';
      taskWrapper.completed_at = new Date().toISOString();
      taskWrapper.result = result;
      
      this.running.delete(taskWrapper.id);
      this.completed.push(taskWrapper);
      
      this.emit('task_completed', { 
        task: taskWrapper.task, 
        result: taskWrapper.result,
        id: taskWrapper.id,
        completed_at: taskWrapper.completed_at
      });
      
    } catch (error) {
      taskWrapper.attempts++;
      taskWrapper.error = error.message;
      
      if (taskWrapper.attempts >= taskWrapper.max_attempts) {
        taskWrapper.status = 'failed';
        taskWrapper.failed_at = new Date().toISOString();
        
        this.running.delete(taskWrapper.id);
        this.failed.push(taskWrapper);
        
        this.emit('task_failed', { 
        task: taskWrapper.task, 
        error: taskWrapper.error,
        id: taskWrapper.id,
        failed_at: taskWrapper.failed_at
      });
      } else {
        // Retry the task
        taskWrapper.status = 'retrying';
        this.running.delete(taskWrapper.id);
        this.queues.normal.push(taskWrapper); // Retry with normal priority
        
        this.emit('task_retry', taskWrapper);
      }
    }
    
    // Continue processing the queue
    this.processQueue();
  }

  async runTask(task) {
    // This should be overridden or set by the pipeline
    if (task.execute && typeof task.execute === 'function') {
      return await task.execute();
    } else if (this.taskExecutor) {
      return await this.taskExecutor(task);
    } else {
      throw new Error('Task does not have an execute method and no task executor is set');
    }
  }

  setTaskExecutor(executor) {
    this.taskExecutor = executor;
  }

  getTaskStatus(taskId) {
    // Check running tasks
    const running = this.running.get(taskId);
    if (running) return running;

    // Check queues
    for (const priority of ['high', 'normal', 'low']) {
      const queued = this.queues[priority].find(t => t.id === taskId);
      if (queued) return queued;
    }

    // Check completed tasks
    const completed = this.completed.find(t => t.id === taskId);
    if (completed) return completed;

    // Check failed tasks
    const failed = this.failed.find(t => t.id === taskId);
    if (failed) return failed;

    return null;
  }

  getQueueStatus() {
    return {
      queued: {
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        total: this.hasQueuedTasks()
      },
      running: this.running.size,
      completed: this.completed.length,
      failed: this.failed.length,
      total_processed: this.completed.length + this.failed.length
    };
  }

  clearCompleted() {
    this.completed = [];
  }

  clearFailed() {
    this.failed = [];
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.processQueue();
  }

  cancelTask(taskId) {
    // Remove from queues
    for (const priority of ['high', 'normal', 'low']) {
      const index = this.queues[priority].findIndex(t => t.id === taskId);
      if (index !== -1) {
        const task = this.queues[priority].splice(index, 1)[0];
        task.status = 'cancelled';
        task.cancelled_at = new Date().toISOString();
        this.emit('task_cancelled', task);
        return true;
      }
    }

    // If task is running, we can't cancel it (would need more sophisticated implementation)
    const running = this.running.get(taskId);
    if (running) {
      return false; // Cannot cancel running tasks in this simple implementation
    }

    return false;
  }
}
