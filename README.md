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

#### Submit Code for Review
```bash
curl -X POST http://localhost:3000/api/code-review \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log('Hello World');",
    "language": "javascript",
    "analysis_type": "full"
  }'
```

#### Quick Bug Detection
```bash
curl -X POST http://localhost:3000/api/bugs/detect \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def phgjhmrint(text): print(text)",
    "language": "python",
    "severity_threshold": "medium"
  }'
```

#### Get Security Analysis
```bash
curl -X POST http://localhost:3000/api/security/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SELECT * FROM users WHERE id = " + userInput",
    "language": "sql",
    "scan_types": ["sql_injection", "xss"]
  }'
```

#### Code Quality Assessment
```bash
curl -X POST http://localhost:3000/api/quality/assess \
  -H "Content-Type: application/json" \
  -d '{
    "code": "for(var i=0;i<10;i++){console.log(i)}",
    "language": "javascript",
    "metrics": ["complexity", "maintainability", "performance"]
  }'
```

## 🏗️ Architecture

### Code Analysis Engine
- Multi-language syntax parsing
- Pattern recognition algorithms
- Real-time bug detection
- Cross-language vulnerability scanning

### Bug Detection System
- Static code analysis
- Runtime error prediction
- Security vulnerability scanning
- Performance issue identification
- Typo and syntax error detection

### Quality Assessment Framework
- Code complexity metrics
- Maintainability scoring
- Best practices validation
- Performance benchmarking

### Review Pipeline
- Multi-stage analysis workflow
- Priority-based bug triage
- Automated severity classification
- Real-time progress tracking

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
- Bug detection accuracy rates
- Code quality scores
- Security vulnerability findings
- Performance issue identification
- Language-specific analysis statistics
- False positive rates
- Review processing times

### Real-time Updates
- WebSocket connections for live updates
- Event-driven notifications
- Status change alerts
- Progress tracking

## 🛠️ Development

### Project Structure
```
src/
├── agents/          # AI agents for code analysis and bug detection
├── memory/          # Memory system for persistent analysis storage
├── tools/           # Tool registry for analysis utilities
├── pipeline/        # Task queue and workflow orchestration
├── ui/              # Web-based code review interface
├── demo/            # Demo scenarios and test cases
├── index.js         # Main application entry point
└── server.js        # HTTP server and API endpoints
```

### Adding New Language Support
1. Create new agent in `src/agents/` for the language
2. Add language-specific detection logic to the agent
3. Update UI language selector in `src/ui/`
4. Add demo test cases in `src/demo/`
5. Register agent with the pipeline system

### Adding New Bug Detectors
1. Implement detection logic in appropriate agent in `src/agents/`
2. Add any required analysis tools to `src/tools/`
3. Create test scenarios in `src/demo/`
4. Update agent configuration in `src/pipeline/`
5. Test with the web interface in `src/ui/`

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
