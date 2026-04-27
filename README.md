# Name : Veny Varunny
# Track : Backend Dev
# Lab name : thinkpalm-agentai-VenyVarunny-Capstone-Sandbox-Full-Agent-Pipeline



# 🔍 AI Code Review & Bug Detection System

An intelligent code analysis system featuring multi-agent bug detection, real-time triage, and interactive web-based code review interface.

## 🌟 Features

### Core Components
- **AI-Powered Bug Detection**: Advanced pattern recognition for common programming errors
- **Multi-Agent Analysis**: Specialized agents for research, analysis, and coordination
- **Real-time Code Triage**: Automatic bug severity classification and prioritization
- **Interactive Web UI**: Modern interface for code submission and analysis results
- **Memory System**: Persistent storage for analysis history and agent learning
- **WebSocket Communication**: Real-time updates and live analysis progress

### Bug Detection Capabilities

#### Security Vulnerabilities
- SQL Injection detection
- XSS (Cross-Site Scripting) identification
- CORS misconfiguration analysis
- Input validation vulnerabilities

#### Runtime Errors
- Division by zero detection
- Null reference exceptions
- Array index out of bounds
- Undefined variable usage

#### Code Quality Issues
- Syntax errors and typos
- Missing semicolons and brackets
- Function name misspellings
- Inconsistent coding patterns

#### Performance Issues
- Memory leak detection
- Inefficient loops
- Resource management problems
- Unoptimized database queries

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

- **Code Review Interface**: http://localhost:3000/code-review
- **Working Interface**: http://localhost:3000/working
- **Simple Interface**: http://localhost:3000/simple
- **API Status**: http://localhost:3000/api/status
- **Live Demo**: `npm run demo`

## 📖 Usage Guide

### Interactive UI

1. **Code Review Interface**: Submit code for comprehensive bug analysis
2. **Bug Triage Report**: View categorized bugs with severity levels
3. **Real-time Analysis**: Watch agents process code in real-time
4. **Action Plan**: Get prioritized fixes for identified issues
5. **Multiple Interfaces**: Choose between simple, working, or full review interfaces

### API Usage

#### Submit Code for Analysis
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "type": "analysis",
      "parameters": {
        "code": "console.log('Hello World');",
        "language": "javascript"
      }
    },
    "priority": "high"
  }'
```

#### Execute Code Analysis Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "type": "code_review",
      "steps": [
        {
          "name": "syntax_check",
          "type": "agent_task",
          "agent_id": "analysis-001",
          "task_type": "analysis",
          "parameters": {"analysis_type": "syntax"}
        },
        {
          "name": "security_scan",
          "type": "agent_task", 
          "agent_id": "research-001",
          "task_type": "security_analysis",
          "parameters": {"scan_type": "vulnerabilities"}
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

The system includes comprehensive demo scenarios showcasing bug detection capabilities:

### Demo 1: JavaScript Bug Detection
- Syntax error identification
- Runtime error detection
- Security vulnerability scanning
- Performance issue analysis

### Demo 2: Multi-Language Support
- JavaScript/TypeScript analysis
- Python code review
- C# bug detection
- Cross-language pattern recognition

### Demo 3: Real-time Analysis
- Live code processing
- Concurrent agent coordination
- Progress tracking
- Interactive result display

### Demo 4: Advanced Bug Triage
- Severity classification
- Priority-based fixing
- Action plan generation
- Comprehensive reporting

### Demo 5: Memory & Learning
- Analysis history storage
- Pattern learning
- Agent state persistence
- Search and recall capabilities

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
- **AI-Powered Code Analysis**: Intelligent bug detection and pattern recognition
- **Multi-Agent Systems**: Specialized agents for different analysis types
- **Real-time Processing**: Live code analysis with WebSocket updates
- **Security Scanning**: Automated vulnerability detection
- **Code Quality Assessment**: Comprehensive code review automation
- **Interactive UI**: Modern web-based code review interface
- **Memory Management**: Persistent analysis history and learning

Perfect for learning about:
- Static code analysis techniques
- Multi-agent AI architectures
- Real-time web applications
- Security vulnerability detection
- Modern JavaScript/Node.js development
- Database integration for AI systems
- WebSocket-based communication
