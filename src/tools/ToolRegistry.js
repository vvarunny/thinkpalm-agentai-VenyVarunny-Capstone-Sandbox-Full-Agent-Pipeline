import axios from 'axios';
import * as cheerio from 'cheerio';

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.registerTool('web_search', {
      description: 'Search the web for information',
      parameters: {
        query: { type: 'string', required: true },
        limit: { type: 'number', default: 10 }
      },
      execute: async (params) => {
        // Mock web search - in real implementation, use a search API
        return {
          results: [
            { title: `Search result for: ${params.query}`, url: 'https://example.com', snippet: `This is a mock result for ${params.query}` }
          ],
          query: params.query,
          timestamp: new Date().toISOString()
        };
      }
    });

    this.registerTool('web_scrape', {
      description: 'Scrape content from a web page',
      parameters: {
        url: { type: 'string', required: true },
        selector: { type: 'string', default: 'body' }
      },
      execute: async (params) => {
        try {
          const response = await axios.get(params.url);
          const $ = cheerio.load(response.data);
          const content = $(params.selector).text().trim();
          
          return {
            url: params.url,
            content: content.substring(0, 5000), // Limit content length
            title: $('title').text(),
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          throw new Error(`Failed to scrape ${params.url}: ${error.message}`);
        }
      }
    });

    this.registerTool('text_analysis', {
      description: 'Analyze text for sentiment, entities, and key topics',
      parameters: {
        text: { type: 'string', required: true },
        analysis_type: { type: 'string', default: 'sentiment', enum: ['sentiment', 'entities', 'topics', 'summary'] }
      },
      execute: async (params) => {
        const text = params.text;
        
        // Mock analysis - in real implementation, use NLP APIs
        const analysis = {
          sentiment: text.length > 100 ? 'positive' : 'neutral',
          entities: this.extractEntities(text),
          topics: this.extractTopics(text),
          summary: text.substring(0, 200) + '...',
          word_count: text.split(/\s+/).length,
          timestamp: new Date().toISOString()
        };

        return analysis[params.analysis_type] || analysis;
      }
    });

    this.registerTool('data_transform', {
      description: 'Transform and process data',
      parameters: {
        data: { type: 'any', required: true },
        operation: { type: 'string', required: true, enum: ['filter', 'map', 'reduce', 'sort', 'group'] },
        config: { type: 'object', default: {} }
      },
      execute: async (params) => {
        const { data, operation, config } = params;
        
        switch (operation) {
          case 'filter':
            return data.filter(item => this.evaluateCondition(item, config.condition));
          case 'map':
            return data.map(item => this.applyTransform(item, config.transform));
          case 'sort':
            return data.sort((a, b) => this.compareValues(a, b, config.key));
          case 'group':
            return this.groupData(data, config.key);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }
    });

    this.registerTool('file_operations', {
      description: 'Perform file operations',
      parameters: {
        operation: { type: 'string', required: true, enum: ['read', 'write', 'list', 'delete'] },
        path: { type: 'string', required: true },
        content: { type: 'string' }
      },
      execute: async (params) => {
        // Mock file operations - in real implementation, use fs module
        return {
          operation: params.operation,
          path: params.path,
          success: true,
          timestamp: new Date().toISOString(),
          message: `Mock ${params.operation} operation completed`
        };
      }
    });
  }

  registerTool(name, tool) {
    this.tools.set(name, tool);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  listTools() {
    return Array.from(this.tools.keys()).map(name => ({
      name,
      description: this.tools.get(name).description,
      parameters: this.tools.get(name).parameters
    }));
  }

  async executeTool(name, params) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Validate parameters
    this.validateParameters(tool.parameters, params);

    try {
      return await tool.execute(params);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }

  validateParameters(schema, params) {
    for (const [key, config] of Object.entries(schema)) {
      if (config.required && !(key in params)) {
        throw new Error(`Required parameter missing: ${key}`);
      }
    }
  }

  extractEntities(text) {
    // Simple entity extraction - mock implementation
    const words = text.split(/\s+/);
    return words.filter(word => word.length > 3 && word[0] === word[0].toUpperCase()).slice(0, 5);
  }

  extractTopics(text) {
    // Simple topic extraction - mock implementation
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = text.toLowerCase().split(/\s+/);
    const filtered = words.filter(word => !commonWords.includes(word) && word.length > 3);
    return [...new Set(filtered)].slice(0, 5);
  }

  evaluateCondition(item, condition) {
    // Simple condition evaluation - mock implementation
    return true;
  }

  applyTransform(item, transform) {
    // Simple transform application - mock implementation
    return item;
  }

  compareValues(a, b, key) {
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  }

  groupData(data, key) {
    return data.reduce((groups, item) => {
      const groupKey = item[key];
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
      return groups;
    }, {});
  }
}
