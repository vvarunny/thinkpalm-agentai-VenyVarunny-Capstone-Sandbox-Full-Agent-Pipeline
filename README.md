# 🤖 Agentic Pipeline System

A complete end-to-end agentic pipeline featuring memory, tool-calling, multiple specialized agents, and an interactive web UI.

## 🌟 Features

### Core Components
- **Memory System**: Persistent SQLite-based storage for agent memories and states
- **Tool-Calling Framework**: Extensible registry of tools (web search, scraping, analysis, data processing)
- **3 Specialized Agents**: Research Agent, Analysis Agent, and Coordinator Agent
- **Task Queue & Pipeline**: Concurrent task execution with priority support
- **Error Handling & Recovery**: Graceful failure management and retry mechanisms
- **Real-time Communication**: WebSocket-based agent coordination
- **Interactive Web UI**: React-based dashboard for monitoring and control

### Agent Capabilities

#### Research Agent
- Web search and information gathering
- Content scraping from web pages
- Data collection from multiple sources
- Information synthesis and summarization

#### Analysis Agent
- Text analysis (sentiment, entities, topics, summary)
- Data processing and transformation
- Pattern recognition and insight generation
- Statistical analysis and trend detection

#### Coordinator Agent
- Task orchestration and workflow management
- Multi-agent coordination
- Resource allocation and load balancing
- Workflow execution monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd agentic-pipeline

# Install dependencies
npm install

# Build the UI
npm run build

# Start the server
npm start
```

### Access the System

- **Web UI**: http://localhost:3000
- **API Status**: http://localhost:3000/api/status
- **Live Demo**: `npm run demo`

## 📖 Usage Guide

### Interactive UI

1. **Agents Tab**: Monitor agent status, capabilities, and send direct messages
2. **Tasks Tab**: View task queue status and execution metrics
3. **Workflows Tab**: Monitor active and completed workflows
4. **Controls Tab**: Submit tasks and execute workflows
5. **Logs Tab**: Real-time system activity logs

### API Usage

#### Submit a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "type": "research",
      "parameters": {
        "query": "artificial intelligence trends 2024"
      }
    },
    "priority": "high"
  }'
```

#### Execute a Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "type": "research_analysis",
      "steps": [
        {
          "name": "research",
          "type": "agent_task",
          "agent_id": "research-001",
          "task_type": "research",
          "parameters": {"query": "AI trends"}
        },
        {
          "name": "analysis",
          "type": "agent_task", 
          "agent_id": "analysis-001",
          "task_type": "analysis",
          "parameters": {"analysis_type": "summary"}
        }
      ]
    }
  }'
```

#### Send Message to Agent
```bash
curl -X POST http://localhost:3000/api/agents/research-001/message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "research_request",
    "content": {
      "query": "machine learning applications",
      "sources": 5
    }
  }'
```

## 🏗️ Architecture

### Memory System
- SQLite database for persistent storage
- Agent-specific memory isolation
- Search and recall capabilities
- State persistence across sessions

### Tool Registry
- Modular tool system
- Parameter validation
- Error handling and logging
- Extensible architecture

### Agent Communication
- Event-driven messaging
- WebSocket real-time updates
- Message routing and filtering
- Cross-agent coordination

### Pipeline Execution
- Priority-based task queuing
- Concurrent execution with limits
- Workflow orchestration
- Progress tracking and monitoring

## 🧪 Demo Scenarios

The system includes comprehensive demo scenarios showcasing all features:

### Demo 1: Basic Research Workflow
- Research task submission and execution
- Analysis of research results
- Memory persistence verification

### Demo 2: Multi-Agent Coordination
- Complex workflow with multiple agents
- Coordinator agent orchestration
- Inter-agent communication

### Demo 3: Parallel Processing
- Concurrent task execution
- Data pipeline processing
- Performance optimization

### Demo 4: Error Handling
- Graceful failure management
- Recovery mechanisms
- Conditional workflow execution

### Demo 5: Memory & Persistence
- Memory storage and retrieval
- Agent state management
- Search functionality

Run the demo: `npm run demo`

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port
DB_PATH=./memory.db          # SQLite database path
MAX_CONCURRENCY=5            # Maximum concurrent tasks
LOG_LEVEL=info               # Logging verbosity
```

### Agent Configuration
Each agent can be configured with:
- Custom capabilities
- Memory limits
- Tool access permissions
- Performance parameters

## 📊 Monitoring

### Metrics Available
- Agent status and performance
- Task execution statistics
- Workflow success rates
- Memory usage
- Error rates and types

### Real-time Updates
- WebSocket connections for live updates
- Event-driven notifications
- Status change alerts
- Progress tracking

## 🛠️ Development

### Project Structure
```
src/
├── agents/          # Agent implementations
├── memory/          # Memory system
├── tools/           # Tool registry
├── pipeline/        # Task queue and pipeline
├── ui/              # React web interface
├── demo/            # Demo scenarios
└── server.js        # Main server
```

### Adding New Agents
1. Extend `BaseAgent` class
2. Implement required methods
3. Register with pipeline
4. Add UI components if needed

### Adding New Tools
1. Implement tool interface
2. Register with `ToolRegistry`
3. Add parameter validation
4. Test with agents

### Building the UI
```bash
npm run build        # Production build
npm run serve        # Development server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the demo scenarios for usage examples
- Review the API documentation
- Monitor system logs for debugging
- Use the web UI for interactive testing

## 🎯 Educational Value

This project demonstrates:
- **Multi-agent systems**: Coordination between specialized AI agents
- **Memory management**: Persistent context and state management
- **Tool integration**: Extensible capability framework
- **Real-time communication**: WebSocket-based agent messaging
- **Workflow orchestration**: Complex multi-step process automation
- **Error handling**: Robust failure recovery mechanisms
- **Web integration**: Full-stack AI system with modern UI

Perfect for learning about:
- Agent-based AI architectures
- Event-driven programming
- Real-time web applications
- Database integration
- API design and implementation
- Modern JavaScript/Node.js development
