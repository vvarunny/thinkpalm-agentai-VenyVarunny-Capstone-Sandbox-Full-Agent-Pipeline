import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { MemorySystem } from './memory/MemorySystem.js';
import { ToolRegistry } from './tools/ToolRegistry.js';
import { Pipeline } from './pipeline/Pipeline.js';
import { AnalysisAgent } from './agents/AnalysisAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AgenticPipelineServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.memorySystem = new MemorySystem();
    this.toolRegistry = new ToolRegistry();
    this.pipeline = new Pipeline();
    
    this.setupAgents();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  setupAgents() {
    // Create agents
    this.analysisAgent = new AnalysisAgent('analysis-001', this.memorySystem, this.toolRegistry);
    
    // Register agents with pipeline
    this.pipeline.registerAgent(this.analysisAgent);
    
    // Set up pipeline event forwarding to WebSocket clients
    this.setupPipelineEventForwarding();
  }

  setupMiddleware() {
    // Enable CORS for all routes
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../dist')));
  }

  setupRoutes() {
    // Serve code review interface
    this.app.get('/code-review', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui', 'code_review.html'));
    });


    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json(this.pipeline.getSystemStatus());
    });

    this.app.post('/api/tasks', async (req, res) => {
      try {
        const { task, priority } = req.body;
        const taskId = await this.pipeline.submitTask(task, priority);
        res.json({ task_id: taskId, status: 'submitted' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/tasks/:taskId', (req, res) => {
      const status = this.pipeline.getTaskStatus(req.params.taskId);
      if (status) {
        res.json(status);
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    });

    this.app.post('/api/workflows', async (req, res) => {
      try {
        const { workflow, context } = req.body;
        const result = await this.pipeline.executeWorkflow(workflow, context);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/workflows/:workflowId', (req, res) => {
      const workflow = this.pipeline.getWorkflowStatus(req.params.workflowId);
      if (workflow) {
        res.json(workflow);
      } else {
        res.status(404).json({ error: 'Workflow not found' });
      }
    });

    this.app.get('/api/agents', (req, res) => {
      const agents = Array.from(this.pipeline.agents.values()).map(agent => agent.getStatus());
      res.json(agents);
    });

    this.app.post('/api/agents/:agentId/message', async (req, res) => {
      try {
        const agent = this.pipeline.agents.get(req.params.agentId);
        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        
        const message = req.body;
        const response = await agent.processMessage(message);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/tools', (req, res) => {
      res.json(this.toolRegistry.listTools());
    });

    this.app.post('/api/tools/:toolName/execute', async (req, res) => {
      try {
        const result = await this.toolRegistry.executeTool(req.params.toolName, req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve the UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui/code_review.html'));
    });
    
    this.app.get('/code-review', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui/code_review.html'));
    });
    
    // Fallback route
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui/code_review.html'));
    });
  }

  setupPipelineEventForwarding() {
    // Forward pipeline events to ALL WebSocket clients
    this.pipeline.on('task_submitted', (task) => {
      console.log('Broadcasting task_submitted:', task.id);
      this.io.emit('task_submitted', task);
    });

    this.pipeline.on('task_started', (task) => {
      console.log('Broadcasting task_started:', task.id);
      this.io.emit('task_started', task);
    });

    this.pipeline.on('task_completed', (task) => {
      console.log('Broadcasting task_completed:', task.id);
      this.io.emit('task_completed', task);
    });

    this.pipeline.on('task_failed', (task) => {
      console.log('Broadcasting task_failed:', task.id);
      this.io.emit('task_failed', task);
    });

    this.pipeline.on('workflow_completed', (workflow) => {
      console.log('Broadcasting workflow_completed:', workflow.id);
      this.io.emit('workflow_completed', workflow);
    });

    this.pipeline.on('workflow_failed', (workflow) => {
      console.log('Broadcasting workflow_failed:', workflow.id);
      this.io.emit('workflow_failed', workflow);
    });

    this.pipeline.on('agent_message', (message) => {
      this.io.emit('agent_message', message);
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Send initial status
      socket.emit('status', this.pipeline.getSystemStatus());

      // Handle client requests
      socket.on('get_status', () => {
        socket.emit('status', this.pipeline.getSystemStatus());
      });

      socket.on('submit_task', async (data) => {
        try {
          const taskId = await this.pipeline.submitTask(data.task, data.priority);
          socket.emit('task_submitted', { task_id: taskId, task: data.task });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('execute_workflow', async (data) => {
        try {
          const result = await this.pipeline.executeWorkflow(data.workflow, data.context);
          socket.emit('workflow_completed', result);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('send_message', async (data) => {
        try {
          const agent = this.pipeline.agents.get(data.agent_id);
          if (agent) {
            const response = await agent.processMessage(data.message);
            socket.emit('message_response', response);
          } else {
            socket.emit('error', { message: 'Agent not found' });
          }
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Agentic Pipeline Server running on port ${this.port}`);
      console.log(`UI available at http://localhost:${this.port}`);
    });
  }

  async shutdown() {
    await this.pipeline.shutdown();
    this.server.close();
  }
}

export default AgenticPipelineServer;
