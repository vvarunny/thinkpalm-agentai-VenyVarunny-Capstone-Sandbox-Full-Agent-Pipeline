import { BaseAgent } from './BaseAgent.js';

export class ResearchAgent extends BaseAgent {
  constructor(id, memorySystem, toolRegistry) {
    super(id, 'Research Agent', 'research', memorySystem, toolRegistry);
    this.capabilities = ['web_search', 'web_scrape', 'data_collection', 'information_synthesis'];
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'research_request':
        return await this.handleResearchRequest(message);
      case 'data_collection':
        return await this.handleDataCollection(message);
      default:
        return await super.handleMessage(message);
    }
  }

  async performTask(task) {
    switch (task.type) {
      case 'research':
        return await this.performResearch(task);
      case 'data_gathering':
        return await this.performDataGathering(task);
      default:
        return await super.performTask(task);
    }
  }

  async handleResearchRequest(message) {
    const { query, sources, depth = 1 } = message.content;
    
    try {
      const searchResults = await this.useTool('web_search', { 
        query, 
        limit: sources || 5 
      });

      const researchData = {
        query,
        search_results: searchResults.results,
        detailed_content: [],
        analysis: null,
        timestamp: new Date().toISOString()
      };

      // Scrape detailed content from top results
      for (const result of searchResults.results.slice(0, Math.min(depth, 3))) {
        try {
          const scrapedContent = await this.useTool('web_scrape', { 
            url: result.url 
          });
          researchData.detailed_content.push(scrapedContent);
        } catch (error) {
          console.warn(`Failed to scrape ${result.url}: ${error.message}`);
        }
      }

      // Analyze the collected content
      const allText = researchData.detailed_content.map(c => c.content).join(' ');
      if (allText.length > 100) {
        researchData.analysis = await this.useTool('text_analysis', {
          text: allText,
          analysis_type: 'summary'
        });
      }

      await this.storeMemory('research_result', researchData, {
        query,
        sources_count: researchData.detailed_content.length
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'research_response',
        content: researchData,
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

  async handleDataCollection(message) {
    const { targets, data_type, extraction_config } = message.content;
    
    try {
      const collectedData = [];
      
      for (const target of targets) {
        try {
          const data = await this.collectFromTarget(target, data_type, extraction_config);
          collectedData.push(data);
        } catch (error) {
          console.warn(`Failed to collect from ${target}: ${error.message}`);
        }
      }

      const result = {
        targets,
        data_type,
        collected_data: collectedData,
        summary: {
          total_targets: targets.length,
          successful_collections: collectedData.length,
          timestamp: new Date().toISOString()
        }
      };

      await this.storeMemory('data_collection', result, {
        data_type,
        targets_count: targets.length
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'data_collection_response',
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

  async performResearch(task) {
    const { query, requirements = {} } = task;
    
    const researchPlan = await this.createResearchPlan(query, requirements);
    
    const results = {
      query,
      plan: researchPlan,
      findings: [],
      sources: [],
      timestamp: new Date().toISOString()
    };

    for (const step of researchPlan.steps) {
      try {
        const stepResult = await this.executeResearchStep(step);
        results.findings.push(stepResult);
        if (stepResult.sources) {
          results.sources.push(...stepResult.sources);
        }
      } catch (error) {
        results.findings.push({
          step: step.description,
          error: error.message,
          status: 'failed'
        });
      }
    }

    await this.storeMemory('research_task', results, {
      query,
      steps_count: researchPlan.steps.length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: results,
      timestamp: new Date().toISOString()
    };
  }

  async performDataGathering(task) {
    const { sources, schema, extraction_rules } = task;
    
    const gatheredData = {
      sources: sources,
      data: [],
      schema: schema,
      extraction_rules: extraction_rules,
      metadata: {
        total_sources: sources.length,
        successful_extractions: 0,
        failed_extractions: 0,
        timestamp: new Date().toISOString()
      }
    };

    for (const source of sources) {
      try {
        const data = await this.extractDataFromSource(source, schema, extraction_rules);
        gatheredData.data.push(data);
        gatheredData.metadata.successful_extractions++;
      } catch (error) {
        gatheredData.metadata.failed_extractions++;
        console.warn(`Failed to extract from ${source}: ${error.message}`);
      }
    }

    await this.storeMemory('data_gathering', gatheredData, {
      sources_count: sources.length,
      success_rate: gatheredData.metadata.successful_extractions / sources.length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: gatheredData,
      timestamp: new Date().toISOString()
    };
  }

  async createResearchPlan(query, requirements) {
    return {
      query,
      requirements,
      steps: [
        { type: 'search', description: 'Initial web search', query: query },
        { type: 'scrape', description: 'Extract detailed content', depth: requirements.depth || 2 },
        { type: 'analyze', description: 'Analyze collected information' }
      ]
    };
  }

  async executeResearchStep(step) {
    switch (step.type) {
      case 'search':
        return await this.useTool('web_search', { query: step.query });
      case 'scrape':
        // Implementation would depend on previous step results
        return { status: 'scraped', content: 'Mock scraped content' };
      case 'analyze':
        return await this.useTool('text_analysis', { 
          text: 'Mock text for analysis', 
          analysis_type: 'summary' 
        });
      default:
        throw new Error(`Unknown research step: ${step.type}`);
    }
  }

  async collectFromTarget(target, dataType, config) {
    switch (dataType) {
      case 'web_content':
        return await this.useTool('web_scrape', { url: target });
      case 'search_results':
        return await this.useTool('web_search', { query: target });
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  async extractDataFromSource(source, schema, rules) {
    // Mock data extraction - in real implementation, would use schema and rules
    return {
      source,
      data: { content: 'Mock extracted data', timestamp: new Date().toISOString() },
      schema,
      extraction_timestamp: new Date().toISOString()
    };
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
