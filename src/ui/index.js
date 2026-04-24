import React from 'react';
import ReactDOM from 'react-dom/client';
import { io } from 'socket.io-client';

class AgenticPipelineUI extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: null,
      connected: false,
      systemStatus: null,
      agents: [],
      tasks: [],
      workflows: [],
      logs: [],
      activeTab: 'agents'
    };
  }

  componentDidMount() {
    this.initializeSocket();
    this.loadInitialData();
  }

  initializeSocket() {
    const socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to server');
      this.setState({ connected: true, socket });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.setState({ connected: false });
    });

    socket.on('status', (status) => {
      this.setState({ 
        systemStatus: status,
        agents: status.agents || [],
        tasks: status.task_queue || [],
        workflows: status.workflows || []
      });
      this.updateMetrics(status);
    });

    socket.on('task_submitted', (task) => {
      this.addLog(`Task submitted: ${task.task_id}`, 'success');
      this.refreshStatus();
    });

    socket.on('task_started', (task) => {
      this.addLog(`Task started: ${task.task.id}`, 'info');
      this.refreshStatus();
    });

    socket.on('task_completed', (task) => {
      this.addLog(`Task completed: ${task.task.id}`, 'success');
      this.refreshStatus();
    });

    socket.on('task_failed', (task) => {
      this.addLog(`Task failed: ${task.task.id} - ${task.error}`, 'error');
      this.refreshStatus();
    });

    socket.on('workflow_created', (workflow) => {
      this.addLog(`Workflow created: ${workflow.id}`, 'info');
      this.refreshStatus();
    });

    socket.on('workflow_completed', (workflow) => {
      this.addLog(`Workflow completed: ${workflow.id}`, 'success');
      this.refreshStatus();
    });

    socket.on('workflow_failed', (workflow) => {
      this.addLog(`Workflow failed: ${workflow.id} - ${workflow.error}`, 'error');
      this.refreshStatus();
    });

    socket.on('agent_message', (message) => {
      this.addLog(`Agent message from ${message.sender}: ${message.type}`, 'info');
    });

    socket.on('error', (error) => {
      this.addLog(`Error: ${error.message}`, 'error');
    });
  }

  async loadInitialData() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      this.setState({ 
        systemStatus: status,
        agents: status.agents || [],
        tasks: status.task_queue || [],
        workflows: status.workflows || []
      });
      this.updateMetrics(status);
    } catch (error) {
      this.addLog(`Failed to load initial data: ${error.message}`, 'error');
    }
  }

  refreshStatus() {
    if (this.state.socket) {
      this.state.socket.emit('get_status');
    }
  }

  updateMetrics(status) {
    const metrics = status.metrics || {};
    document.getElementById('total-agents').textContent = status.agents?.length || 0;
    document.getElementById('running-tasks').textContent = status.task_queue?.running || 0;
    document.getElementById('completed-tasks').textContent = metrics.completed_tasks || 0;
    document.getElementById('active-workflows').textContent = status.workflows?.filter(w => w.status === 'running').length || 0;
  }

  addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      type
    };
    
    this.setState(prevState => ({
      logs: [...prevState.logs.slice(-50), logEntry] // Keep last 50 logs
    }));
  }

  submitTask = async () => {
    // This method is disabled - HTML validation handles this now
    console.log('React submitTask called - delegating to HTML handler');
  }

  executeWorkflow = async () => {
    // This method is disabled - HTML validation handles this now
    console.log('React executeWorkflow called - delegating to HTML handler');
  }

  getWorkflowDefinition(type, input) {
    switch (type) {
      case 'research_analysis':
        return {
          type: 'research_analysis',
          steps: [
            {
              name: 'research',
              type: 'agent_task',
              agent_id: 'research-001',
              task_type: 'research',
              parameters: { query: input }
            },
            {
              name: 'analysis',
              type: 'agent_task',
              agent_id: 'analysis-001',
              task_type: 'analysis',
              parameters: { data: 'research_result' }
            }
          ]
        };
      
      case 'data_pipeline':
        return {
          type: 'data_pipeline',
          steps: [
            {
              name: 'collection',
              type: 'agent_task',
              agent_id: 'research-001',
              task_type: 'data_gathering',
              parameters: { sources: [input] }
            },
            {
              name: 'processing',
              type: 'agent_task',
              agent_id: 'analysis-001',
              task_type: 'process_data',
              parameters: { pipeline: [{ operation: 'filter' }] }
            }
          ]
        };
      
      case 'multi_agent_coordination':
        return {
          type: 'multi_agent_coordination',
          steps: [
            {
              name: 'coordination',
              type: 'agent_task',
              agent_id: 'coordinator-001',
              task_type: 'coordinate_workflow',
              parameters: {
                workflow_definition: {
                  type: 'coordinated_research',
                  agents: ['research-001', 'analysis-001'],
                  steps: [
                    { agent_id: 'research-001', task_type: 'research' },
                    { agent_id: 'analysis-001', task_type: 'analysis' }
                  ]
                }
              }
            }
          ]
        };
      
      default:
        return { type: 'simple', steps: [] };
    }
  }

  sendMessage = async (agentId, message) => {
    if (this.state.socket) {
      this.state.socket.emit('send_message', {
        agent_id: agentId,
        message: {
          type: 'user_message',
          content: { text: message }
        }
      });
    }
  }

  renderAgents() {
    return (
      <div className="dashboard">
        {this.state.agents.map(agent => (
          <div key={agent.id} className="card">
            <h3>
              <span className={`status-indicator status-${agent.status}`}></span>
              {agent.name}
            </h3>
            <div className="agent-item">
              <h4>{agent.type} Agent</h4>
              <p><strong>ID:</strong> {agent.id}</p>
              <p><strong>Status:</strong> {agent.status}</p>
              <p><strong>Capabilities:</strong> {agent.capabilities?.join(', ') || 'N/A'}</p>
              <p><strong>Queue Length:</strong> {agent.queue_length || 0}</p>
              <div style={{ marginTop: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Send message..." 
                  id={`message-${agent.id}`}
                  style={{ 
                    width: '70%', 
                    padding: '5px', 
                    marginRight: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <button 
                  className="btn" 
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    const input = document.getElementById(`message-${agent.id}`);
                    if (input.value.trim()) {
                      this.sendMessage(agent.id, input.value);
                      input.value = '';
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderTasks() {
    return (
      <div className="dashboard">
        <div className="card">
          <h3>Task Queue Status</h3>
          {this.state.systemStatus?.task_queue && (
            <div>
              <p><strong>Queued:</strong> {this.state.systemStatus.task_queue.queued?.total || 0}</p>
              <p><strong>Running:</strong> {this.state.systemStatus.task_queue.running || 0}</p>
              <p><strong>Completed:</strong> {this.state.systemStatus.task_queue.completed || 0}</p>
              <p><strong>Failed:</strong> {this.state.systemStatus.task_queue.failed || 0}</p>
            </div>
          )}
        </div>
        
        <div className="card">
          <h3>Recent Tasks</h3>
          {this.state.systemStatus?.metrics && (
            <div>
              <p><strong>Total Tasks:</strong> {this.state.systemStatus.metrics.total_tasks || 0}</p>
              <p><strong>Completed:</strong> {this.state.systemStatus.metrics.completed_tasks || 0}</p>
              <p><strong>Failed:</strong> {this.state.systemStatus.metrics.failed_tasks || 0}</p>
              <p><strong>Avg Execution Time:</strong> {Math.round(this.state.systemStatus.metrics.average_execution_time || 0)}ms</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  renderWorkflows() {
    return (
      <div className="dashboard">
        {this.state.workflows.map(workflow => (
          <div key={workflow.id} className="card">
            <h3>
              <span className={`status-indicator status-${workflow.status}`}></span>
              Workflow: {workflow.id}
            </h3>
            <div className="workflow-item">
              <h4>{workflow.type}</h4>
              <p><strong>Status:</strong> {workflow.status}</p>
              <p><strong>Steps:</strong> {workflow.steps_count || 0}</p>
              <p><strong>Current Step:</strong> {workflow.current_step || 0}</p>
              <p><strong>Created:</strong> {new Date(workflow.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        
        {this.state.workflows.length === 0 && (
          <div className="card">
            <h3>No Active Workflows</h3>
            <p>Submit a workflow from the Controls tab to see it here.</p>
          </div>
        )}
      </div>
    );
  }

  renderControls() {
    return (
      <div>
        <div className="controls">
          <h3>Submit Task</h3>
          <div className="form-group">
            <label htmlFor="task-agent">Target Agent:</label>
            <select id="task-agent">
              <option value="research-001">Research Agent</option>
              <option value="analysis-001">Analysis Agent</option>
              <option value="coordinator-001">Coordinator Agent</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="task-type">Task Type:</label>
            <select id="task-type">
              <option value="research">Research Task</option>
              <option value="analysis">Analysis Task</option>
              <option value="workflow">Workflow Task</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="task-query">Query/Parameters:</label>
            <textarea id="task-query" rows="3" placeholder="Enter your query or task parameters..."></textarea>
          </div>
          <button className="btn" onClick={this.submitTask}>Submit Task</button>
        </div>
        
        <div className="controls">
          <h3>Execute Workflow</h3>
          <div className="form-group">
            <label htmlFor="workflow-type">Workflow Type:</label>
            <select id="workflow-type">
              <option value="research_analysis">Research & Analysis</option>
              <option value="data_pipeline">Data Pipeline</option>
              <option value="multi_agent_coordination">Multi-Agent Coordination</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="workflow-input">Input Data:</label>
            <textarea id="workflow-input" rows="3" placeholder="Enter workflow input data..."></textarea>
          </div>
          <button className="btn btn-success" onClick={this.executeWorkflow}>Execute Workflow</button>
        </div>
      </div>
    );
  }

  renderLogs() {
    return (
      <div className="logs">
        <h3>System Logs</h3>
        {this.state.logs.map((log, index) => (
          <div key={index} className={`log-entry ${log.type}`}>
            <strong>[{log.timestamp}]</strong> {log.message}
          </div>
        ))}
        
        {this.state.logs.length === 0 && (
          <div className="log-entry">
            <strong>[System]</strong> No logs yet. Start interacting with the system to see logs here.
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="metrics" id="metrics">
          <div className="metric-card">
            <h4 id="total-agents">{this.state.agents.length}</h4>
            <p>Active Agents</p>
          </div>
          <div className="metric-card">
            <h4 id="running-tasks">{this.state.systemStatus?.task_queue?.running || 0}</h4>
            <p>Running Tasks</p>
          </div>
          <div className="metric-card">
            <h4 id="completed-tasks">{this.state.systemStatus?.metrics?.completed_tasks || 0}</h4>
            <p>Completed Tasks</p>
          </div>
          <div className="metric-card">
            <h4 id="active-workflows">{this.state.workflows?.filter(w => w.status === 'running').length || 0}</h4>
            <p>Active Workflows</p>
          </div>
        </div>
        
        <div className="tabs">
          <button className={`tab ${this.state.activeTab === 'agents' ? 'active' : ''}`} 
                  onClick={() => this.setState({ activeTab: 'agents' })}>
            Agents
          </button>
          <button className={`tab ${this.state.activeTab === 'tasks' ? 'active' : ''}`} 
                  onClick={() => this.setState({ activeTab: 'tasks' })}>
            Tasks
          </button>
          <button className={`tab ${this.state.activeTab === 'workflows' ? 'active' : ''}`} 
                  onClick={() => this.setState({ activeTab: 'workflows' })}>
            Workflows
          </button>
          <button className={`tab ${this.state.activeTab === 'controls' ? 'active' : ''}`} 
                  onClick={() => this.setState({ activeTab: 'controls' })}>
            Controls
          </button>
          <button className={`tab ${this.state.activeTab === 'logs' ? 'active' : ''}`} 
                  onClick={() => this.setState({ activeTab: 'logs' })}>
            Logs
          </button>
        </div>
        
        <div className="tab-content">
          {this.state.activeTab === 'agents' && this.renderAgents()}
          {this.state.activeTab === 'tasks' && this.renderTasks()}
          {this.state.activeTab === 'workflows' && this.renderWorkflows()}
          {this.state.activeTab === 'controls' && this.renderControls()}
          {this.state.activeTab === 'logs' && this.renderLogs()}
        </div>
      </div>
    );
  }
}

// Global functions for HTML onclick handlers
window.showTab = function(tabName) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected panel
  document.getElementById(`${tabName}-panel`).classList.add('active');
  
  // Add active class to clicked tab
  event.target.classList.add('active');
};

window.submitTask = function() {
  const agentId = document.getElementById('task-agent').value;
  const taskType = document.getElementById('task-type').value;
  const query = document.getElementById('task-query').value;

  if (!query.trim()) {
    alert('Please enter a query or parameters');
    return;
  }

  const task = {
    type: taskType,
    agent_id: agentId,
    parameters: {
      query: query,
      analysis_type: 'summary'
    }
  };

  // This would be handled by React component in a full implementation
  console.log('Submitting task:', task);
  document.getElementById('task-query').value = '';
};

window.executeWorkflow = function() {
  const workflowType = document.getElementById('workflow-type').value;
  const input = document.getElementById('workflow-input').value;

  if (!input.trim()) {
    alert('Please enter workflow input data');
    return;
  }

  // This would be handled by React component in a full implementation
  console.log('Executing workflow:', { workflowType, input });
  document.getElementById('workflow-input').value = '';
};

// Initialize the React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AgenticPipelineUI />);
