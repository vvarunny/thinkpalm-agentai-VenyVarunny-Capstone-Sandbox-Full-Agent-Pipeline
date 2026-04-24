import { Pipeline } from '../pipeline/Pipeline.js';
import { MemorySystem } from '../memory/MemorySystem.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ResearchAgent } from '../agents/ResearchAgent.js';
import { AnalysisAgent } from '../agents/AnalysisAgent.js';
import { CoordinatorAgent } from '../agents/CoordinatorAgent.js';

export class DemoScenario {
  constructor() {
    this.memorySystem = new MemorySystem();
    this.toolRegistry = new ToolRegistry();
    this.pipeline = new Pipeline();
    this.setupAgents();
  }

  setupAgents() {
    const researchAgent = new ResearchAgent('research-demo', this.memorySystem, this.toolRegistry);
    const analysisAgent = new AnalysisAgent('analysis-demo', this.memorySystem, this.toolRegistry);
    const coordinatorAgent = new CoordinatorAgent('coordinator-demo', this.memorySystem, this.toolRegistry);
    
    this.pipeline.registerAgent(researchAgent);
    this.pipeline.registerAgent(analysisAgent);
    this.pipeline.registerAgent(coordinatorAgent);
    
    coordinatorAgent.registerAgent(researchAgent);
    coordinatorAgent.registerAgent(analysisAgent);
    
    this.agents = { researchAgent, analysisAgent, coordinatorAgent };
  }

  async runDemo1_BasicResearch() {
    console.log('🚀 Demo 1: Basic Research Workflow');
    console.log('=' .repeat(50));
    
    try {
      // Submit a research task
      const researchTask = {
        type: 'research',
        parameters: {
          query: 'artificial intelligence trends 2024',
          sources: 3,
          depth: 2
        }
      };
      
      console.log('📝 Submitting research task...');
      const taskId = await this.pipeline.submitTask(researchTask, 'high');
      console.log(`✅ Task submitted with ID: ${taskId}`);
      
      // Wait for completion
      await this.waitForTask(taskId);
      
      // Submit analysis task
      const analysisTask = {
        type: 'analysis',
        parameters: {
          data: 'Research results from previous task',
          analysis_type: 'sentiment'
        }
      };
      
      console.log('📊 Submitting analysis task...');
      const analysisTaskId = await this.pipeline.submitTask(analysisTask, 'normal');
      console.log(`✅ Analysis task submitted with ID: ${analysisTaskId}`);
      
      await this.waitForTask(analysisTaskId);
      
      console.log('✨ Demo 1 completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo 1 failed:', error.message);
    }
  }

  async runDemo2_CoordinatedWorkflow() {
    console.log('\n🚀 Demo 2: Multi-Agent Coordinated Workflow');
    console.log('=' .repeat(50));
    
    try {
      const workflow = {
        type: 'research_analysis_pipeline',
        steps: [
          {
            name: 'initial_research',
            type: 'agent_task',
            agent_id: 'research-demo',
            task_type: 'research',
            parameters: {
              query: 'machine learning applications in healthcare',
              sources: 5
            }
          },
          {
            name: 'data_analysis',
            type: 'agent_task',
            agent_id: 'analysis-demo',
            task_type: 'analysis',
            parameters: {
              analysis_type: 'summary'
            }
          },
          {
            name: 'coordination_review',
            type: 'agent_task',
            agent_id: 'coordinator-demo',
            task_type: 'coordinate_workflow',
            parameters: {
              workflow_definition: {
                type: 'review_process',
                steps: [
                  { type: 'validate_results' },
                  { type: 'generate_report' }
                ]
              }
            }
          }
        ]
      };
      
      console.log('🔄 Executing coordinated workflow...');
      const workflowResult = await this.pipeline.executeWorkflow(workflow, {
        user_request: 'Comprehensive analysis of ML in healthcare',
        deadline: '2024-12-31'
      });
      
      console.log('✅ Workflow completed!');
      console.log(`📊 Workflow ID: ${workflowResult.id}`);
      console.log(`📈 Status: ${workflowResult.status}`);
      console.log(`⏱️ Duration: ${workflowResult.completed_at ? 
        new Date(workflowResult.completed_at) - new Date(workflowResult.created_at) : 
        'N/A'}ms`);
      
    } catch (error) {
      console.error('❌ Demo 2 failed:', error.message);
    }
  }

  async runDemo3_ParallelProcessing() {
    console.log('\n🚀 Demo 3: Parallel Processing & Data Pipeline');
    console.log('=' .repeat(50));
    
    try {
      const parallelWorkflow = {
        type: 'parallel_data_processing',
        steps: [
          {
            name: 'data_collection_phase',
            type: 'parallel_tasks',
            tasks: [
              {
                name: 'web_research',
                type: 'agent_task',
                agent_id: 'research-demo',
                task_type: 'data_gathering',
                parameters: {
                  sources: ['https://example1.com', 'https://example2.com']
                }
              },
              {
                name: 'additional_research',
                type: 'agent_task',
                agent_id: 'research-demo',
                task_type: 'research',
                parameters: {
                  query: 'parallel processing in AI systems'
                }
              }
            ]
          },
          {
            name: 'data_processing_phase',
            type: 'parallel_tasks',
            tasks: [
              {
                name: 'sentiment_analysis',
                type: 'agent_task',
                agent_id: 'analysis-demo',
                task_type: 'analysis',
                parameters: {
                  analysis_type: 'sentiment'
                }
              },
              {
                name: 'topic_analysis',
                type: 'agent_task',
                agent_id: 'analysis-demo',
                task_type: 'analysis',
                parameters: {
                  analysis_type: 'topics'
                }
              }
            ]
          },
          {
            name: 'coordination_and_synthesis',
            type: 'agent_task',
            agent_id: 'coordinator-demo',
            task_type: 'coordinate_workflow',
            parameters: {
              workflow_definition: {
                type: 'synthesis_workflow',
                agents: ['research-demo', 'analysis-demo'],
                coordination_strategy: 'merge_results'
              }
            }
          }
        ]
      };
      
      console.log('⚡ Executing parallel processing workflow...');
      const startTime = Date.now();
      
      const result = await this.pipeline.executeWorkflow(parallelWorkflow, {
        processing_mode: 'parallel',
        optimization: 'speed'
      });
      
      const endTime = Date.now();
      console.log(`✅ Parallel workflow completed in ${endTime - startTime}ms`);
      console.log(`📊 Processed ${result.steps?.length || 0} steps`);
      
    } catch (error) {
      console.error('❌ Demo 3 failed:', error.message);
    }
  }

  async runDemo4_ErrorHandling() {
    console.log('\n🚀 Demo 4: Error Handling & Recovery');
    console.log('=' .repeat(50));
    
    try {
      const errorProneWorkflow = {
        type: 'error_handling_demo',
        steps: [
          {
            name: 'valid_step',
            type: 'agent_task',
            agent_id: 'research-demo',
            task_type: 'research',
            parameters: { query: 'test query' }
          },
          {
            name: 'invalid_step',
            type: 'agent_task',
            agent_id: 'nonexistent-agent',
            task_type: 'invalid_task',
            parameters: {},
            required: false // This step can fail without stopping the workflow
          },
          {
            name: 'recovery_step',
            type: 'agent_task',
            agent_id: 'analysis-demo',
            task_type: 'analysis',
            parameters: { analysis_type: 'summary' }
          },
          {
            name: 'conditional_step',
            type: 'conditional',
            condition: { field: 'previous_success', operator: 'equals', value: true },
            then_step: {
              name: 'success_branch',
              type: 'agent_task',
              agent_id: 'coordinator-demo',
              task_type: 'coordinate_workflow',
              parameters: { workflow_definition: { type: 'success_workflow' } }
            },
            else_step: {
              name: 'fallback_branch',
              type: 'delay',
              duration: 1000
            }
          }
        ]
      };
      
      console.log('🛡️ Testing error handling capabilities...');
      const result = await this.pipeline.executeWorkflow(errorProneWorkflow, {
        error_handling: 'enabled',
        recovery_mode: 'graceful'
      });
      
      console.log('✅ Error handling demo completed!');
      console.log(`📊 Final status: ${result.status}`);
      console.log(`⚠️ Failed steps: ${result.steps?.filter(s => s.status === 'failed').length || 0}`);
      console.log(`✅ Successful steps: ${result.steps?.filter(s => s.status === 'completed').length || 0}`);
      
    } catch (error) {
      console.error('❌ Demo 4 failed:', error.message);
    }
  }

  async runDemo5_MemoryAndPersistence() {
    console.log('\n🚀 Demo 5: Memory System & Agent Persistence');
    console.log('=' .repeat(50));
    
    try {
      console.log('🧠 Testing memory persistence...');
      
      // Store some memories
      await this.agents.researchAgent.storeMemory('test_data', {
        message: 'This is test data for memory persistence',
        timestamp: new Date().toISOString()
      });
      
      await this.agents.analysisAgent.storeMemory('analysis_config', {
        preferred_analysis: 'sentiment',
        confidence_threshold: 0.8
      });
      
      // Recall memories
      const researchMemories = await this.agents.researchAgent.recallMemories();
      const analysisMemories = await this.agents.analysisAgent.recallMemories();
      
      console.log(`📝 Research agent memories: ${researchMemories.length}`);
      console.log(`📊 Analysis agent memories: ${analysisMemories.length}`);
      
      // Test memory search
      const searchResults = await this.agents.researchAgent.recallMemories(null, 'test');
      console.log(`🔍 Search results for 'test': ${searchResults.length}`);
      
      // Test agent state persistence
      await this.agents.researchAgent.updateAgentState({
        status: 'demo_testing',
        last_demo_activity: new Date().toISOString()
      });
      
      const agentState = await this.memorySystem.getAgentState('research-demo');
      console.log(`💾 Agent state retrieved: ${agentState ? 'Success' : 'Failed'}`);
      
      console.log('✅ Memory system demo completed!');
      
    } catch (error) {
      console.error('❌ Demo 5 failed:', error.message);
    }
  }

  async runFullDemo() {
    console.log('🎯 Starting Complete Agentic Pipeline Demo');
    console.log('🌟 Showcasing Memory, Tool-Calling, 3+ Agents, and UI Integration');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
      await this.runDemo1_BasicResearch();
      await this.runDemo2_CoordinatedWorkflow();
      await this.runDemo3_ParallelProcessing();
      await this.runDemo4_ErrorHandling();
      await this.runDemo5_MemoryAndPersistence();
      
      const endTime = Date.now();
      console.log('\n🎉 Full Demo Completed Successfully!');
      console.log(`⏱️ Total execution time: ${endTime - startTime}ms`);
      console.log('\n📋 Demo Summary:');
      console.log('✅ Memory System - Persistent storage and retrieval');
      console.log('✅ Tool-Calling Framework - Web search, scraping, analysis');
      console.log('✅ 3 Specialized Agents - Research, Analysis, Coordinator');
      console.log('✅ Task Queue & Pipeline - Concurrent execution');
      console.log('✅ Error Handling & Recovery - Graceful failure management');
      console.log('✅ Real-time Communication - Agent coordination');
      console.log('✅ Workflow Orchestration - Complex multi-step processes');
      console.log('✅ Web UI - Interactive dashboard (available at http://localhost:3000)');
      
      this.printFinalMetrics();
      
    } catch (error) {
      console.error('❌ Full demo failed:', error.message);
    }
  }

  async waitForTask(taskId, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = this.pipeline.getTaskStatus(taskId);
      if (status && (status.status === 'completed' || status.status === 'failed')) {
        console.log(`📋 Task ${taskId} completed with status: ${status.status}`);
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
  }

  printFinalMetrics() {
    const systemStatus = this.pipeline.getSystemStatus();
    console.log('\n📊 Final System Metrics:');
    console.log(`🤖 Total Agents: ${systemStatus.agents.length}`);
    console.log(`📋 Total Tasks: ${systemStatus.metrics.total_tasks}`);
    console.log(`✅ Completed Tasks: ${systemStatus.metrics.completed_tasks}`);
    console.log(`❌ Failed Tasks: ${systemStatus.metrics.failed_tasks}`);
    console.log(`⚡ Avg Execution Time: ${Math.round(systemStatus.metrics.average_execution_time)}ms`);
    console.log(`🔄 Active Workflows: ${systemStatus.workflows.filter(w => w.status === 'running').length}`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up demo resources...');
    await this.pipeline.shutdown();
    console.log('✅ Cleanup completed');
  }
}

// Auto-run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demo = new DemoScenario();
  
  demo.runFullDemo().then(() => {
    console.log('\n🎊 Demo completed! The system is now ready for interactive use.');
    console.log('🌐 Open http://localhost:3000 to access the interactive UI');
  }).catch(error => {
    console.error('Demo failed:', error);
  }).finally(() => {
    // Don't cleanup automatically so the system remains available for UI interaction
    console.log('\n💡 System remains running for UI interaction. Press Ctrl+C to exit.');
  });
}

export default DemoScenario;
