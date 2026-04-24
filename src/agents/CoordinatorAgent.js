import { BaseAgent } from './BaseAgent.js';

export class CoordinatorAgent extends BaseAgent {
  constructor(id, memorySystem, toolRegistry) {
    super(id, 'Coordinator Agent', 'coordinator', memorySystem, toolRegistry);
    this.capabilities = ['task_orchestration', 'agent_coordination', 'workflow_management', 'resource_allocation'];
    this.activeWorkflows = new Map();
    this.agentRegistry = new Map();
  }

  registerAgent(agent) {
    this.agentRegistry.set(agent.id, agent);
    
    // Set up message forwarding
    agent.on('message', (message) => {
      this.handleAgentMessage(message);
    });
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'workflow_request':
        return await this.handleWorkflowRequest(message);
      case 'task_delegation':
        return await this.handleTaskDelegation(message);
      case 'agent_status_request':
        return await this.handleAgentStatusRequest(message);
      case 'workflow_status':
        return await this.handleWorkflowStatus(message);
      default:
        return await super.handleMessage(message);
    }
  }

  async performTask(task) {
    switch (task.type) {
      case 'coordinate_workflow':
        return await this.coordinateWorkflow(task);
      case 'manage_agents':
        return await this.manageAgents(task);
      case 'allocate_resources':
        return await this.allocateResources(task);
      default:
        return await super.performTask(task);
    }
  }

  async handleWorkflowRequest(message) {
    const { workflow, priority = 'normal', context } = message.content;
    
    try {
      const workflowId = this.generateWorkflowId();
      const workflowInstance = await this.createWorkflow(workflowId, workflow, priority, context);
      
      this.activeWorkflows.set(workflowId, workflowInstance);
      
      const result = await this.executeWorkflow(workflowInstance);
      
      await this.storeMemory('workflow_execution', result, {
        workflow_id: workflowId,
        workflow_type: workflow.type,
        status: result.status
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'workflow_response',
        content: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'error',
        content: { error: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }

  async handleTaskDelegation(message) {
    const { task, target_agent, requirements } = message.content;
    
    try {
      const targetAgent = this.agentRegistry.get(target_agent);
      if (!targetAgent) {
        throw new Error(`Target agent not found: ${target_agent}`);
      }

      // Check agent availability
      if (targetAgent.status !== 'idle') {
        throw new Error(`Agent ${target_agent} is not available. Current status: ${targetAgent.status}`);
      }

      // Delegate task
      const taskResult = await targetAgent.executeTask(task);
      
      const result = {
        delegated_task: task,
        target_agent: target_agent,
        result: taskResult,
        delegation_timestamp: new Date().toISOString()
      };

      await this.storeMemory('task_delegation', result, {
        target_agent,
        task_type: task.type
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'delegation_response',
        content: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'error',
        content: { error: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }

  async handleAgentStatusRequest(message) {
    const { agent_ids } = message.content;
    
    const statuses = {};
    for (const agentId of agent_ids) {
      const agent = this.agentRegistry.get(agentId);
      if (agent) {
        statuses[agentId] = agent.getStatus();
      } else {
        statuses[agentId] = { error: 'Agent not found' };
      }
    }

    return {
      id: this.generateMessageId(),
      sender: this.id,
      type: 'agent_status_response',
      content: {
        agent_statuses: statuses,
        total_agents: this.agentRegistry.size,
        active_workflows: this.activeWorkflows.size,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }

  async handleWorkflowStatus(message) {
    const { workflow_id } = message.content;
    
    const workflow = this.activeWorkflows.get(workflow_id);
    if (!workflow) {
      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'error',
        content: { error: 'Workflow not found' },
        timestamp: new Date().toISOString()
      };
    }

    return {
      id: this.generateMessageId(),
      sender: this.id,
      type: 'workflow_status_response',
      content: {
        workflow_id: workflow.id,
        status: workflow.status,
        current_step: workflow.current_step,
        total_steps: workflow.steps.length,
        progress: workflow.progress,
        results: workflow.results,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }

  async coordinateWorkflow(task) {
    const { workflow_definition, agents, resources } = task;
    
    const coordination = {
      task_id: task.id,
      workflow_definition,
      coordination_plan: this.createCoordinationPlan(workflow_definition, agents),
      execution_log: [],
      resource_allocation: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Allocate resources
      coordination.resource_allocation = await this.allocateResourcesToAgents(agents, resources);
      
      // Execute workflow steps
      for (const step of coordination.coordination_plan.steps) {
        const stepResult = await this.executeWorkflowStep(step, agents);
        coordination.execution_log.push(stepResult);
        
        if (!stepResult.success) {
          throw new Error(`Workflow step failed: ${step.name}`);
        }
      }

      await this.storeMemory('workflow_coordination', coordination, {
        steps_count: coordination.coordination_plan.steps.length,
        success: true
      });

      return {
        task_id: task.id,
        status: 'completed',
        result: coordination,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      coordination.error = error.message;
      
      await this.storeMemory('workflow_coordination', coordination, {
        success: false,
        error: error.message
      });

      return {
        task_id: task.id,
        status: 'failed',
        result: coordination,
        timestamp: new Date().toISOString()
      };
    }
  }

  async manageAgents(task) {
    const { operation, agent_configs } = task;
    
    const managementResult = {
      task_id: task.id,
      operation: operation,
      affected_agents: [],
      timestamp: new Date().toISOString()
    };

    switch (operation) {
      case 'update_config':
        for (const config of agent_configs) {
          const agent = this.agentRegistry.get(config.agent_id);
          if (agent) {
            // Update agent configuration (mock implementation)
            managementResult.affected_agents.push({
              agent_id: config.agent_id,
              status: 'updated',
              config_updated: Object.keys(config.updates)
            });
          }
        }
        break;
        
      case 'restart':
        for (const agentId of agent_configs) {
          const agent = this.agentRegistry.get(agentId);
          if (agent) {
            await agent.shutdown();
            // Restart logic would go here
            managementResult.affected_agents.push({
              agent_id: agentId,
              status: 'restarted'
            });
          }
        }
        break;
        
      default:
        throw new Error(`Unknown management operation: ${operation}`);
    }

    await this.storeMemory('agent_management', managementResult, {
      operation,
      agents_count: managementResult.affected_agents.length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: managementResult,
      timestamp: new Date().toISOString()
    };
  }

  async allocateResources(task) {
    const { resources, allocation_strategy = 'balanced' } = task;
    
    const allocation = {
      task_id: task.id,
      resources: resources,
      strategy: allocation_strategy,
      allocations: {},
      timestamp: new Date().toISOString()
    };

    // Simple resource allocation based on strategy
    switch (allocation_strategy) {
      case 'balanced':
        allocation.allocations = this.balancedAllocation(resources);
        break;
      case 'priority':
        allocation.allocations = this.priorityAllocation(resources);
        break;
      case 'round_robin':
        allocation.allocations = this.roundRobinAllocation(resources);
        break;
      default:
        throw new Error(`Unknown allocation strategy: ${allocation_strategy}`);
    }

    await this.storeMemory('resource_allocation', allocation, {
      strategy: allocation_strategy,
      resources_count: Object.keys(resources).length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: allocation,
      timestamp: new Date().toISOString()
    };
  }

  async createWorkflow(workflowId, workflow, priority, context) {
    return {
      id: workflowId,
      type: workflow.type,
      priority: priority,
      context: context,
      status: 'created',
      steps: workflow.steps || [],
      current_step: 0,
      progress: 0,
      results: {},
      created_at: new Date().toISOString()
    };
  }

  async executeWorkflow(workflow) {
    workflow.status = 'running';
    
    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflow.current_step = i;
        
        const stepResult = await this.executeStep(step, workflow.context);
        workflow.results[step.name] = stepResult;
        workflow.progress = (i + 1) / workflow.steps.length;
      }
      
      workflow.status = 'completed';
      workflow.completed_at = new Date().toISOString();
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.failed_at = new Date().toISOString();
    }
    
    return workflow;
  }

  async executeStep(step, context) {
    switch (step.type) {
      case 'agent_task':
        return await this.delegateToAgent(step.agent_id, step.task);
      case 'parallel_tasks':
        return await this.executeParallelTasks(step.tasks, context);
      case 'conditional':
        return await this.executeConditionalStep(step, context);
      case 'delay':
        await this.delay(step.duration || 1000);
        return { status: 'delayed', duration: step.duration };
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async delegateToAgent(agentId, task) {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    return await agent.executeTask(task);
  }

  async executeParallelTasks(tasks, context) {
    const promises = tasks.map(task => this.executeStep(task, context));
    return await Promise.all(promises);
  }

  async executeConditionalStep(step, context) {
    const condition = this.evaluateCondition(step.condition, context);
    if (condition) {
      return await this.executeStep(step.then_step, context);
    } else if (step.else_step) {
      return await this.executeStep(step.else_step, context);
    }
    return { status: 'skipped', reason: 'condition not met' };
  }

  evaluateCondition(condition, context) {
    // Simple condition evaluation - in real implementation would be more sophisticated
    return true;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createCoordinationPlan(workflowDefinition, agents) {
    return {
      workflow_type: workflowDefinition.type,
      agents: agents,
      steps: workflowDefinition.steps || [],
      dependencies: workflowDefinition.dependencies || [],
      estimated_duration: this.estimateDuration(workflowDefinition)
    };
  }

  async allocateResourcesToAgents(agents, resources) {
    const allocation = {};
    for (const agentId of agents) {
      allocation[agentId] = {
        cpu: 25,
        memory: 512,
        storage: 100
      };
    }
    return allocation;
  }

  balancedAllocation(resources) {
    const agents = Array.from(this.agentRegistry.keys());
    const allocation = {};
    const resourceCount = agents.length;
    
    for (const [resource, amount] of Object.entries(resources)) {
      const perAgent = amount / resourceCount;
      agents.forEach(agent => {
        if (!allocation[agent]) allocation[agent] = {};
        allocation[agent][resource] = perAgent;
      });
    }
    
    return allocation;
  }

  priorityAllocation(resources) {
    // Simple priority-based allocation
    const agents = Array.from(this.agentRegistry.keys()).sort();
    const allocation = {};
    
    agents.forEach((agent, index) => {
      if (!allocation[agent]) allocation[agent] = {};
      // Higher priority agents get more resources
      const multiplier = 1 + (index * 0.2);
      for (const [resource, amount] of Object.entries(resources)) {
        allocation[agent][resource] = amount * multiplier / agents.length;
      }
    });
    
    return allocation;
  }

  roundRobinAllocation(resources) {
    const agents = Array.from(this.agentRegistry.keys());
    const allocation = {};
    
    for (const [resource, amount] of Object.entries(resources)) {
      const perAgent = amount / agents.length;
      agents.forEach(agent => {
        if (!allocation[agent]) allocation[agent] = {};
        allocation[agent][resource] = perAgent;
      });
    }
    
    return allocation;
  }

  estimateDuration(workflowDefinition) {
    // Mock duration estimation
    return (workflowDefinition.steps?.length || 0) * 5000; // 5 seconds per step
  }

  handleAgentMessage(message) {
    // Handle messages from other agents
    this.emit('agent_message', message);
  }

  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSystemStatus() {
    return {
      total_agents: this.agentRegistry.size,
      active_workflows: this.activeWorkflows.size,
      agent_statuses: Array.from(this.agentRegistry.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        status: agent.status
      })),
      workflow_statuses: Array.from(this.activeWorkflows.values()).map(wf => ({
        id: wf.id,
        type: wf.type,
        status: wf.status,
        progress: wf.progress
      }))
    };
  }
}
