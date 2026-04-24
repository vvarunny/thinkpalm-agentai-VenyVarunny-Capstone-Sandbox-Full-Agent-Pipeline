import { BaseAgent } from './BaseAgent.js';

export class AnalysisAgent extends BaseAgent {
  constructor(id, memorySystem, toolRegistry) {
    super(id, 'Analysis Agent', 'analysis', memorySystem, toolRegistry);
    this.capabilities = ['text_analysis', 'data_processing', 'pattern_recognition', 'insight_generation'];
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'analysis_request':
        return await this.handleAnalysisRequest(message);
      case 'data_processing':
        return await this.handleDataProcessing(message);
      case 'insight_request':
        return await this.handleInsightRequest(message);
      default:
        return await super.handleMessage(message);
    }
  }

  async performTask(task) {
    switch (task.type) {
      case 'analyze':
        return await this.performAnalysis(task);
      case 'process_data':
        return await this.processData(task);
      case 'generate_insights':
        return await this.generateInsights(task);
      default:
        return await super.performTask(task);
    }
  }

  async handleAnalysisRequest(message) {
    const { data, analysis_type, parameters = {} } = message.content;
    
    try {
      const analysisResults = await this.performAnalysisOnData(data, analysis_type, parameters);
      
      const result = {
        analysis_type,
        input_data_summary: this.summarizeInput(data),
        results: analysisResults,
        confidence_score: this.calculateConfidence(analysisResults),
        timestamp: new Date().toISOString()
      };

      await this.storeMemory('analysis_result', result, {
        analysis_type,
        data_size: this.getDataSize(data)
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'analysis_response',
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

  async handleDataProcessing(message) {
    const { data, operations, output_format } = message.content;
    
    try {
      let processedData = data;
      const processingSteps = [];

      for (const operation of operations) {
        const stepResult = await this.useTool('data_transform', {
          data: processedData,
          operation: operation.type,
          config: operation.config || {}
        });
        
        processedData = stepResult;
        processingSteps.push({
          operation: operation.type,
          config: operation.config,
          result_count: Array.isArray(stepResult) ? stepResult.length : 1
        });
      }

      const result = {
        original_data_summary: this.summarizeInput(data),
        processed_data: processedData,
        processing_steps: processingSteps,
        output_format: output_format || 'same',
        timestamp: new Date().toISOString()
      };

      await this.storeMemory('data_processing', result, {
        operations_count: operations.length,
        final_data_size: this.getDataSize(processedData)
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'data_processing_response',
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

  async handleInsightRequest(message) {
    const { data, insight_types, context } = message.content;
    
    try {
      const insights = await this.generateInsightsFromData(data, insight_types, context);
      
      const result = {
        insights: insights,
        data_summary: this.summarizeInput(data),
        confidence_scores: insights.map(insight => insight.confidence),
        actionable_items: insights.filter(i => i.actionable).map(i => i.recommendation),
        timestamp: new Date().toISOString()
      };

      await this.storeMemory('insights_generated', result, {
        insight_types,
        insights_count: insights.length
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'insight_response',
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

  async performAnalysis(task) {
    const { data, analysis_config } = task;
    
    const analysisPlan = this.createAnalysisPlan(data, analysis_config);
    
    const results = {
      task_id: task.id,
      analysis_plan: analysisPlan,
      findings: [],
      summary: null,
      timestamp: new Date().toISOString()
    };

    for (const analysis of analysisPlan.analyses) {
      try {
        const analysisResult = await this.performAnalysisOnData(data, analysis.type, analysis.parameters);
        results.findings.push({
          type: analysis.type,
          result: analysisResult,
          confidence: this.calculateConfidence(analysisResult)
        });
      } catch (error) {
        results.findings.push({
          type: analysis.type,
          error: error.message,
          status: 'failed'
        });
      }
    }

    // Generate summary of all findings
    results.summary = this.generateAnalysisSummary(results.findings);

    await this.storeMemory('analysis_task', results, {
      analyses_count: analysisPlan.analyses.length,
      successful_analyses: results.findings.filter(f => !f.error).length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: results,
      timestamp: new Date().toISOString()
    };
  }

  async processData(task) {
    const { data, pipeline, output_requirements } = task;
    
    const processingResults = {
      task_id: task.id,
      pipeline: pipeline,
      stages: [],
      final_output: null,
      metadata: {
        input_size: this.getDataSize(data),
        processing_time: null,
        success_rate: 0
      },
      timestamp: new Date().toISOString()
    };

    let processedData = data;
    const startTime = Date.now();

    for (const stage of pipeline) {
      try {
        const stageResult = await this.useTool('data_transform', {
          data: processedData,
          operation: stage.operation,
          config: stage.config || {}
        });
        
        processedData = stageResult;
        processingResults.stages.push({
          stage_name: stage.name,
          operation: stage.operation,
          success: true,
          output_size: this.getDataSize(stageResult)
        });
      } catch (error) {
        processingResults.stages.push({
          stage_name: stage.name,
          operation: stage.operation,
          success: false,
          error: error.message
        });
        break;
      }
    }

    processingResults.final_output = processedData;
    processingResults.metadata.processing_time = Date.now() - startTime;
    processingResults.metadata.success_rate = processingResults.stages.filter(s => s.success).length / processingResults.stages.length;

    await this.storeMemory('data_processing_task', processingResults, {
      pipeline_stages: pipeline.length,
      success_rate: processingResults.metadata.success_rate
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: processingResults,
      timestamp: new Date().toISOString()
    };
  }

  async generateInsights(task) {
    const { data, insight_config, context } = task;
    
    const insights = {
      task_id: task.id,
      insights: [],
      patterns: [],
      recommendations: [],
      confidence_scores: [],
      timestamp: new Date().toISOString()
    };

    const insightTypes = insight_config.types || ['trends', 'anomalies', 'correlations'];

    for (const type of insightTypes) {
      try {
        const typeInsights = await this.generateInsightsFromData(data, [type], context);
        insights.insights.push(...typeInsights);
      } catch (error) {
        console.warn(`Failed to generate ${type} insights: ${error.message}`);
      }
    }

    // Extract patterns and recommendations
    insights.patterns = this.extractPatterns(insights.insights);
    insights.recommendations = this.generateRecommendations(insights.insights, context);
    insights.confidence_scores = insights.insights.map(i => i.confidence);

    await this.storeMemory('insights_task', insights, {
      insights_count: insights.insights.length,
      patterns_count: insights.patterns.length
    });

    return {
      task_id: task.id,
      status: 'completed',
      result: insights,
      timestamp: new Date().toISOString()
    };
  }

  async performAnalysisOnData(data, analysisType, parameters = {}) {
    switch (analysisType) {
      case 'sentiment':
        return await this.useTool('text_analysis', {
          text: typeof data === 'string' ? data : JSON.stringify(data),
          analysis_type: 'sentiment'
        });
      case 'entities':
        return await this.useTool('text_analysis', {
          text: typeof data === 'string' ? data : JSON.stringify(data),
          analysis_type: 'entities'
        });
      case 'topics':
        return await this.useTool('text_analysis', {
          text: typeof data === 'string' ? data : JSON.stringify(data),
          analysis_type: 'topics'
        });
      case 'summary':
        return await this.useTool('text_analysis', {
          text: typeof data === 'string' ? data : JSON.stringify(data),
          analysis_type: 'summary'
        });
      case 'statistical':
        return this.performStatisticalAnalysis(data, parameters);
      case 'trend':
        return this.performTrendAnalysis(data, parameters);
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`);
    }
  }

  performStatisticalAnalysis(data, parameters) {
    // Mock statistical analysis
    const values = Array.isArray(data) ? data : Object.values(data);
    const numeric = values.filter(v => typeof v === 'number');
    
    return {
      type: 'statistical',
      metrics: {
        count: numeric.length,
        mean: numeric.reduce((a, b) => a + b, 0) / numeric.length,
        min: Math.min(...numeric),
        max: Math.max(...numeric)
      },
      timestamp: new Date().toISOString()
    };
  }

  performTrendAnalysis(data, parameters) {
    // Mock trend analysis
    return {
      type: 'trend',
      trend: 'increasing',
      confidence: 0.75,
      description: 'Data shows an upward trend',
      timestamp: new Date().toISOString()
    };
  }

  async generateInsightsFromData(data, insightTypes, context) {
    const insights = [];
    
    for (const type of insightTypes) {
      switch (type) {
        case 'trends':
          insights.push(this.generateTrendInsight(data));
          break;
        case 'anomalies':
          insights.push(this.generateAnomalyInsight(data));
          break;
        case 'correlations':
          insights.push(this.generateCorrelationInsight(data));
          break;
        case 'patterns':
          insights.push(this.generatePatternInsight(data));
          break;
      }
    }
    
    return insights;
  }

  generateTrendInsight(data) {
    return {
      type: 'trend',
      description: 'Data shows consistent upward trend',
      confidence: 0.8,
      actionable: true,
      recommendation: 'Continue current strategy',
      evidence: 'Mock trend analysis result'
    };
  }

  generateAnomalyInsight(data) {
    return {
      type: 'anomaly',
      description: 'Unusual pattern detected in recent data',
      confidence: 0.7,
      actionable: true,
      recommendation: 'Investigate recent changes',
      evidence: 'Mock anomaly detection result'
    };
  }

  generateCorrelationInsight(data) {
    return {
      type: 'correlation',
      description: 'Strong correlation between variables',
      confidence: 0.85,
      actionable: false,
      recommendation: null,
      evidence: 'Mock correlation analysis result'
    };
  }

  generatePatternInsight(data) {
    return {
      type: 'pattern',
      description: 'Recurring pattern identified',
      confidence: 0.75,
      actionable: true,
      recommendation: 'Leverage pattern for optimization',
      evidence: 'Mock pattern recognition result'
    };
  }

  createAnalysisPlan(data, config) {
    return {
      data_summary: this.summarizeInput(data),
      analyses: config.analyses || [
        { type: 'summary', parameters: {} },
        { type: 'sentiment', parameters: {} }
      ]
    };
  }

  summarizeInput(data) {
    return {
      type: typeof data,
      size: this.getDataSize(data),
      structure: Array.isArray(data) ? 'array' : typeof data === 'object' ? 'object' : 'primitive'
    };
  }

  getDataSize(data) {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object' && data !== null) return Object.keys(data).length;
    return 1;
  }

  calculateConfidence(result) {
    // Mock confidence calculation
    return 0.8;
  }

  generateAnalysisSummary(findings) {
    const successful = findings.filter(f => !f.error);
    return {
      total_analyses: findings.length,
      successful_analyses: successful.length,
      overall_confidence: successful.reduce((sum, f) => sum + (f.confidence || 0.5), 0) / successful.length,
      key_findings: successful.slice(0, 3).map(f => f.type)
    };
  }

  extractPatterns(insights) {
    return insights
      .filter(i => i.type === 'pattern')
      .map(i => i.description);
  }

  generateRecommendations(insights, context) {
    return insights
      .filter(i => i.actionable && i.recommendation)
      .map(i => i.recommendation);
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
