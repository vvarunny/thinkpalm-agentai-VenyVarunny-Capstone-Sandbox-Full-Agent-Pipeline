import AgenticPipelineServer from './server.js';
import DemoScenario from './demo/DemoScenario.js';

// Start the server
const server = new AgenticPipelineServer(3000);

// Optional: Run demo after server starts
setTimeout(() => {
  console.log('\n🎯 Agentic Pipeline System Started Successfully!');
  console.log('🌟 Features:');
  console.log('  ✅ Memory System - Persistent agent memories');
  console.log('  ✅ Tool-Calling Framework - Web search, scraping, analysis');
  console.log('  ✅ 3 Specialized Agents - Research, Analysis, Coordinator');
  console.log('  ✅ Task Queue & Pipeline - Concurrent execution');
  console.log('  ✅ Error Handling & Recovery');
  console.log('  ✅ Real-time Communication - WebSocket-based');
  console.log('  ✅ Interactive Web UI - React dashboard');
  console.log('\n🌐 Access the UI at: http://localhost:3000');
  console.log('📊 View API docs at: http://localhost:3000/api/status');
  console.log('\n💡 To run the demo scenario, use: npm run demo');
  console.log('🛑 To stop the server, press Ctrl+C');
}, 1000);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await server.shutdown();
  process.exit(0);
});

export default server;
