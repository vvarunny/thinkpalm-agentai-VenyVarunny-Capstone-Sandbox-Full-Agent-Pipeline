import AgenticPipelineServer from './server.js';

// Start the server
const server = new AgenticPipelineServer(3003);
server.start();

// Optional: Display startup message after server starts
setTimeout(() => {
  console.log('\n🎯 Bug Triage System Started Successfully!');
  console.log('🌟 Features:');
  console.log('  ✅ AI-Powered Bug Detection - Advanced pattern recognition');
  console.log('  ✅ Multi-Agent Analysis - Specialized code analysis agents');
  console.log('  ✅ Real-time Code Triage - Automatic bug classification');
  console.log('  ✅ Security Scanning - Vulnerability detection');
  console.log('  ✅ Code Quality Assessment - Maintainability analysis');
  console.log('  ✅ Memory System - Persistent analysis history');
  console.log('  ✅ Interactive Web UI - Code review interface');
  console.log('\n🌐 Access the Code Review UI at: http://localhost:3003/code-review');
  console.log('📊 View API status at: http://localhost:3003/api/status');
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
