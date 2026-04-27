import EventEmitter from 'events';
import { TaskQueue } from './TaskQueue.js';
import { v4 as uuidv4 } from 'uuid';

export class Pipeline extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.taskQueue = new TaskQueue(5);
    this.workflows = new Map();
    this.activeExecutions = new Map();
    this.metrics = {
      total_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      average_execution_time: 0
    };
    
    this.setupEventHandlers();
    this.setupTaskExecutor();
  }

  setupEventHandlers() {
    this.taskQueue.on('task_completed', (taskWrapper) => {
      this.metrics.completed_tasks++;
      this.updateMetrics(taskWrapper);
      this.emit('task_completed', taskWrapper);
    });

    this.taskQueue.on('task_failed', (taskWrapper) => {
      this.metrics.failed_tasks++;
      this.emit('task_failed', taskWrapper);
    });

    this.taskQueue.on('task_started', (taskWrapper) => {
      this.emit('task_started', taskWrapper);
    });
  }

  setupTaskExecutor() {
    this.taskQueue.setTaskExecutor(async (task) => {
      return await this.executeTask(task);
    });
  }

  async executeTask(task) {
    // Route task to appropriate agent based on task type and parameters
    let targetAgent;
    
    if (task.agent_id) {
      // Direct agent assignment
      targetAgent = this.agents.get(task.agent_id);
    } else if (task.type) {
      // Route based on task type
      switch (task.type) {
        case 'analysis':
        case 'data_processing':
        case 'code_review':
        case 'bug_detection':
          targetAgent = this.agents.get('analysis-001');
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } else {
      throw new Error('Task must have either agent_id or type');
    }

    if (!targetAgent) {
      throw new Error(`Target agent not found for task: ${task.type || task.agent_id}`);
    }

    // Create a proper task object for the agent
    const agentTask = {
      id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: task.type,
      parameters: task.parameters || {},
      context: task.context || {}
    };

    return await targetAgent.executeTask(agentTask);
  }

  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    
    // Set up agent event forwarding
    agent.on('message', (message) => {
      this.emit('agent_message', message);
    });

    agent.on('task_completed', (result) => {
      this.emit('agent_task_completed', result);
    });

    agent.on('error', (error) => {
      this.emit('agent_error', { agent_id: agent.id, error });
    });
  }

  async submitTask(task, priority = 'normal', options = {}) {
    const taskId = this.taskQueue.enqueue(task, priority);
    this.metrics.total_tasks++;
    
    const taskWrapper = {
      id: taskId,
      task,
      priority,
      options,
      submitted_at: new Date().toISOString()
    };

    this.emit('task_submitted', taskWrapper);
    return taskId;
  }

  async executeWorkflow(workflowDefinition, context = {}) {
    const workflowId = uuidv4();
    const workflow = {
      id: workflowId,
      definition: workflowDefinition,
      context: context,
      status: 'created',
      steps: [],
      current_step: 0,
      results: {},
      created_at: new Date().toISOString()
    };

    this.workflows.set(workflowId, workflow);
    this.emit('workflow_created', workflow);

    try {
      await this.executeWorkflowSteps(workflow);
      workflow.status = 'completed';
      workflow.completed_at = new Date().toISOString();
      
      this.emit('workflow_completed', workflow);
      return workflow;
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.failed_at = new Date().toISOString();
      
      this.emit('workflow_failed', workflow);
      throw error;
    }
  }

  async executeWorkflowSteps(workflow) {
    workflow.status = 'running';
    
    for (let i = 0; i < workflow.definition.steps.length; i++) {
      const stepDefinition = workflow.definition.steps[i];
      workflow.current_step = i;
      
      const step = {
        id: uuidv4(),
        workflow_id: workflow.id,
        definition: stepDefinition,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      workflow.steps.push(step);
      
      try {
        const stepResult = await this.executeWorkflowStep(step, workflow.context);
        step.status = 'completed';
        step.result = stepResult;
        step.completed_at = new Date().toISOString();
        workflow.results[stepDefinition.name] = stepResult;
        
        this.emit('workflow_step_completed', step);
        
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.failed_at = new Date().toISOString();
        
        this.emit('workflow_step_failed', step);
        
        if (stepDefinition.required !== false) {
          throw new Error(`Workflow step '${stepDefinition.name}' failed: ${error.message}`);
        }
      }
    }
  }

  async executeWorkflowStep(step, context) {
    const { definition } = step;
    
    switch (definition.type) {
      case 'agent_task':
        return await this.executeAgentTask(definition, context);
      case 'parallel_tasks':
        return await this.executeParallelTasks(definition, context);
      case 'conditional':
        return await this.executeConditionalTask(definition, context);
      case 'delay':
        return await this.executeDelay(definition);
      case 'data_flow':
        return await this.executeDataFlow(definition, context);
      default:
        throw new Error(`Unknown step type: ${definition.type}`);
    }
  }

  async executeAgentTask(stepDefinition, context) {
    const agent = this.agents.get(stepDefinition.agent_id);
    if (!agent) {
      throw new Error(`Agent not found: ${stepDefinition.agent_id}`);
    }

    const task = {
      id: uuidv4(),
      type: stepDefinition.task_type,
      parameters: stepDefinition.parameters || {},
      context: { ...context, ...stepDefinition.context }
    };

    return await agent.executeTask(task);
  }

  async executeParallelTasks(stepDefinition, context) {
    const tasks = stepDefinition.tasks.map(taskDef => 
      this.executeWorkflowStep({
        id: uuidv4(),
        definition: taskDef
      }, context)
    );

    return await Promise.all(tasks);
  }

  async executeConditionalTask(stepDefinition, context) {
    const condition = this.evaluateCondition(stepDefinition.condition, context);
    
    if (condition) {
      return await this.executeWorkflowStep({
        id: uuidv4(),
        definition: stepDefinition.then_step
      }, context);
    } else if (stepDefinition.else_step) {
      return await this.executeWorkflowStep({
        id: uuidv4(),
        definition: stepDefinition.else_step
      }, context);
    }
    
    return { status: 'skipped', reason: 'condition not met' };
  }

  async executeDelay(stepDefinition) {
    const duration = stepDefinition.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { status: 'delayed', duration };
  }

  async executeDataFlow(stepDefinition, context) {
    const { source, transformation, target } = stepDefinition;
    
    // Get data from source
    const sourceData = await this.getDataFromSource(source, context);
    
    // Apply transformation if specified
    let transformedData = sourceData;
    if (transformation) {
      transformedData = await this.applyTransformation(sourceData, transformation);
    }
    
    // Send to target if specified
    if (target) {
      await this.sendDataToTarget(transformedData, target, context);
    }
    
    return {
      source_data_size: Array.isArray(sourceData) ? sourceData.length : 1,
      transformed_data_size: Array.isArray(transformedData) ? transformedData.length : 1,
      transformation_applied: !!transformation
    };
  }

  async getDataFromSource(source, context) {
    switch (source.type) {
      case 'agent':
        const agent = this.agents.get(source.agent_id);
        if (!agent) throw new Error(`Agent not found: ${source.agent_id}`);
        return await agent.recallMemories(source.memory_type);
      case 'workflow':
        const workflow = this.workflows.get(source.workflow_id);
        if (!workflow) throw new Error(`Workflow not found: ${source.workflow_id}`);
        return workflow.results[source.step_name] || null;
      case 'external':
        // Mock external data source
        return { data: 'mock external data', timestamp: new Date().toISOString() };
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }

  async applyTransformation(data, transformation) {
    switch (transformation.type) {
      case 'filter':
        return data.filter(item => this.evaluateCondition(transformation.condition, item));
      case 'map':
        return data.map(item => this.applyMapping(item, transformation.mapping));
      case 'aggregate':
        return this.aggregateData(data, transformation.aggregation);
      default:
        return data;
    }
  }

  async sendDataToTarget(data, target, context) {
    switch (target.type) {
      case 'agent':
        const agent = this.agents.get(target.agent_id);
        if (!agent) throw new Error(`Agent not found: ${target.agent_id}`);
        await agent.storeMemory(target.memory_type, data);
        break;
      case 'workflow':
        // Update workflow context
        context[target.context_key] = data;
        break;
      case 'external':
        // Mock external target
        console.log('Sending data to external target:', data);
        break;
      default:
        throw new Error(`Unknown target type: ${target.type}`);
    }
  }

  evaluateCondition(condition, context) {
    // Simple condition evaluation - in real implementation would be more sophisticated
    if (typeof condition === 'function') {
      return condition(context);
    } else if (typeof condition === 'string') {
      // Simple string-based condition
      return condition === 'true' || condition === '1';
    } else if (typeof condition === 'object') {
      // Object-based condition evaluation
      const { field, operator, value } = condition;
      const contextValue = context[field];
      
      switch (operator) {
        case 'equals': return contextValue === value;
        case 'not_equals': return contextValue !== value;
        case 'greater_than': return contextValue > value;
        case 'less_than': return contextValue < value;
        case 'contains': return Array.isArray(contextValue) && contextValue.includes(value);
        default: return true;
      }
    }
    return true;
  }

  applyMapping(item, mapping) {
    const result = {};
    for (const [targetKey, sourceKey] of Object.entries(mapping)) {
      result[targetKey] = item[sourceKey];
    }
    return result;
  }

  aggregateData(data, aggregation) {
    switch (aggregation.type) {
      case 'count':
        return data.length;
      case 'sum':
        return data.reduce((sum, item) => sum + (item[aggregation.field] || 0), 0);
      case 'average':
        const sum = data.reduce((sum, item) => sum + (item[aggregation.field] || 0), 0);
        return sum / data.length;
      case 'group':
        return data.reduce((groups, item) => {
          const key = item[aggregation.field];
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
          return groups;
        }, {});
      default:
        return data;
    }
  }

  getTaskStatus(taskId) {
    return this.taskQueue.getTaskStatus(taskId);
  }

  getWorkflowStatus(workflowId) {
    return this.workflows.get(workflowId);
  }

  getSystemStatus() {
    return {
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        type: agent.type,
        status: agent.status
      })),
      task_queue: this.taskQueue.getQueueStatus(),
      workflows: Array.from(this.workflows.values()).map(wf => ({
        id: wf.id,
        status: wf.status,
        steps_count: wf.steps.length,
        current_step: wf.current_step
      })),
      metrics: this.metrics
    };
  }

  updateMetrics(taskWrapper) {
    if (taskWrapper.started_at && taskWrapper.completed_at) {
      const executionTime = new Date(taskWrapper.completed_at) - new Date(taskWrapper.started_at);
      const totalCompleted = this.metrics.completed_tasks;
      this.metrics.average_execution_time = 
        (this.metrics.average_execution_time * (totalCompleted - 1) + executionTime) / totalCompleted;
    }
  }

  async shutdown() {
    // Shutdown all agents
    for (const agent of this.agents.values()) {
      await agent.shutdown();
    }
    
    // Clear queues
    this.taskQueue.clearCompleted();
    this.taskQueue.clearFailed();
    
    this.emit('shutdown');
  }
}
