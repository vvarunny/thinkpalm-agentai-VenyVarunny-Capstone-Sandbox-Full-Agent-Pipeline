import { BaseAgent } from './BaseAgent.js';

export class AnalysisAgent extends BaseAgent {
  constructor(id, memorySystem, toolRegistry) {
    super(id, 'Code Analysis Agent', 'analysis', memorySystem, toolRegistry);
    this.capabilities = ['code_analysis', 'bug_detection', 'security_scan', 'quality_assessment'];
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'code_analysis_request':
        return await this.handleCodeAnalysisRequest(message);
      case 'bug_detection_request':
        return await this.handleBugDetectionRequest(message);
      case 'quality_assessment_request':
        return await this.handleQualityAssessmentRequest(message);
      default:
        return await super.handleMessage(message);
    }
  }

  async performTask(task) {
    switch (task.type) {
      case 'code_review':
      case 'analysis':
      case 'bug_detection':
        return await this.performCodeAnalysis(task);
      case 'quality_assessment':
        return await this.performQualityAssessment(task);
      case 'security_scan':
        return await this.performSecurityScan(task);
      default:
        return await super.performTask(task);
    }
  }

  async handleCodeAnalysisRequest(message) {
    const { code, language, analysis_type = 'all' } = message.content;
    
    try {
      const analysisResults = await this.useTool('code_analysis', {
        code,
        language,
        analysis_type
      });
      
      const result = {
        analysis_type,
        language,
        issues: analysisResults.issues,
        summary: analysisResults.summary,
        timestamp: analysisResults.timestamp
      };

      await this.storeMemory('code_analysis_result', result, {
        language,
        analysis_type,
        issues_count: result.summary.total_issues
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'code_analysis_response',
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

  async handleBugDetectionRequest(message) {
    const { code, language } = message.content;
    
    try {
      const bugResults = await this.useTool('bug_detection', {
        code,
        language
      });

      const result = {
        bugs: bugResults.bugs,
        triage: bugResults.triage,
        timestamp: bugResults.timestamp
      };

      await this.storeMemory('bug_detection_result', result, {
        language,
        bugs_count: result.triage.total,
        critical_bugs: result.triage.critical
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'bug_detection_response',
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

  async handleQualityAssessmentRequest(message) {
    const { code, language } = message.content;
    
    try {
      const qualityResults = await this.useTool('code_quality', {
        code,
        language
      });

      const result = {
        metrics: qualityResults.metrics,
        suggestions: qualityResults.suggestions,
        score: qualityResults.score,
        timestamp: qualityResults.timestamp
      };

      await this.storeMemory('quality_assessment_result', result, {
        language,
        quality_score: result.score,
        suggestions_count: result.suggestions.length
      });

      return {
        id: this.generateMessageId(),
        sender: this.id,
        type: 'quality_assessment_response',
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

  async performCodeAnalysis(task) {
    const { code, language, analysis_type = 'all' } = task;
    
    try {
      const analysisResults = await this.useTool('code_analysis', {
        code,
        language,
        analysis_type
      });

      const result = {
        task_id: task.id,
        analysis_type,
        language,
        issues: analysisResults.issues,
        summary: analysisResults.summary,
        timestamp: analysisResults.timestamp
      };

      await this.storeMemory('code_analysis_task', result, {
        language,
        analysis_type,
        issues_count: result.summary.total_issues
      });

      return {
        task_id: task.id,
        status: 'completed',
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  async performQualityAssessment(task) {
    const { code, language } = task;
    
    try {
      const qualityResults = await this.useTool('code_quality', {
        code,
        language
      });

      const result = {
        task_id: task.id,
        metrics: qualityResults.metrics,
        suggestions: qualityResults.suggestions,
        score: qualityResults.score,
        timestamp: qualityResults.timestamp
      };

      await this.storeMemory('quality_assessment_task', result, {
        language,
        quality_score: result.score,
        suggestions_count: result.suggestions.length
      });

      return {
        task_id: task.id,
        status: 'completed',
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  async performSecurityScan(task) {
    const { code, language } = task;
    
    try {
      const securityResults = await this.useTool('code_analysis', {
        code,
        language,
        analysis_type: 'security'
      });

      const result = {
        task_id: task.id,
        security_issues: securityResults.issues.filter(i => i.type === 'security'),
        all_issues: securityResults.issues,
        summary: securityResults.summary,
        timestamp: securityResults.timestamp
      };

      await this.storeMemory('security_scan_task', result, {
        language,
        security_issues: result.security_issues.length,
        total_issues: result.summary.total_issues
      });

      return {
        task_id: task.id,
        status: 'completed',
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Security scan failed: ${error.message}`);
    }
  }
















  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
