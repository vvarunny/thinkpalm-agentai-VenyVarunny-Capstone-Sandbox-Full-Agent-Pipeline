export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaultTools();
  }

  registerDefaultTools() {
    this.registerTool('code_analysis', {
      description: 'Analyze code for bugs, syntax errors, and security vulnerabilities',
      parameters: {
        code: { type: 'string', required: true },
        language: { type: 'string', default: 'javascript', enum: ['javascript', 'python', 'csharp', 'java', 'typescript'] },
        analysis_type: { type: 'string', default: 'all', enum: ['syntax', 'security', 'performance', 'all'] }
      },
      execute: async (params) => {
        const { code, language, analysis_type } = params;
        
        const issues = [];
        const lines = code.split('\n');
        
        // Syntax analysis
        if (analysis_type === 'syntax' || analysis_type === 'all') {
          issues.push(...this.analyzeSyntax(code, language));
        }
        
        // Security analysis
        if (analysis_type === 'security' || analysis_type === 'all') {
          issues.push(...this.analyzeSecurity(code, language));
        }
        
        // Performance analysis
        if (analysis_type === 'performance' || analysis_type === 'all') {
          issues.push(...this.analyzePerformance(code, language));
        }
        
        return {
          issues: issues,
          summary: {
            total_issues: issues.length,
            critical: issues.filter(i => i.severity === 'high').length,
            warnings: issues.filter(i => i.severity === 'medium').length,
            info: issues.filter(i => i.severity === 'low').length
          },
          language: language,
          timestamp: new Date().toISOString()
        };
      }
    });

    this.registerTool('bug_detection', {
      description: 'Detect specific bugs and runtime errors in code',
      parameters: {
        code: { type: 'string', required: true },
        language: { type: 'string', default: 'javascript', enum: ['javascript', 'python', 'csharp', 'java', 'typescript'] }
      },
      execute: async (params) => {
        const { code, language } = params;
        const bugs = [];
        
        // Detect common bugs based on language
        switch (language) {
          case 'javascript':
          case 'typescript':
            bugs.push(...this.detectJavaScriptBugs(code));
            break;
          case 'python':
            bugs.push(...this.detectPythonBugs(code));
            break;
          case 'csharp':
            bugs.push(...this.detectCSharpBugs(code));
            break;
          case 'java':
            bugs.push(...this.detectJavaBugs(code));
            break;
        }
        
        return {
          bugs: bugs,
          triage: this.categorizeBugs(bugs),
          timestamp: new Date().toISOString()
        };
      }
    });

    this.registerTool('code_quality', {
      description: 'Assess code quality and suggest improvements',
      parameters: {
        code: { type: 'string', required: true },
        language: { type: 'string', default: 'javascript' }
      },
      execute: async (params) => {
        const { code, language } = params;
        
        return {
          metrics: {
            complexity: this.calculateComplexity(code),
            maintainability: this.assessMaintainability(code),
            readability: this.assessReadability(code),
            duplication: this.detectDuplication(code)
          },
          suggestions: this.generateSuggestions(code, language),
          score: this.calculateQualityScore(code),
          timestamp: new Date().toISOString()
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

  // Code analysis helper methods
  analyzeSyntax(code, language) {
    const issues = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for missing semicolons in JavaScript
      if (['javascript', 'typescript'].includes(language)) {
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
            !trimmed.includes('if ') && !trimmed.includes('for ') && !trimmed.includes('while ') &&
            !trimmed.includes('function ') && !trimmed.includes('=>')) {
          issues.push({
            type: 'syntax',
            severity: 'medium',
            line: index + 1,
            description: 'Missing semicolon',
            suggestion: 'Add semicolon at end of statement'
          });
        }
      }
      
      // Dynamic typo detection using AI-powered pattern matching
      const typoDetections = this.detectDynamicTypos(trimmed, language);
      typoDetections.forEach(issue => {
        issue.line = index + 1;
        issues.push(issue);
      });
    });
    
    return issues;
  }

  analyzeSecurity(code, language) {
    const issues = [];
    
    // Check for SQL injection patterns
    if (code.includes('SELECT') && code.includes('+') && code.includes('"')) {
      issues.push({
        type: 'security',
        severity: 'high',
        description: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries instead of string concatenation'
      });
    }
    
    // Check for XSS patterns
    if (code.includes('innerHTML') || code.includes('document.write')) {
      issues.push({
        type: 'security',
        severity: 'high',
        description: 'Potential XSS vulnerability',
        suggestion: 'Use textContent or proper sanitization'
      });
    }
    
    return issues;
  }

  analyzePerformance(code, language) {
    const issues = [];
    
    // Check for potential performance issues
    if (code.includes('for (') && code.includes('.length')) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: 'Potential performance issue with array length in loop',
        suggestion: 'Cache array length outside loop'
      });
    }
    
    return issues;
  }

  detectJavaScriptBugs(code) {
    const bugs = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Runtime errors
      // Division by zero detection
      if (line.includes('/') && !line.includes('//')) {
        if (line.includes('/ 0') || line.includes('/0')) {
          bugs.push({
            type: 'runtime_error',
            severity: 'high',
            line: index + 1,
            description: 'ZeroDivisionError: division by zero',
            suggestion: 'Check for zero before division'
          });
        }
      }
      
      // Null/undefined reference errors
      if (trimmed.match(/\w+\.(\w+)\(/) && !trimmed.includes('?')) {
        const match = trimmed.match(/(\w+)\.(\w+)\(/);
        if (match) {
          const potentialNull = match[1];
          bugs.push({
            type: 'runtime_error',
            severity: 'medium',
            description: `Potential null reference: ${potentialNull} might be null/undefined`,
            suggestion: `Add null check: if (${potentialNull} != null) { ... }`
          });
        }
      }
      
      // Array index out of bounds
      if (trimmed.includes('[') && trimmed.includes(']') && !trimmed.includes('.length')) {
        const arrayMatch = trimmed.match(/(\w+)\[(\w+)\]/);
        if (arrayMatch && !arrayMatch[2].match(/^\d+$/)) {
          bugs.push({
            type: 'runtime_error',
            severity: 'medium',
            description: 'Potential array index out of bounds',
            suggestion: 'Validate array index before accessing'
          });
        }
      }
      
      // Syntax errors
      // Missing semicolons (except for certain cases)
      if (['javascript', 'typescript'].includes('javascript')) {
        if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') && 
            !trimmed.includes('if ') && !trimmed.includes('for ') && !trimmed.includes('while ') &&
            !trimmed.includes('function ') && !trimmed.includes('=>') && !trimmed.includes('class ') &&
            !trimmed.includes('switch ') && !trimmed.includes('case ') && !trimmed.includes('default:') &&
            !trimmed.includes('break') && !trimmed.includes('continue') && !trimmed.includes('return') &&
            !trimmed.includes('throw') && !trimmed.includes('try') && !trimmed.includes('catch') &&
            !trimmed.includes('finally') && !trimmed.includes('do') && !trimmed.includes('while')) {
          bugs.push({
            type: 'syntax',
            severity: 'medium',
            line: index + 1,
            description: 'Missing semicolon',
            suggestion: 'Add semicolon at end of statement'
          });
        }
      }
      
      // Mismatched brackets
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched square brackets',
          suggestion: 'Check bracket pairing'
        });
      }
      
      if (openBraces !== closeBraces) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched curly braces',
          suggestion: 'Check brace pairing'
        });
      }
      
      if (openParens !== closeParens) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched parentheses',
          suggestion: 'Check parenthesis pairing'
        });
      }
      
      // Common JavaScript errors
      if (trimmed.includes('==') && !trimmed.includes('===')) {
        bugs.push({
          type: 'syntax',
          severity: 'medium',
          line: index + 1,
          description: 'Using == instead of ===',
          suggestion: 'Use === for strict equality comparison'
        });
      }
      
      if (trimmed.includes('!=') && !trimmed.includes('!==')) {
        bugs.push({
          type: 'syntax',
          severity: 'medium',
          line: index + 1,
          description: 'Using != instead of !==',
          suggestion: 'Use !== for strict inequality comparison'
        });
      }
      
      // Dynamic typo detection
      const typoDetections = this.detectDynamicTypos(trimmed, 'javascript');
      typoDetections.forEach(issue => {
        issue.line = index + 1;
        bugs.push(issue);
      });
    });
    
    return bugs;
  }

  detectPythonBugs(code) {
    const bugs = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Runtime errors
      // Division by zero detection
      if (line.includes('/') && !line.includes('//')) {
        if (line.includes('/ 0') || line.includes('/0')) {
          bugs.push({
            type: 'runtime_error',
            severity: 'high',
            line: index + 1,
            description: 'ZeroDivisionError: division by zero',
            suggestion: 'Check for zero before division'
          });
        }
      }
      
      // IndexError detection
      if (trimmed.match(/\w+\[(\w+)\]/)) {
        const match = trimmed.match(/(\w+)\[(\w+)\]/);
        if (match && !match[2].match(/^\d+$/)) {
          bugs.push({
            type: 'runtime_error',
            severity: 'medium',
            description: 'Potential IndexError: list index out of range',
            suggestion: 'Validate index before accessing list'
          });
        }
      }
      
      // KeyError detection
      if (trimmed.match(/\w+\[(\w+)\]/) && !trimmed.match(/\w+\[\d+\]/)) {
        bugs.push({
          type: 'runtime_error',
          severity: 'medium',
          description: 'Potential KeyError: dictionary key may not exist',
          suggestion: 'Use dict.get(key, default) or check if key exists'
        });
      }
      
      // AttributeError detection
      if (trimmed.match(/\w+\.\w+/) && !trimmed.match(/\w+\.\w+\(/)) {
        bugs.push({
          type: 'runtime_error',
          severity: 'medium',
          description: 'Potential AttributeError: object may not have this attribute',
          suggestion: 'Check if attribute exists or use hasattr()'
        });
      }
      
      // Syntax errors
      // Missing colon after if/for/while/def/class
      if (trimmed.match(/^(if|elif|else|for|while|def|class|try|except|finally)\s+[^:]+$/) && !trimmed.endsWith(':')) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Missing colon after statement',
          suggestion: 'Add colon (:) at the end of the line'
        });
      }
      
      // Indentation issues (basic detection)
      if (line.length > 0 && line[0] !== ' ' && line[0] !== '\t' && index > 0) {
        const prevLine = lines[index - 1];
        if (prevLine && (prevLine.endsWith(':') || prevLine.trim().match(/^(if|elif|else|for|while|def|class|try|except|finally)/))) {
          bugs.push({
            type: 'syntax',
            severity: 'high',
            line: index + 1,
            description: 'Missing indentation',
            suggestion: 'Add proper indentation for code block'
          });
        }
      }
      
      // Mismatched brackets
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      const openParens = (trimmed.match(/\(/g) || []).length;
      const closeParens = (trimmed.match(/\)/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched square brackets',
          suggestion: 'Check bracket pairing'
        });
      }
      
      if (openBraces !== closeBraces) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched curly braces',
          suggestion: 'Check brace pairing'
        });
      }
      
      if (openParens !== closeParens) {
        bugs.push({
          type: 'syntax',
          severity: 'high',
          line: index + 1,
          description: 'Mismatched parentheses',
          suggestion: 'Check parenthesis pairing'
        });
      }
      
      // Common Python errors
      if (trimmed.includes('==') && trimmed.includes('=')) {
        bugs.push({
          type: 'syntax',
          severity: 'medium',
          line: index + 1,
          description: 'Potential assignment in comparison',
          suggestion: 'Use == for comparison, = for assignment'
        });
      }
      
      // Using list instead of tuple for immutable sequence
      if (trimmed.includes('(') && trimmed.includes(')') && trimmed.includes(',') && !trimmed.includes('tuple')) {
        bugs.push({
          type: 'performance',
          severity: 'low',
          line: index + 1,
          description: 'Consider using tuple instead of list for immutable sequence',
          suggestion: 'Use tuple() for immutable sequences'
        });
      }
      
      // Dynamic typo detection
      const typoDetections = this.detectDynamicTypos(trimmed, 'python');
      typoDetections.forEach(issue => {
        issue.line = index + 1;
        bugs.push(issue);
      });
    });
    
    return bugs;
  }

  detectCSharpBugs(code) {
    const bugs = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // Dynamic typo detection
      const typoDetections = this.detectDynamicTypos(line.trim(), 'csharp');
      typoDetections.forEach(issue => {
        issue.line = index + 1;
        bugs.push(issue);
      });
      
      // Division by zero in C#
      if (line.includes('/') && (line.includes('/ 0') || line.includes('/0'))) {
        bugs.push({
          type: 'runtime_error',
          severity: 'high',
          line: index + 1,
          description: 'DivideByZeroException: division by zero',
          suggestion: 'Check for zero before division'
        });
      }
    });
    
    return bugs;
  }

  detectJavaBugs(code) {
    const bugs = [];
    
    // Java-specific bug detection
    if (code.includes('NullPointerException')) {
      bugs.push({
        type: 'runtime_error',
        severity: 'high',
        description: 'Potential null pointer exception',
        suggestion: 'Add null checks before object usage'
      });
    }
    
    return bugs;
  }

  categorizeBugs(bugs) {
    const critical = bugs.filter(b => b.severity === 'high');
    const warnings = bugs.filter(b => b.severity === 'medium');
    const info = bugs.filter(b => b.severity === 'low');
    
    return {
      critical: critical.length,
      warnings: warnings.length,
      info: info.length,
      total: bugs.length,
      prioritized_fixes: critical.sort((a, b) => b.line - a.line)
    };
  }

  calculateComplexity(code) {
    // Simple complexity calculation
    const lines = code.split('\n');
    let complexity = 1;
    
    lines.forEach(line => {
      if (line.includes('if ') || line.includes('for ') || line.includes('while ')) {
        complexity++;
      }
    });
    
    return complexity;
  }

  assessMaintainability(code) {
    // Simple maintainability assessment
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 80).length;
    const maintainability = Math.max(0, 100 - (longLines * 5));
    
    return maintainability;
  }

  assessReadability(code) {
    // Simple readability assessment
    const lines = code.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('//')).length;
    const readability = Math.min(100, (commentLines / lines.length) * 100);
    
    return readability;
  }

  detectDuplication(code) {
    // Simple duplication detection
    const lines = code.split('\n').filter(line => line.trim());
    const uniqueLines = new Set(lines.map(line => line.trim()));
    const duplication = ((lines.length - uniqueLines.size) / lines.length) * 100;
    
    return duplication;
  }

  generateSuggestions(code, language) {
    const suggestions = [];
    
    if (code.length > 1000) {
      suggestions.push('Consider breaking down large functions into smaller ones');
    }
    
    if (!code.includes('//')) {
      suggestions.push('Add comments to explain complex logic');
    }
    
    return suggestions;
  }

  calculateQualityScore(code) {
    const complexity = this.calculateComplexity(code);
    const maintainability = this.assessMaintainability(code);
    const readability = this.assessReadability(code);
    const duplication = this.detectDuplication(code);
    
    // Weighted score calculation
    const score = (maintainability * 0.4) + (readability * 0.3) + ((100 - duplication) * 0.2) + ((100 - complexity * 10) * 0.1);
    
    return Math.max(0, Math.min(100, score));
  }

  // AI-powered dynamic typo detection
  detectDynamicTypos(line, language) {
    const issues = [];
    
    // Extract function calls and variable names from the line
    const functionCalls = this.extractFunctionCalls(line);
    const variableNames = this.extractVariableNames(line);
    const potentialFunctions = this.extractPotentialFunctions(line);
    
    // Get language-specific common functions and keywords
    const commonFunctions = this.getCommonFunctions(language);
    const commonKeywords = this.getCommonKeywords(language);
    
    // Check function calls for typos
    for (const funcCall of functionCalls) {
      const typo = this.findTypo(funcCall, commonFunctions);
      if (typo) {
        issues.push({
          type: 'syntax',
          severity: 'high',
          line: 0, // Will be set by caller
          description: `Function name typo: "${typo.found}" should be "${typo.suggested}"`,
          suggestion: `Change "${typo.found}" to "${typo.suggested}"`,
          confidence: typo.confidence
        });
      }
    }
    
    // Check potential function names (without parentheses) for typos
    for (const potentialFunc of potentialFunctions) {
      const typo = this.findTypo(potentialFunc, commonFunctions);
      if (typo) {
        issues.push({
          type: 'syntax',
          severity: 'high',
          line: 0, // Will be set by caller
          description: `Function name typo: "${typo.found}" should be "${typo.suggested}"`,
          suggestion: `Change "${typo.found}" to "${typo.suggested}"`,
          confidence: typo.confidence
        });
      }
    }
    
    // Check variable names for typos (less strict)
    for (const varName of variableNames) {
      const typo = this.findTypo(varName, commonKeywords);
      if (typo && typo.confidence > 0.8) {
        issues.push({
          type: 'naming',
          severity: 'medium',
          line: 0, // Will be set by caller
          description: `Variable name typo: "${typo.found}" should be "${typo.suggested}"`,
          suggestion: `Change "${typo.found}" to "${typo.suggested}"`,
          confidence: typo.confidence
        });
      }
    }
    
    return issues;
  }

  extractFunctionCalls(line) {
    const functionCalls = [];
    
    // Match function calls with parentheses
    const funcRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(line)) !== null) {
      functionCalls.push(match[1]);
    }
    
    // Match method calls (object.method())
    const methodRegex = /\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    while ((match = methodRegex.exec(line)) !== null) {
      functionCalls.push(match[1]);
    }
    
    return functionCalls;
  }

  extractPotentialFunctions(line) {
    const potentialFunctions = [];
    
    // Match standalone function names (not followed by parentheses)
    // This catches cases like "pit" in "pit('hello')" or "pit" alone
    const standaloneRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g;
    let match;
    while ((match = standaloneRegex.exec(line)) !== null) {
      const functionName = match[1];
      
      // Exclude common keywords and variable names
      const excludedKeywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const', 'class', 'new', 'this'];
      if (!excludedKeywords.includes(functionName)) {
        potentialFunctions.push(functionName);
      }
    }
    
    // Also check for function names that might be followed by operators or at end of line
    const functionRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*[;,)])/g;
    while ((match = functionRegex.exec(line)) !== null) {
      const functionName = match[1];
      if (!potentialFunctions.includes(functionName)) {
        potentialFunctions.push(functionName);
      }
    }
    
    return potentialFunctions;
  }

  extractVariableNames(line) {
    const variableNames = [];
    
    // Match variable assignments (excluding function definitions)
    const varRegex = /(?:let|const|var|int|string|bool|float|double)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    while ((match = varRegex.exec(line)) !== null) {
      variableNames.push(match[1]);
    }
    
    return variableNames;
  }

  getCommonFunctions(language) {
    const functionDatabase = {
      javascript: [
        // Core functions
        'print', 'console.log', 'console.warn', 'console.error', 'alert', 'prompt', 'confirm',
        'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'BigInt',
        'Array', 'Object', 'Date', 'Math', 'JSON', 'RegExp',
        
        // DOM functions
        'getElementById', 'querySelector', 'querySelectorAll', 'addEventListener',
        'removeEventListener', 'createElement', 'appendChild', 'removeChild',
        'setAttribute', 'getAttribute', 'classList', 'style',
        
        // Array methods
        'map', 'filter', 'reduce', 'reduceRight', 'forEach', 'find', 'findIndex',
        'some', 'every', 'includes', 'indexOf', 'lastIndexOf', 'slice', 'splice',
        'push', 'pop', 'shift', 'unshift', 'join', 'sort', 'reverse', 'concat',
        
        // Object methods
        'keys', 'values', 'entries', 'assign', 'create', 'defineProperty',
        'getOwnPropertyDescriptor', 'getOwnPropertyNames', 'getPrototypeOf',
        'setPrototypeOf', 'freeze', 'seal', 'preventExtensions',
        
        // String methods
        'charAt', 'charCodeAt', 'concat', 'includes', 'endsWith', 'indexOf',
        'lastIndexOf', 'localeCompare', 'match', 'matchAll', 'padStart', 'padEnd',
        'repeat', 'replace', 'replaceAll', 'search', 'slice', 'split', 'startsWith',
        'substring', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase',
        'trim', 'trimStart', 'trimEnd',
        
        // Promise/Async
        'Promise', 'resolve', 'reject', 'all', 'race', 'allSettled', 'any',
        'then', 'catch', 'finally', 'async', 'await'
      ],
      
      python: [
        // Built-in functions
        'print', 'input', 'len', 'range', 'list', 'dict', 'set', 'tuple', 'frozenset',
        'int', 'str', 'float', 'bool', 'type', 'isinstance', 'issubclass',
        'abs', 'all', 'any', 'bin', 'chr', 'ord', 'divmod', 'enumerate',
        'eval', 'exec', 'filter', 'map', 'max', 'min', 'pow', 'round', 'sum',
        'sorted', 'reversed', 'zip', 'iter', 'next', 'open', 'help', 'dir',
        
        // String methods
        'capitalize', 'casefold', 'center', 'count', 'encode', 'decode',
        'endswith', 'startswith', 'expandtabs', 'find', 'rfind', 'format',
        'index', 'rindex', 'isalnum', 'isalpha', 'isdecimal', 'isdigit',
        'isidentifier', 'islower', 'isnumeric', 'isprintable', 'isspace', 'istitle',
        'isupper', 'join', 'ljust', 'rjust', 'lower', 'upper', 'lstrip', 'rstrip',
        'strip', 'replace', 'rfind', 'rindex', 'rpartition', 'rsplit', 'rstrip',
        'split', 'splitlines', 'startswith', 'strip', 'swapcase', 'title',
        'translate', 'upper', 'zfill',
        
        // List methods
        'append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count',
        'sort', 'reverse', 'copy',
        
        // Dict methods
        'get', 'items', 'keys', 'values', 'pop', 'popitem', 'clear', 'update',
        'setdefault', 'fromkeys', 'copy',
        
        // Set methods
        'add', 'remove', 'discard', 'pop', 'clear', 'union', 'intersection',
        'difference', 'symmetric_difference', 'issubset', 'issuperset',
        
        // File operations
        'open', 'read', 'readline', 'readlines', 'write', 'writelines', 'seek',
        'tell', 'flush', 'close', 'fileno', 'isatty', 'truncate',
        
        // Math functions
        'ceil', 'floor', 'factorial', 'fsum', 'gcd', 'lcm', 'log', 'log10',
        'log2', 'pow', 'sqrt', 'acos', 'asin', 'atan', 'atan2', 'cos', 'sin',
        'tan', 'degrees', 'radians', 'hypot'
      ],
      
      csharp: [
        // Console methods
        'Write', 'WriteLine', 'Read', 'ReadLine', 'ReadKey', 'OpenStandardInput',
        'OpenStandardOutput', 'OpenStandardError', 'SetError', 'SetIn', 'SetOut',
        
        // Conversion methods
        'Parse', 'TryParse', 'ToString', 'ToInt32', 'ToInt64', 'ToDouble',
        'ToFloat', 'ToDecimal', 'ToBoolean', 'ToChar', 'ToDateTime',
        'Convert', 'BitConverter', 'Buffer',
        
        // Collection methods
        'Add', 'AddRange', 'Insert', 'InsertRange', 'Remove', 'RemoveAt',
        'RemoveAll', 'RemoveRange', 'Clear', 'Contains', 'Exists', 'Find',
        'FindAll', 'FindIndex', 'FindLast', 'FindLastIndex', 'ForEach',
        'IndexOf', 'LastIndexOf', 'BinarySearch', 'Sort', 'Reverse',
        'Count', 'LongCount', 'ElementAt', 'First', 'FirstOrDefault',
        'Last', 'LastOrDefault', 'Single', 'SingleOrDefault',
        
        // String methods
        'Compare', 'CompareOrdinal', 'Concat', 'Copy', 'Format', 'Intern',
        'IsInterned', 'IsNullOrEmpty', 'IsNullOrWhiteSpace', 'Join', 'PadLeft',
        'PadRight', 'Remove', 'Replace', 'Split', 'Substring', 'ToCharArray',
        'ToLower', 'ToLowerInvariant', 'ToUpper', 'ToUpperInvariant', 'Trim',
        'TrimEnd', 'TrimStart',
        
        // DateTime methods
        'Parse', 'TryParse', 'ParseExact', 'TryParseExact', 'Add', 'AddDays',
        'AddHours', 'AddMinutes', 'AddSeconds', 'AddMilliseconds', 'AddTicks',
        'AddMonths', 'AddYears', 'Subtract', 'DaysInMonth', 'IsLeapYear',
        
        // Math methods
        'Abs', 'Acos', 'Asin', 'Atan', 'Atan2', 'BigMul', 'Ceiling', 'Cos',
        'Cosh', 'DivRem', 'Exp', 'Floor', 'IEEERemainder', 'Log', 'Log10',
        'Max', 'Min', 'Pow', 'Round', 'Sign', 'Sin', 'Sinh', 'Sqrt', 'Tan',
        'Tanh', 'Truncate',
        
        // Common classes
        'Console', 'Convert', 'Math', 'String', 'Array', 'List', 'Dictionary',
        'HashSet', 'Queue', 'Stack', 'LinkedList', 'SortedList', 'SortedDictionary',
        'DateTime', 'TimeSpan', 'Guid', 'Random', 'Environment', 'Path', 'File',
        'Directory', 'StreamReader', 'StreamWriter', 'FileStream'
      ],
      
      java: [
        // System.out methods
        'print', 'println', 'printf', 'format',
        
        // Scanner methods
        'nextInt', 'nextLong', 'nextDouble', 'nextFloat', 'nextBoolean',
        'nextByte', 'nextShort', 'nextLine', 'hasNext', 'hasNextInt',
        'hasNextLong', 'hasNextDouble', 'hasNextFloat', 'hasNextBoolean',
        
        // String methods
        'charAt', 'codePointAt', 'codePointBefore', 'codePointCount',
        'compareTo', 'compareToIgnoreCase', 'concat', 'contains', 'contentEquals',
        'copyValueOf', 'endsWith', 'equals', 'equalsIgnoreCase', 'format',
        'getBytes', 'getChars', 'hashCode', 'indexOf', 'intern', 'isEmpty',
        'lastIndexOf', 'length', 'matches', 'regionMatches', 'replace',
        'replaceAll', 'replaceFirst', 'split', 'startsWith', 'subSequence',
        'substring', 'toCharArray', 'toLowerCase', 'toString', 'toUpperCase',
        'trim', 'valueOf',
        
        // Array methods
        'copyOf', 'copyOfRange', 'equals', 'fill', 'sort', 'binarySearch',
        'toString', 'hashCode', 'length',
        
        // Collection methods (List, Set, Map)
        'add', 'addAll', 'clear', 'contains', 'containsAll', 'equals',
        'hashCode', 'isEmpty', 'iterator', 'remove', 'removeAll', 'retainAll',
        'size', 'toArray', 'get', 'set', 'indexOf', 'lastIndexOf', 'listIterator',
        'subList', 'addFirst', 'addLast', 'removeFirst', 'removeLast',
        'peek', 'element', 'poll', 'offer', 'push', 'pop',
        
        // Math methods
        'abs', 'acos', 'asin', 'atan', 'atan2', 'cbrt', 'ceil', 'copySign',
        'cos', 'cosh', 'exp', 'expm1', 'floor', 'getExponent', 'hypot',
        'IEEEremainder', 'log', 'log10', 'log1p', 'max', 'min', 'nextAfter',
        'nextDown', 'nextUp', 'pow', 'random', 'rint', 'round', 'scalb',
        'signum', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'toDegrees',
        'toRadians', 'ulp',
        
        // Common classes
        'System', 'Math', 'String', 'Object', 'Integer', 'Long', 'Double',
        'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Number', 'BigInteger',
        'BigDecimal', 'Arrays', 'Collections', 'ArrayList', 'LinkedList',
        'HashSet', 'TreeSet', 'HashMap', 'TreeMap', 'Hashtable', 'Properties',
        'Vector', 'Stack', 'Queue', 'PriorityQueue', 'Scanner', 'StringTokenizer',
        'Date', 'Calendar', 'LocalDate', 'LocalTime', 'LocalDateTime',
        'File', 'Path', 'Paths', 'Files', 'BufferedReader', 'BufferedWriter',
        'FileReader', 'FileWriter', 'PrintWriter'
      ]
    };
    
    return functionDatabase[language] || functionDatabase.javascript;
  }

  getCommonKeywords(language) {
    const keywordDatabase = {
      javascript: [
        // Control flow
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'throw', 'try', 'catch', 'finally',
        
        // Variable declarations
        'var', 'let', 'const', 'function', 'class', 'extends', 'super',
        
        // Import/Export
        'import', 'export', 'from', 'as', 'default',
        
        // Async/Await
        'async', 'await', 'Promise',
        
        // Operators
        'new', 'this', 'typeof', 'instanceof', 'in', 'of', 'void', 'delete',
        
        // Other
        'debugger', 'with', 'yield'
      ],
      
      python: [
        // Control flow
        'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'return', 'pass',
        
        // Function/Class definitions
        'def', 'class', 'lambda', 'yield', 'return',
        
        // Import/Export
        'import', 'from', 'as', 'export',
        
        // Exception handling
        'try', 'except', 'finally', 'raise', 'assert',
        
        // Context managers
        'with', 'as',
        
        // Boolean/None
        'True', 'False', 'None', 'is', 'not', 'and', 'or',
        
        // Global/Nonlocal
        'global', 'nonlocal',
        
        // Other
        'del', 'exec', 'eval'
      ],
      
      csharp: [
        // Access modifiers
        'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const',
        
        // Control flow
        'if', 'else', 'switch', 'case', 'default', 'for', 'foreach', 'while', 'do',
        'break', 'continue', 'return', 'goto', 'throw', 'try', 'catch', 'finally',
        
        // Class/Struct definitions
        'class', 'struct', 'interface', 'enum', 'abstract', 'sealed', 'partial',
        'virtual', 'override', 'base', 'this',
        
        // Keywords
        'new', 'typeof', 'sizeof', 'nameof', 'checked', 'unchecked', 'lock',
        'using', 'namespace', 'as', 'is', 'when', 'where', 'select', 'from',
        'orderby', 'group', 'by', 'join', 'on', 'equals', 'let', 'into',
        'ascending', 'descending', 'in', 'out', 'ref', 'params',
        
        // Value types
        'bool', 'byte', 'sbyte', 'char', 'decimal', 'double', 'float', 'int',
        'uint', 'long', 'ulong', 'object', 'short', 'ushort', 'string', 'void',
        
        // Other
        'unsafe', 'fixed', 'stackalloc', 'var', 'dynamic', 'async', 'await'
      ],
      
      java: [
        // Access modifiers
        'public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized',
        'volatile', 'transient', 'native', 'strictfp',
        
        // Control flow
        'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break',
        'continue', 'return', 'throw', 'try', 'catch', 'finally',
        
        // Class/Interface definitions
        'class', 'interface', 'extends', 'implements', 'abstract', 'final',
        'strictfp', 'enum', 'transient', 'native',
        
        // Keywords
        'new', 'this', 'super', 'instanceof', 'import', 'package', 'void',
        'boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double',
        
        // Boolean literals
        'true', 'false', 'null',
        
        // Method references
        'assert', 'const', 'goto',
        
        // Module system (Java 9+)
        'module', 'requires', 'exports', 'opens', 'to', 'uses', 'provides',
        'transitive',
        
        // Other
        'var', 'yield', 'record', 'sealed', 'permits'
      ]
    };
    
    return keywordDatabase[language] || keywordDatabase.javascript;
  }

  findTypo(candidate, referenceWords) {
    let bestMatch = null;
    let highestConfidence = 0;
    
    for (const reference of referenceWords) {
      // Check multiple similarity metrics
      const levenshteinSimilarity = this.calculateSimilarity(candidate, reference);
      const patternSimilarity = this.calculatePatternSimilarity(candidate, reference);
      const prefixSimilarity = this.calculatePrefixSimilarity(candidate, reference);
      const abbreviationSimilarity = this.calculateAbbreviationSimilarity(candidate, reference);
      
      // Use the highest similarity score
      const similarity = Math.max(levenshteinSimilarity, patternSimilarity, prefixSimilarity, abbreviationSimilarity);
      
      // Adaptive threshold based on candidate and reference length
      let threshold = 0.7;
      
      // Much lower threshold for very short candidates
      if (candidate.length <= 2) {
        threshold = 0.25; // Extremely lenient for 1-2 character typos
      } else if (candidate.length === 3) {
        threshold = 0.35; // Very lenient for 3 character typos
      } else if (candidate.length <= 5) {
        threshold = 0.5; // Lenient for 4-5 character typos
      } else if (candidate.length > reference.length * 2) {
        threshold = 0.3; // Lenient for very long typos
      }
      
      // Special case: very high confidence for partial matches of short typos
      if (candidate.length <= 3 && reference.length >= 4) {
        const charOverlap = this.calculateCharacterOverlap(candidate, reference);
        if (charOverlap >= 0.6) {
          threshold = 0.2; // Extremely lenient for good character overlap
        }
      }
      
      // Only consider matches with sufficient similarity but not exact matches
      if (similarity > threshold && similarity < 1.0) {
        if (similarity > highestConfidence) {
          highestConfidence = similarity;
          bestMatch = {
            found: candidate,
            suggested: reference,
            confidence: similarity
          };
        }
      }
    }
    
    return bestMatch;
  }

  calculateSimilarity(str1, str2) {
    // Levenshtein distance algorithm for string similarity
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1.0;
    
    const similarity = 1 - (distance / maxLength);
    return similarity;
  }

  calculatePatternSimilarity(candidate, reference) {
    // Pattern-based similarity for detecting repeated character typos
    const candidateLower = candidate.toLowerCase();
    const referenceLower = reference.toLowerCase();
    
    // Check if candidate starts with reference (common typo pattern)
    if (candidateLower.startsWith(referenceLower)) {
      const extraChars = candidateLower.length - referenceLower.length;
      // Adaptive penalty based on length ratio
      const lengthRatio = candidateLower.length / referenceLower.length;
      
      if (lengthRatio <= 2) {
        return Math.max(0.7, 1 - (extraChars * 0.05)); // Lenient for moderate repetition
      } else if (lengthRatio <= 5) {
        return Math.max(0.5, 1 - (extraChars * 0.02)); // Very lenient for heavy repetition
      } else {
        return Math.max(0.3, 1 - (extraChars * 0.01)); // Ultra lenient for extreme repetition
      }
    }
    
    // Check if reference is contained within candidate
    if (candidateLower.includes(referenceLower)) {
      const candidateRatio = referenceLower.length / candidateLower.length;
      const position = candidateLower.indexOf(referenceLower);
      
      // Higher confidence if reference is at the beginning
      if (position === 0) {
        return Math.max(0.6, candidateRatio * 1.2);
      } else {
        return candidateRatio * 0.8; // Lower confidence for middle/end matches
      }
    }
    
    // Check for repeated character patterns (like printfftftftftfth)
    const repeatedPattern = this.detectRepeatedPattern(candidateLower);
    if (repeatedPattern && repeatedPattern.includes(referenceLower)) {
      return 0.6; // Moderate confidence for repeated patterns
    }
    
    // Check for extreme single character repetition
    const extremeRepetition = this.detectExtremeRepetition(candidateLower);
    if (extremeRepetition && candidateLower.startsWith(referenceLower)) {
      return 0.7; // High confidence for extreme repetition with correct prefix
    }
    
    return 0;
  }

  calculatePrefixSimilarity(candidate, reference) {
    // Prefix-based similarity for detecting typos that start correctly
    const candidateLower = candidate.toLowerCase();
    const referenceLower = reference.toLowerCase();
    
    let commonPrefix = 0;
    const minLength = Math.min(candidateLower.length, referenceLower.length);
    
    for (let i = 0; i < minLength; i++) {
      if (candidateLower[i] === referenceLower[i]) {
        commonPrefix++;
      } else {
        break;
      }
    }
    
    if (commonPrefix === 0) return 0;
    
    const prefixRatio = commonPrefix / referenceLower.length;
    const lengthPenalty = candidateLower.length > referenceLower.length * 2 ? 0.3 : 0.7;
    
    return prefixRatio * lengthPenalty;
  }

  detectRepeatedPattern(str) {
    // Detect patterns like 'ftftft' or 'ababab'
    for (let patternLength = 1; patternLength <= str.length / 2; patternLength++) {
      const pattern = str.substring(0, patternLength);
      let isRepeated = true;
      
      for (let i = patternLength; i < str.length; i += patternLength) {
        const segment = str.substring(i, i + patternLength);
        if (segment !== pattern && segment.length === patternLength) {
          isRepeated = false;
          break;
        }
      }
      
      if (isRepeated) {
        return pattern;
      }
    }
    
    return null;
  }

  detectExtremeRepetition(str) {
    // Detect extreme single character repetition like 'printttttttttttttttttttttttttttt'
    if (str.length < 6) return null; // Too short for extreme repetition
    
    // Find the longest prefix that doesn't repeat
    let prefixEnd = 0;
    for (let i = 1; i < str.length; i++) {
      if (str[i] !== str[i - 1]) {
        prefixEnd = i;
      } else {
        // Found repetition, check if it continues
        break;
      }
    }
    
    if (prefixEnd === 0) return null; // No non-repeating prefix
    
    // Check if the rest is mostly the same character
    const prefix = str.substring(0, prefixEnd);
    const rest = str.substring(prefixEnd);
    
    if (rest.length < 3) return null; // Not enough repetition
    
    // Count the most frequent character in the rest
    const charCounts = {};
    for (const char of rest) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }
    
    const maxCount = Math.max(...Object.values(charCounts));
    const repetitionRatio = maxCount / rest.length;
    
    // Consider it extreme repetition if >80% of the rest is the same character
    if (repetitionRatio > 0.8) {
      return {
        prefix: prefix,
        repeatedChar: Object.keys(charCounts).find(char => charCounts[char] === maxCount),
        repetitionRatio: repetitionRatio
      };
    }
    
    return null;
  }

  calculateAbbreviationSimilarity(candidate, reference) {
    // Special handling for short typos and abbreviations
    const candidateLower = candidate.toLowerCase();
    const referenceLower = reference.toLowerCase();
    
    // Check if candidate is a prefix/abbreviation of reference
    if (referenceLower.startsWith(candidateLower)) {
      const coverageRatio = candidateLower.length / referenceLower.length;
      // High confidence for good coverage, but penalize very short matches
      if (candidateLower.length >= 2) {
        return Math.min(0.8, coverageRatio * 1.5);
      }
    }
    
    // Check if reference contains candidate as subsequence
    if (this.isSubsequence(candidateLower, referenceLower)) {
      const coverageRatio = candidateLower.length / referenceLower.length;
      return Math.min(0.7, coverageRatio * 1.2);
    }
    
    // Special case for very short candidates (1-3 chars)
    if (candidateLower.length <= 3) {
      // Check if any characters match in order
      let matchingChars = 0;
      let candidateIndex = 0;
      
      for (let i = 0; i < referenceLower.length && candidateIndex < candidateLower.length; i++) {
        if (referenceLower[i] === candidateLower[candidateIndex]) {
          matchingChars++;
          candidateIndex++;
        }
      }
      
      if (matchingChars >= 2) {
        return 0.5; // Moderate confidence for partial matches
      }
    }
    
    return 0;
  }

  isSubsequence(shorter, longer) {
    // Check if shorter string is a subsequence of longer string
    let shorterIndex = 0;
    
    for (let i = 0; i < longer.length && shorterIndex < shorter.length; i++) {
      if (longer[i] === shorter[shorterIndex]) {
        shorterIndex++;
      }
    }
    
    return shorterIndex === shorter.length;
  }

  calculateCharacterOverlap(candidate, reference) {
    // Calculate character overlap ratio for short typos
    const candidateLower = candidate.toLowerCase();
    const referenceLower = reference.toLowerCase();
    
    let matchingChars = 0;
    const candidateChars = candidateLower.split('');
    const referenceChars = referenceLower.split('');
    
    // Count matching characters in order
    let candidateIndex = 0;
    for (let i = 0; i < referenceChars.length && candidateIndex < candidateChars.length; i++) {
      if (referenceChars[i] === candidateChars[candidateIndex]) {
        matchingChars++;
        candidateIndex++;
      }
    }
    
    // Calculate overlap ratio
    const overlapRatio = matchingChars / candidateChars.length;
    return overlapRatio;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
