import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

export class BaseAgent extends EventEmitter {
  constructor(id, name, type, memorySystem, toolRegistry) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.memorySystem = memorySystem;
    this.toolRegistry = toolRegistry;
    this.status = 'idle';
    this.currentTask = null;
    this.messageQueue = [];
    this.capabilities = [];
    this.initialize();
  }

  async initialize() {
    await this.memorySystem.updateAgentState(this.id, {
      status: this.status,
      last_activity: new Date().toISOString()
    });
  }

  async processMessage(message) {
    try {
      this.status = 'processing';
      await this.memorySystem.addMemory(this.id, 'message_received', message, {
        timestamp: new Date().toISOString()
      });

      const response = await this.handleMessage(message);
      
      await this.memorySystem.addMemory(this.id, 'message_sent', response, {
        timestamp: new Date().toISOString(),
        in_response_to: message.id
      });

      this.status = 'idle';
      return response;
    } catch (error) {
      this.status = 'error';
      await this.memorySystem.addMemory(this.id, 'error', {
        message: error.message,
        stack: error.stack
      }, {
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async handleMessage(message) {
    // Override in subclasses
    return {
      id: uuidv4(),
      sender: this.id,
      type: 'response',
      content: 'Message processed',
      timestamp: new Date().toISOString()
    };
  }

  async executeTask(task) {
    try {
      this.currentTask = task;
      this.status = 'working';
      
      await this.memorySystem.addMemory(this.id, 'task_started', task, {
        timestamp: new Date().toISOString()
      });

      const result = await this.performTask(task);
      
      await this.memorySystem.addMemory(this.id, 'task_completed', result, {
        timestamp: new Date().toISOString(),
        task_id: task.id
      });

      this.status = 'idle';
      this.currentTask = null;
      return result;
    } catch (error) {
      this.status = 'error';
      await this.memorySystem.addMemory(this.id, 'task_failed', {
        task_id: task.id,
        error: error.message
      }, {
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async performTask(task) {
    // Override in subclasses
    return {
      task_id: task.id,
      status: 'completed',
      result: 'Task executed successfully',
      timestamp: new Date().toISOString()
    };
  }

  async useTool(toolName, parameters) {
    try {
      const result = await this.toolRegistry.executeTool(toolName, parameters);
      
      await this.memorySystem.addMemory(this.id, 'tool_usage', {
        tool: toolName,
        parameters,
        result
      }, {
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      await this.memorySystem.addMemory(this.id, 'tool_error', {
        tool: toolName,
        error: error.message
      }, {
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async recallMemories(type = null, query = null, limit = 10) {
    if (query) {
      return await this.memorySystem.searchMemories(this.id, query, type);
    }
    return await this.memorySystem.getMemories(this.id, type, limit);
  }

  async storeMemory(type, content, metadata = {}) {
    return await this.memorySystem.addMemory(this.id, type, content, metadata);
  }

  sendMessage(targetAgent, message) {
    const messageObj = {
      id: uuidv4(),
      sender: this.id,
      target: targetAgent,
      ...message,
      timestamp: new Date().toISOString()
    };
    
    this.emit('message', messageObj);
    return messageObj;
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      current_task: this.currentTask,
      capabilities: this.capabilities,
      queue_length: this.messageQueue.length
    };
  }

  async shutdown() {
    this.status = 'shutdown';
    await this.memorySystem.updateAgentState(this.id, {
      status: this.status,
      last_activity: new Date().toISOString()
    });
  }
}
