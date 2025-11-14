import axios from 'axios';

const MATHJS_API_URL = 'https://api.mathjs.org/v4/';

export async function evaluateMathExpression(expression) {
  try {
    let cleanExpr = expression.trim();
    
    cleanExpr = cleanExpr
      .replace(/\s*plus\s*/gi, '+')
      .replace(/\s*minus\s*/gi, '-')
      .replace(/\s*times\s*/gi, '*')
      .replace(/\s*multiplied by\s*/gi, '*')
      .replace(/\s*divided by\s*/gi, '/')
      .replace(/\s*over\s*/gi, '/')
      .replace(/\s*equals\s*/gi, '=')
      .replace(/\s*is\s*/gi, '=')
      .replace(/what is\s*/gi, '')
      .replace(/solve\s*/gi, '')
      .replace(/calculate\s*/gi, '')
      .replace(/evaluate\s*/gi, '')
      .trim();
    
    cleanExpr = cleanExpr.replace(/[?]/g, '').trim();
    
    if (!cleanExpr || cleanExpr.length === 0) {
      throw new Error('Invalid math expression');
    }

    console.log(`🔢 Evaluating math expression: ${cleanExpr}`);

    const response = await axios.get(MATHJS_API_URL, {
      params: {
        expr: cleanExpr
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'SmartStudyAssistant/1.0'
      }
    });

    const result = response.data;
    
    let answer;
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result);
        answer = parsed.toString();
      } catch {
        answer = result;
      }
    } else if (typeof result === 'number') {
      answer = result.toString();
    } else {
      answer = String(result);
    }

    console.log(`Math.js API result: ${answer}`);

    return {
      success: true,
      answer: answer,
      expression: cleanExpr,
      explanation: generateMathExplanation(cleanExpr, answer)
    };

  } catch (error) {
    console.error('Math.js API error:', error.message);
    
    try {
      console.log('Falling back to local evaluation');
      return safeEvaluateMath(expression);
    } catch (fallbackError) {
      throw new Error(`Failed to evaluate math expression: ${error.message}`);
    }
  }
}

function safeEvaluateMath(expression) {
  const cleanExpr = expression.replace(/[^\d+\-*/().\s]/g, '').trim();
  
  if (!/^[\d+\-*/().\s]+$/.test(cleanExpr)) {
    throw new Error('Expression contains unsafe characters');
  }

  try {
    const allowed = ['+', '-', '*', '/', '(', ')', '.', ' '];
    const hasOnlyAllowed = cleanExpr.split('').every(char => 
      allowed.includes(char) || !isNaN(parseInt(char))
    );
    
    if (!hasOnlyAllowed) {
      throw new Error('Expression contains disallowed operations');
    }

    const result = Function(`"use strict"; return (${cleanExpr})`)();
    
    return {
      success: true,
      answer: result.toString(),
      expression: cleanExpr,
      explanation: generateMathExplanation(cleanExpr, result.toString())
    };
  } catch (error) {
    throw new Error(`Cannot evaluate expression: ${error.message}`);
  }
}

function generateMathExplanation(expression, answer) {
  const steps = [];
  const cleanExpr = expression.replace(/\s+/g, '');
  
  if (cleanExpr.includes('(')) {
    steps.push(`Step 1: Evaluate expressions inside parentheses first (PEMDAS rule)`);
  }
  
  if (cleanExpr.includes('^') || cleanExpr.includes('**') || /sqrt\(|pow\(|exp\(/.test(cleanExpr)) {
    steps.push(`Step 2: Evaluate exponents and functions`);
  }
  
  if (cleanExpr.includes('*') || cleanExpr.includes('/')) {
    steps.push(`Step 3: Perform multiplication and division from left to right`);
  }
  
  if (cleanExpr.includes('+') || (cleanExpr.includes('-') && !cleanExpr.startsWith('-'))) {
    steps.push(`Step 4: Perform addition and subtraction from left to right`);
  }
  
  if (steps.length === 0) {
    steps.push(`Direct evaluation: ${expression}`);
  }
  
  steps.push(`\nFinal Answer: ${expression} = ${answer}`);
  
  if (steps.length > 2) {
    steps.push(`\nRemember PEMDAS: Parentheses → Exponents → Multiplication/Division → Addition/Subtraction`);
  }
  
  return steps.join('\n');
}

export function isMathExpression(text) {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim().toLowerCase();
  
  const cleaned = trimmed
    .replace(/^(what is|solve|calculate|evaluate|find|compute)\s+/i, '')
    .replace(/\?/g, '')
    .trim();
  
  const mathPatterns = [
    /^[\d+\-*/().\s]+$/,
    /^\d+\s*[+\-*/]\s*\d+/,
    /^[\d.]+[\s]*[+\-*/][\s]*[\d.]+/,
    /sqrt\(|sin\(|cos\(|tan\(|log\(|ln\(|exp\(|pow\(/,
    /^\d+\s*(plus|minus|times|multiplied by|divided by|over)\s*\d+/i,
  ];
  
  const hasNumber = /\d/.test(cleaned);
  const hasOperator = /[+\-*/]|plus|minus|times|divided|over|multiplied/i.test(cleaned);
  
  return hasNumber && hasOperator && mathPatterns.some(pattern => pattern.test(cleaned));
}

export async function solveMathExpression(expression) {
  try {
    const result = await evaluateMathExpression(expression);
    
    return {
      success: true,
      data: {
        summary: [
          `Mathematical expression: ${result.expression}`,
          `This expression can be evaluated using standard order of operations (PEMDAS)`,
          `The result is ${result.answer}`
        ],
        mathQuestion: {
          question: `Solve: ${result.expression}`,
          answer: result.answer,
          explanation: result.explanation
        },
        studyTip: `Remember PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction) when solving math expressions. Always work from left to right for operations of the same precedence.`
      }
    };
  } catch (error) {
    throw new Error(`Failed to solve math expression: ${error.message}`);
  }
}
