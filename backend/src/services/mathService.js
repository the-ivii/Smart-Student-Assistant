import axios from 'axios';

const MATHJS_API_URL = 'https://api.mathjs.org/v4/';

/**
 * Evaluates a math expression using math.js API
 * @param {string} expression - Math expression to evaluate (e.g., "2+5", "10*3", "sqrt(16)")
 * @returns {Promise<Object>} Result with answer and explanation
 */
export async function evaluateMathExpression(expression) {
  try {
    // Clean and normalize the expression
    let cleanExpr = expression.trim();
    
    // Replace common text patterns with math expressions
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
    
    // Remove question marks and extra text
    cleanExpr = cleanExpr.replace(/[?]/g, '').trim();
    
    if (!cleanExpr || cleanExpr.length === 0) {
      throw new Error('Invalid math expression');
    }

    console.log(`🔢 Evaluating math expression: ${cleanExpr}`);

    // Call math.js API
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
    
    // math.js returns the result directly as a string or number
    let answer;
    if (typeof result === 'string') {
      // Try to parse if it's a JSON string
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

    console.log(`✅ Math.js API result: ${answer}`);

    return {
      success: true,
      answer: answer,
      expression: cleanExpr,
      explanation: generateMathExplanation(cleanExpr, answer)
    };

  } catch (error) {
    console.error('Math.js API error:', error.message);
    
    // Fallback to safe evaluation
    try {
      console.log('⚠️ Falling back to local evaluation');
      return safeEvaluateMath(expression);
    } catch (fallbackError) {
      throw new Error(`Failed to evaluate math expression: ${error.message}`);
    }
  }
}

/**
 * Safely evaluates simple math expressions (fallback)
 * @param {string} expression - Math expression
 * @returns {Object} Result with answer
 */
function safeEvaluateMath(expression) {
  // Remove all non-math characters except numbers, operators, and parentheses
  const cleanExpr = expression.replace(/[^\d+\-*/().\s]/g, '').trim();
  
  // Very basic evaluation for simple expressions
  // Only allow safe operations
  if (!/^[\d+\-*/().\s]+$/.test(cleanExpr)) {
    throw new Error('Expression contains unsafe characters');
  }

  // Use Function constructor as a last resort (be careful!)
  try {
    // Only allow basic math operations
    const allowed = ['+', '-', '*', '/', '(', ')', '.', ' '];
    const hasOnlyAllowed = cleanExpr.split('').every(char => 
      allowed.includes(char) || !isNaN(parseInt(char))
    );
    
    if (!hasOnlyAllowed) {
      throw new Error('Expression contains disallowed operations');
    }

    // Evaluate using Function (safer than eval but still be careful)
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

/**
 * Generates a step-by-step explanation for a math expression
 * @param {string} expression - The math expression
 * @param {string} answer - The calculated answer
 * @returns {string} Step-by-step explanation
 */
function generateMathExplanation(expression, answer) {
  const steps = [];
  const cleanExpr = expression.replace(/\s+/g, '');
  
  // Parse the expression to show steps
  if (cleanExpr.includes('(')) {
    steps.push(`Step 1: Evaluate expressions inside parentheses first (PEMDAS rule)`);
  }
  
  // Check for exponents
  if (cleanExpr.includes('^') || cleanExpr.includes('**') || /sqrt\(|pow\(|exp\(/.test(cleanExpr)) {
    steps.push(`Step 2: Evaluate exponents and functions`);
  }
  
  // Handle multiplication and division
  if (cleanExpr.includes('*') || cleanExpr.includes('/')) {
    steps.push(`Step 3: Perform multiplication and division from left to right`);
  }
  
  // Handle addition and subtraction
  if (cleanExpr.includes('+') || (cleanExpr.includes('-') && !cleanExpr.startsWith('-'))) {
    steps.push(`Step 4: Perform addition and subtraction from left to right`);
  }
  
  // Show the calculation
  if (steps.length === 0) {
    // Simple expression
    steps.push(`Direct evaluation: ${expression}`);
  }
  
  // Final answer
  steps.push(`\nFinal Answer: ${expression} = ${answer}`);
  
  // Add PEMDAS reminder for complex expressions
  if (steps.length > 2) {
    steps.push(`\nRemember PEMDAS: Parentheses → Exponents → Multiplication/Division → Addition/Subtraction`);
  }
  
  return steps.join('\n');
}

/**
 * Checks if a string is a simple math expression
 * @param {string} text - Text to check
 * @returns {boolean} True if it's a math expression
 */
export function isMathExpression(text) {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim().toLowerCase();
  
  // Remove common question words
  const cleaned = trimmed
    .replace(/^(what is|solve|calculate|evaluate|find|compute)\s+/i, '')
    .replace(/\?/g, '')
    .trim();
  
  // Check for common math patterns
  const mathPatterns = [
    /^[\d+\-*/().\s]+$/,  // Simple arithmetic: "2+5", "10*3"
    /^\d+\s*[+\-*/]\s*\d+/,  // Number operator number
    /^[\d.]+[\s]*[+\-*/][\s]*[\d.]+/,  // Decimal numbers with operators
    /sqrt\(|sin\(|cos\(|tan\(|log\(|ln\(|exp\(|pow\(/,  // Math functions
    /^\d+\s*(plus|minus|times|multiplied by|divided by|over)\s*\d+/i,  // Text operators
  ];
  
  // Must have at least one number and one operator
  const hasNumber = /\d/.test(cleaned);
  const hasOperator = /[+\-*/]|plus|minus|times|divided|over|multiplied/i.test(cleaned);
  
  return hasNumber && hasOperator && mathPatterns.some(pattern => pattern.test(cleaned));
}

/**
 * Solves a math expression and returns formatted study material
 * @param {string} expression - Math expression to solve
 * @returns {Promise<Object>} Formatted study material response
 */
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

