import OpenAI from 'openai/index.mjs';
import { GoogleGenAI } from '@google/genai';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
import { solveMathExpression, isMathExpression as checkMathExpression } from './mathService.js';

dotenv.config();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
}) : null;

const huggingface = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

export async function generateAIContent(topic, context, mode = 'normal') {
  try {
    if (mode === 'math' && checkMathExpression(topic)) {
      console.log(`🔢 Detected math expression: ${topic}`);
      try {
        return await solveMathExpression(topic);
      } catch (mathError) {
        console.error('Math.js API failed, using fallback:', mathError.message);
        return generateMathExpressionSolution(topic);
      }
    }
    
    
    if (mode === 'math' && isComplexMathProblem(topic)) {
      console.log(`🧮 Detected complex math problem: ${topic}`);
      
      context = '';
      
      console.log('🤖 Using AI to solve complex math problem (Wikipedia context cleared)...');
    } else if (context && context.trim().length > 0) {
      console.log(`📚 Wikipedia context available (${context.length} characters). Will use Wikipedia-based generation.`);
      console.log('🎯 Generating content directly from Wikipedia context...');
      return generateFromWikipediaContext(topic, context, mode);
    } else {
      console.log(`No Wikipedia context available. Will use mock data or generate from topic name.`);
    }

    if (!huggingface && !openai && !gemini) {
      if (mode === 'math' && isComplexMathProblem(topic)) {
        console.error('No AI providers available for complex math problem');
        throw new Error('AI providers required for complex math problems. Please configure at least one AI API key.');
      }
      console.log('No AI providers available, using mock data');
      return generateMockContent(topic, mode);
    }

    const prompt = mode === 'math' 
      ? createMathModePrompt(topic, context)
      : createNormalModePrompt(topic, context);

    let responseText;

    if (huggingface) {
      try {
        const instructionPrompt = `You are an expert educational assistant. ${prompt}`;
        
        const models = [
          'google/flan-t5-large',
          'gpt2',
          'distilgpt2',
        ];
        
        let lastError;
        for (const model of models) {
          try {
            const result = await huggingface.textGeneration({
              model: model,
              inputs: instructionPrompt,
              parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                return_full_text: false,
              },
            });
            responseText = result.generated_text.trim();
            console.log(`Using HuggingFace model: ${model}`);
            break;
          } catch (modelError) {
            lastError = modelError;
            continue;
          }
        }
        
        if (!responseText) {
          throw lastError || new Error('HuggingFace models not available');
        }
      } catch (hfError) {
        if (!gemini && !openai) {
          responseText = null;
        } else {
          responseText = null;
        }
      }
    }
    
    if (!responseText && gemini) {
      try {
        const result = await gemini.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
        });
        responseText = result.text.trim();
        console.log('Using Google Gemini API');
      } catch (geminiError) {
        responseText = null;
      }
    }
    
    if (!responseText && openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational assistant that creates concise, engaging study materials. Always respond with valid JSON only, no additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        responseText = completion.choices[0].message.content.trim();
        console.log('Using OpenAI API');
      } catch (openaiError) {
        responseText = null;
      }
    }
    
    if (!responseText) {
      if (context && context.trim().length > 0) {
        console.log('AI providers failed but Wikipedia context available. Attempting to generate from Wikipedia content directly.');
        return generateFromWikipediaContext(topic, context, mode);
      }
      return generateMockContent(topic, mode);
    }
    
    let parsedData;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('AI returned invalid JSON format');
    }

    if (mode === 'math') {
      if (!parsedData.summary || !parsedData.mathQuestion || !parsedData.studyTip) {
        throw new Error('AI response missing required math mode fields');
      }
    } else {
      if (!parsedData.summary || !parsedData.quiz || !parsedData.studyTip) {
        throw new Error('AI response missing required normal mode fields');
      }
    }

    return {
      success: true,
      data: parsedData
    };

  } catch (error) {
    if (mode === 'math' && isComplexMathProblem(topic)) {
      console.error('Failed to solve complex math problem with AI:', error.message);
      return {
        success: false,
        error: 'Failed to solve complex math problem. AI providers may be unavailable or rate-limited.',
        message: error.message
      };
    }
    
    if (context && context.trim().length > 0) {
      console.log('AI generation error but Wikipedia context available. Generating from Wikipedia content directly.');
      console.error('AI Error:', error.message);
      return generateFromWikipediaContext(topic, context, mode);
    }
    console.error('Error generating AI content:', error.message);
    return generateMockContent(topic, mode);
  }
}

function createNormalModePrompt(topic, context) {
  if (context && context.trim().length > 0) {
    const contextPreview = context.substring(0, 500);
    
    return `You are an expert educational assistant. You MUST create study materials based EXACTLY on the Wikipedia information provided below.

WIKIPEDIA INFORMATION ABOUT "${topic}":
${context}

CRITICAL REQUIREMENTS:
1. The summary MUST contain specific facts, definitions, or concepts mentioned in the Wikipedia text above
2. Each quiz question MUST test knowledge of specific information from the Wikipedia text
3. Quiz questions should ask about concrete facts, definitions, examples, or details from the Wikipedia content
4. DO NOT create generic questions - they must be based on the actual Wikipedia content provided
5. The study tip should be relevant to the specific topic "${topic}" based on the Wikipedia information

Generate study materials in the following JSON format:
{
  "summary": ["specific fact from Wikipedia", "another specific fact from Wikipedia", "third specific fact from Wikipedia"],
  "quiz": [
    {
      "question": "Question about specific information from Wikipedia?",
      "options": ["A) Option based on Wikipedia", "B) Incorrect option", "C) Incorrect option", "D) Incorrect option"],
      "correctAnswer": "A",
      "explanation": "Explanation referencing the Wikipedia content"
    },
    {
      "question": "Another question about specific Wikipedia information?",
      "options": ["A) Incorrect option", "B) Option based on Wikipedia", "C) Incorrect option", "D) Incorrect option"],
      "correctAnswer": "B",
      "explanation": "Explanation referencing the Wikipedia content"
    },
    {
      "question": "Third question about specific Wikipedia information?",
      "options": ["A) Incorrect option", "B) Incorrect option", "C) Option based on Wikipedia", "D) Incorrect option"],
      "correctAnswer": "C",
      "explanation": "Explanation referencing the Wikipedia content"
    }
  ],
  "studyTip": "Practical study tip specific to ${topic} based on the Wikipedia information"
}

IMPORTANT: 
- Use actual information from the Wikipedia text above
- Do NOT create generic or placeholder content
- All content must be derived from the Wikipedia information provided
- Return ONLY valid JSON, no additional text or markdown formatting`;
  } else {
    return `Generate study materials for the topic "${topic}" in the following JSON format:
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "quiz": [
    {
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Brief explanation why this is correct"
    },
    {
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "Brief explanation why this is correct"
    },
    {
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "C",
      "explanation": "Brief explanation why this is correct"
    }
  ],
  "studyTip": "One practical study tip for learning this topic effectively"
}

Important: Return ONLY valid JSON, no additional text or markdown formatting.`;
  }
}

function createMathModePrompt(topic, context) {
  const isComplexProblem = isComplexMathProblem(topic);
  
  if (isComplexProblem) {
    return `You are an expert mathematician and computer scientist. You MUST solve the following problem correctly and provide a detailed explanation.

PROBLEM TO SOLVE:
${topic}

CRITICAL REQUIREMENTS - READ CAREFULLY:

1. If this is an ALGORITHMIC COMPLEXITY question:
   - Analyze the algorithm/data structure step by step
   - Count operations: loops, recursive calls, comparisons, assignments
   - Provide the correct Big O notation (e.g., O(n), O(log n), O(n log n), O(n²), O(1))
   - Explain WHY this is the complexity with detailed reasoning
   - For multiple parts (e.g., "linear search" AND "sort + binary search"), solve EACH part separately
   - Show your work: "For linear search: worst case checks all n elements = O(n)"
   - If asked about "overall complexity", consider ALL steps (e.g., sort O(n log n) + search O(log n) = O(n log n))

2. If this is a SITUATION-BASED or WORD PROBLEM:
   - Read the problem carefully and identify what is being asked
   - Extract key information: numbers, relationships, constraints
   - Set up the problem: define variables, write equations if needed
   - Solve step by step, showing all work
   - Check your answer: does it make sense? Is it reasonable?
   - Provide the final answer with units if applicable

3. If this is a CALCULATION problem:
   - Show ALL steps of your calculation
   - Explain each step clearly
   - Show intermediate results
   - Provide the final numerical answer with appropriate precision

4. If this is a LOGIC or REASONING problem:
   - Explain your reasoning step by step
   - Show how you arrived at the answer
   - Consider edge cases if applicable
   - Use logical deduction or mathematical principles

5. GENERAL REQUIREMENTS:
   - DO NOT return generic or placeholder content
   - DO NOT return hardcoded summaries
   - DO NOT create a new problem - solve the ONE asked
   - ACTUALLY SOLVE THE PROBLEM based on the EXACT question asked
   - Use the specific numbers and details from the problem

Generate your response in the following JSON format:
{
  "summary": [
    "First key concept or step in solving this specific problem",
    "Second key concept or step in solving this specific problem", 
    "Third key concept or step in solving this specific problem"
  ],
  "mathQuestion": {
    "question": "${topic}",
    "answer": "The CORRECT answer to THIS specific problem (use actual numbers from the problem, not generic)",
    "explanation": "Detailed step-by-step explanation showing EXACTLY how to solve THIS problem. Include: (1) Problem analysis, (2) All calculations with numbers from the problem, (3) Algorithm analysis if applicable, (4) Step-by-step reasoning, (5) Final answer with justification. Show your work clearly."
  },
  "studyTip": "A practical tip for understanding and solving similar problems"
}

EXAMPLES:

Example 1 - Algorithmic Complexity:
Question: "You have an array of 1000 numbers. Linear search worst-case time complexity?"
Answer: "O(n) where n = 1000"
Explanation: "For linear search, in the worst case, the target element is at the end of the array or not present. This requires checking all n elements. With n = 1000, we check all 1000 elements. Therefore, worst-case time complexity is O(n)."

Example 2 - Multi-part Complexity:
Question: "You have an array of 1000 numbers. If you sort first then use binary search, what is the overall complexity?"
Answer: "O(n log n)"
Explanation: "Step 1: Sorting an array of n elements using an efficient algorithm (like merge sort or quicksort) has time complexity O(n log n). Step 2: Binary search on a sorted array has time complexity O(log n). Overall complexity: O(n log n) + O(log n) = O(n log n) since O(n log n) dominates."

Example 3 - Situation-based:
Question: "If you have 5 apples and give away 2, how many do you have?"
Answer: "3 apples"
Explanation: "Starting with 5 apples, subtracting 2 apples: 5 - 2 = 3. Therefore, you have 3 apples remaining."

CRITICAL: 
- Solve the ACTUAL problem asked, using the EXACT numbers and details provided
- Show ALL work and reasoning
- For complexity questions, explain the algorithm analysis in detail with step-by-step counting
- For situation-based problems, extract information and solve systematically
- Return ONLY valid JSON, no additional text or markdown formatting`;
  }
  
  if (context && context.trim().length > 0) {
    return `You are an expert educational assistant. Use the following Wikipedia information about "${topic}" to create math/quantitative study materials:

${context}

IMPORTANT: Generate study materials based EXACTLY on the information provided above. The math question must be related to the specific content in the Wikipedia summary.

Generate math/quantitative study materials in the following JSON format:
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "mathQuestion": {
    "question": "A challenging quantitative or logic problem related to this topic",
    "answer": "The correct answer",
    "explanation": "Detailed step-by-step explanation of how to solve this problem"
  },
  "studyTip": "One practical study tip for understanding the mathematical or logical concepts in this topic"
}

Requirements:
- The summary must be based on the Wikipedia content provided above
- The math question must test logical thinking, calculation, or problem-solving related to the specific topic and information provided
- The question should incorporate concepts, numbers, or scenarios mentioned in the Wikipedia summary
- The study tip should be practical and relevant to the mathematical/logical aspects of the topic

Important: Return ONLY valid JSON, no additional text or markdown formatting.`;
  } else {
    return `Generate math/quantitative study materials for the topic "${topic}" in the following JSON format:
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "mathQuestion": {
    "question": "A challenging quantitative or logic problem related to this topic",
    "answer": "The correct answer",
    "explanation": "Detailed step-by-step explanation of how to solve this problem"
  },
  "studyTip": "One practical study tip for understanding the mathematical or logical concepts in this topic"
}

The math question should test logical thinking, calculation, or problem-solving related to the topic.
Important: Return ONLY valid JSON, no additional text or markdown formatting.`;
  }
}

const mockDataDatabase = {
  'python': {
    normal: {
      summary: [
        'Python is a high-level, interpreted programming language known for its simplicity and readability.',
        'It supports multiple programming paradigms including object-oriented, imperative, and functional programming.',
        'Python has a vast ecosystem of libraries and frameworks, making it ideal for web development, data science, AI, and automation.'
      ],
      quiz: [
        {
          question: 'What is the primary advantage of Python\'s syntax?',
          options: [
            'A) It requires minimal code and is highly readable',
            'B) It compiles faster than C++',
            'C) It only works on Windows',
            'D) It cannot handle large datasets'
          ],
          correctAnswer: 'A',
          explanation: 'Python\'s syntax is designed to be clean and readable, allowing developers to express concepts in fewer lines of code compared to other languages.'
        },
        {
          question: 'Which of the following is NOT a common use case for Python?',
          options: [
            'A) Web development with Django or Flask',
            'B) Data analysis and machine learning',
            'C) Operating system kernel development',
            'D) Automation and scripting'
          ],
          correctAnswer: 'C',
          explanation: 'Python is not typically used for low-level system programming like OS kernels. It\'s better suited for high-level applications, data science, and automation.'
        },
        {
          question: 'What is a Python list comprehension?',
          options: [
            'A) A way to create lists using a concise syntax',
            'B) A method to delete list items',
            'C) A debugging tool for Python',
            'D) A type of Python compiler'
          ],
          correctAnswer: 'A',
          explanation: 'List comprehensions provide a concise way to create lists by applying an expression to each item in an iterable, often with optional filtering.'
        }
      ],
      studyTip: 'Practice Python daily by solving coding challenges on platforms like LeetCode or HackerRank. Build small projects to reinforce concepts like functions, classes, and data structures.'
    },
    math: {
      summary: [
        'Python programming involves mathematical concepts like algorithms, data structures, and computational complexity.',
        'Understanding time and space complexity (Big O notation) is crucial for writing efficient Python code.',
        'Python\'s math library and NumPy provide powerful tools for mathematical computations and data analysis.'
      ],
      mathQuestion: {
        question: 'A Python function processes an array of n elements. If it uses a nested loop where the outer loop runs n times and the inner loop runs n times for each outer iteration, what is the time complexity?',
        answer: 'O(n²)',
        explanation: 'With nested loops where each runs n times, the total operations are n × n = n². This gives us quadratic time complexity O(n²), meaning the execution time grows with the square of the input size.'
      },
      studyTip: 'Master Python\'s built-in data structures (lists, dictionaries, sets) and understand their time complexities. Practice algorithm problems to improve your problem-solving skills.'
    }
  },
  'javascript': {
    normal: {
      summary: [
        'JavaScript is a versatile programming language primarily used for web development, enabling interactive and dynamic web pages.',
        'It supports both frontend (browser) and backend (Node.js) development, making it a full-stack language.',
        'JavaScript uses event-driven, asynchronous programming with features like promises and async/await for handling operations.'
      ],
      quiz: [
        {
          question: 'What is the difference between let, const, and var in JavaScript?',
          options: [
            'A) let and const are block-scoped, var is function-scoped',
            'B) They are all identical',
            'C) var is the only one that works in modern JavaScript',
            'D) const allows reassignment but let does not'
          ],
          correctAnswer: 'A',
          explanation: 'let and const are block-scoped (ES6+), meaning they exist only within the block they\'re declared. var is function-scoped and can be accessed throughout the entire function.'
        },
        {
          question: 'What is a closure in JavaScript?',
          options: [
            'A) A function that has access to variables in its outer scope',
            'B) A way to close browser tabs',
            'C) A type of JavaScript error',
            'D) A method to delete variables'
          ],
          correctAnswer: 'A',
          explanation: 'A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing.'
        },
        {
          question: 'What does the === operator do in JavaScript?',
          options: [
            'A) Strict equality check (value and type)',
            'B) Assignment operator',
            'C) Loose equality check (value only)',
            'D) Comparison that ignores type'
          ],
          correctAnswer: 'A',
          explanation: '=== performs strict equality, checking both value and type. Unlike ==, it does not perform type coercion.'
        }
      ],
      studyTip: 'Build interactive web projects to practice JavaScript. Learn modern ES6+ features like arrow functions, destructuring, and template literals. Use browser DevTools to debug and understand code execution.'
    },
    math: {
      summary: [
        'JavaScript handles mathematical operations and can work with numbers, though it has some quirks with floating-point arithmetic.',
        'Understanding algorithms and data structures in JavaScript is essential for efficient programming.',
        'JavaScript\'s Math object provides built-in methods for common mathematical operations.'
      ],
      mathQuestion: {
        question: 'You have an array of 1000 numbers. You need to find if a specific number exists. If you use a linear search (checking each element), what is the worst-case time complexity? If you sort the array first and use binary search, what is the overall complexity?',
        answer: 'Linear search: O(n) = O(1000). Binary search after sorting: O(n log n) for sorting + O(log n) for search = O(n log n) overall.',
        explanation: 'Linear search checks each element once, giving O(n) time. Binary search requires sorting first (O(n log n)) then searching (O(log n)), but for multiple searches, binary search becomes more efficient. For a single search, linear is O(n) vs O(n log n) for sorted + binary.'
      },
      studyTip: 'Practice JavaScript algorithms on platforms like Codewars or LeetCode. Understand array methods (map, filter, reduce) and their time complexities. Learn about recursion and dynamic programming.'
    }
  },
  'java': {
    normal: {
      summary: [
        'Java is an object-oriented programming language known for its "write once, run anywhere" philosophy through the Java Virtual Machine (JVM).',
        'It uses strong typing, garbage collection, and has a rich standard library for building enterprise applications.',
        'Java is widely used in Android development, web applications, enterprise software, and large-scale systems.'
      ],
      quiz: [
        {
          question: 'What is the main difference between an interface and an abstract class in Java?',
          options: [
            'A) Interfaces can have method implementations in Java 8+, abstract classes can have both abstract and concrete methods',
            'B) They are identical',
            'C) Abstract classes cannot have methods',
            'D) Interfaces require all methods to be implemented immediately'
          ],
          correctAnswer: 'A',
          explanation: 'Interfaces define contracts and can have default/static methods (Java 8+). Abstract classes can have both abstract methods (must be overridden) and concrete methods with implementations.'
        },
        {
          question: 'What is the difference between == and .equals() in Java?',
          options: [
            'A) == compares references, .equals() compares values (when overridden)',
            'B) They are the same',
            'C) == only works for primitives',
            'D) .equals() compares memory addresses'
          ],
          correctAnswer: 'A',
          explanation: '== compares object references (memory addresses), while .equals() compares the actual values when properly overridden. For primitives, == compares values.'
        },
        {
          question: 'What is polymorphism in Java?',
          options: [
            'A) The ability of objects to take multiple forms',
            'B) A type of Java compiler',
            'C) A way to delete objects',
            'D) A Java version number'
          ],
          correctAnswer: 'A',
          explanation: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass, enabling method overriding and dynamic method dispatch.'
        }
      ],
      studyTip: 'Practice Java by building projects that use OOP principles. Understand concepts like inheritance, encapsulation, and polymorphism. Use IDEs like IntelliJ IDEA for better development experience.'
    },
    math: {
      summary: [
        'Java programming involves mathematical concepts in algorithms, data structures, and computational problem-solving.',
        'Understanding Big O notation and algorithm efficiency is crucial for writing performant Java applications.',
        'Java provides Math class and BigInteger/BigDecimal for precise mathematical operations.'
      ],
      mathQuestion: {
        question: 'You have a Java method that uses a recursive algorithm with the recurrence relation T(n) = 2T(n/2) + O(n). What is the time complexity using the Master Theorem?',
        answer: 'O(n log n)',
        explanation: 'Using the Master Theorem: a=2, b=2, f(n)=O(n). Since log_b(a) = log_2(2) = 1, and f(n) = Θ(n^1), we have Case 2: T(n) = Θ(n^log_b(a) × log n) = Θ(n log n).'
      },
      studyTip: 'Master Java collections (ArrayList, HashMap, HashSet) and understand their time complexities. Practice algorithm problems focusing on recursion, dynamic programming, and graph algorithms.'
    }
  },
  'biology': {
    normal: {
      summary: [
        'Biology is the study of living organisms, their structure, function, growth, evolution, and distribution.',
        'Key areas include cell biology, genetics, ecology, and physiology, all interconnected in understanding life.',
        'Modern biology integrates with chemistry, physics, and technology to advance fields like biotechnology and medicine.'
      ],
      quiz: [
        {
          question: 'What is the basic unit of life?',
          options: [
            'A) Cell',
            'B) Atom',
            'C) Molecule',
            'D) Organ'
          ],
          correctAnswer: 'A',
          explanation: 'The cell is the basic structural and functional unit of all living organisms. All life processes occur at the cellular level.'
        },
        {
          question: 'What is the process by which plants convert light energy into chemical energy?',
          options: [
            'A) Photosynthesis',
            'B) Respiration',
            'C) Digestion',
            'D) Transpiration'
          ],
          correctAnswer: 'A',
          explanation: 'Photosynthesis is the process where plants use sunlight, water, and carbon dioxide to produce glucose (chemical energy) and oxygen.'
        },
        {
          question: 'What does DNA stand for?',
          options: [
            'A) Deoxyribonucleic Acid',
            'B) Dynamic Nuclear Assembly',
            'C) Double Nucleotide Array',
            'D) Dense Nucleic Acid'
          ],
          correctAnswer: 'A',
          explanation: 'DNA stands for Deoxyribonucleic Acid, the molecule that carries genetic instructions for the development, functioning, and reproduction of all known organisms.'
        }
      ],
      studyTip: 'Use visual aids like diagrams and models to understand biological structures. Create flashcards for terminology. Connect concepts to real-world examples and current research to make biology more engaging.'
    },
    math: {
      summary: [
        'Biology involves mathematical concepts in genetics (probability, statistics), population dynamics, and data analysis.',
        'Understanding exponential growth, logistic growth models, and statistical analysis is essential for biological research.',
        'Bioinformatics combines biology with computational methods and mathematical modeling.'
      ],
      mathQuestion: {
        question: 'A bacterial population doubles every 20 minutes. If you start with 100 bacteria, how many bacteria will there be after 2 hours? Use the formula N = N₀ × 2^(t/T), where N₀ is initial population, t is time, and T is doubling time.',
        answer: '6,400 bacteria',
        explanation: 'Given: N₀ = 100, t = 120 minutes (2 hours), T = 20 minutes. N = 100 × 2^(120/20) = 100 × 2^6 = 100 × 64 = 6,400 bacteria.'
      },
      studyTip: 'Practice calculating growth rates, understanding Punnett squares for genetics, and working with statistical data in biological contexts. Use graphing to visualize population dynamics and experimental results.'
    }
  },
  'chemistry': {
    normal: {
      summary: [
        'Chemistry is the study of matter, its properties, composition, structure, and the changes it undergoes.',
        'It bridges physics and biology, explaining molecular interactions and chemical reactions in nature and industry.',
        'Key branches include organic, inorganic, physical, and analytical chemistry, each with distinct applications.'
      ],
      quiz: [
        {
          question: 'What is the smallest unit of an element that retains its properties?',
          options: [
            'A) Atom',
            'B) Molecule',
            'C) Electron',
            'D) Proton'
          ],
          correctAnswer: 'A',
          explanation: 'An atom is the smallest unit of an element that retains the chemical properties of that element. It consists of protons, neutrons, and electrons.'
        },
        {
          question: 'What is the pH of a neutral solution?',
          options: [
            'A) 7',
            'B) 0',
            'C) 14',
            'D) 1'
          ],
          correctAnswer: 'A',
          explanation: 'A pH of 7 is neutral (neither acidic nor basic). pH < 7 is acidic, pH > 7 is basic. Pure water has a pH of 7.'
        },
        {
          question: 'What type of bond forms when atoms share electrons?',
          options: [
            'A) Covalent bond',
            'B) Ionic bond',
            'C) Hydrogen bond',
            'D) Metallic bond'
          ],
          correctAnswer: 'A',
          explanation: 'A covalent bond forms when two atoms share one or more pairs of electrons, typically between nonmetal atoms.'
        }
      ],
      studyTip: 'Practice balancing chemical equations regularly. Use molecular model kits to visualize 3D structures. Create summary tables for periodic trends, reaction types, and functional groups in organic chemistry.'
    },
    math: {
      summary: [
        'Chemistry requires mathematical skills for stoichiometry, molar calculations, equilibrium constants, and thermodynamics.',
        'Understanding ratios, proportions, and logarithms (for pH, pKa) is essential for solving chemistry problems.',
        'Physical chemistry heavily relies on calculus and mathematical modeling of chemical systems.'
      ],
      mathQuestion: {
        question: 'How many moles are in 88 grams of CO₂? (Atomic masses: C = 12 g/mol, O = 16 g/mol)',
        answer: '2 moles',
        explanation: 'Molar mass of CO₂ = 12 + (16 × 2) = 12 + 32 = 44 g/mol. Number of moles = mass / molar mass = 88 g / 44 g/mol = 2 moles.'
      },
      studyTip: 'Master unit conversions and dimensional analysis. Practice stoichiometry problems step-by-step. Understand how to use the ideal gas law (PV = nRT) and calculate concentrations, pH, and equilibrium constants.'
    }
  },
  'physics': {
    normal: {
      summary: [
        'Physics is the fundamental science studying matter, motion, energy, and the forces that govern the universe.',
        'It encompasses mechanics, thermodynamics, electromagnetism, optics, and quantum physics, explaining natural phenomena.',
        'Physics principles form the foundation for engineering, technology, and understanding the cosmos.'
      ],
      quiz: [
        {
          question: 'What is Newton\'s First Law of Motion?',
          options: [
            'A) An object at rest stays at rest, an object in motion stays in motion unless acted upon by a force',
            'B) F = ma',
            'C) For every action there is an equal and opposite reaction',
            'D) Energy cannot be created or destroyed'
          ],
          correctAnswer: 'A',
          explanation: 'Newton\'s First Law (Law of Inertia) states that objects maintain their state of motion unless acted upon by an unbalanced force.'
        },
        {
          question: 'What is the unit of electric current?',
          options: [
            'A) Ampere (A)',
            'B) Volt (V)',
            'C) Ohm (Ω)',
            'D) Watt (W)'
          ],
          correctAnswer: 'A',
          explanation: 'The ampere (A) is the SI unit of electric current, defined as the flow of one coulomb of charge per second.'
        },
        {
          question: 'What is the speed of light in a vacuum?',
          options: [
            'A) Approximately 3 × 10⁸ m/s',
            'B) 100 m/s',
            'C) 3 × 10⁶ m/s',
            'D) It varies'
          ],
          correctAnswer: 'A',
          explanation: 'The speed of light in a vacuum is approximately 299,792,458 m/s, often rounded to 3 × 10⁸ m/s. It is a fundamental constant of nature.'
        }
      ],
      studyTip: 'Solve physics problems regularly to build problem-solving skills. Draw free-body diagrams for mechanics problems. Understand the relationships between concepts using equations and graphs. Practice unit conversions.'
    },
    math: {
      summary: [
        'Physics is highly mathematical, using calculus, algebra, and trigonometry to describe natural phenomena.',
        'Key mathematical concepts include vectors, derivatives (for velocity/acceleration), integrals (for work/energy), and differential equations.',
        'Understanding dimensional analysis and unit conversions is crucial for solving physics problems correctly.'
      ],
      mathQuestion: {
        question: 'A car accelerates uniformly from rest to 60 m/s in 10 seconds. What is its acceleration? If it then travels at constant speed for 20 seconds, what is the total distance covered?',
        answer: 'Acceleration = 6 m/s², Total distance = 1,500 m',
        explanation: 'Acceleration a = Δv/Δt = (60 - 0) / 10 = 6 m/s². Distance during acceleration: d₁ = ½at² = ½ × 6 × 10² = 300 m. Distance at constant speed: d₂ = v × t = 60 × 20 = 1,200 m. Total distance = 300 + 1,200 = 1,500 m.'
      },
      studyTip: 'Master vector mathematics for forces and motion. Practice using kinematic equations. Learn to set up and solve problems systematically: identify knowns/unknowns, choose appropriate equations, and check units and reasonableness of answers.'
    }
  },
  'calculus': {
    normal: {
      summary: [
        'Calculus is the mathematical study of continuous change, divided into differential and integral calculus.',
        'Differential calculus focuses on rates of change and slopes, while integral calculus deals with accumulation and areas under curves.',
        'Calculus is fundamental to physics, engineering, economics, and many scientific fields for modeling and optimization.'
      ],
      quiz: [
        {
          question: 'What is a derivative?',
          options: [
            'A) The rate of change of a function at a point',
            'B) The area under a curve',
            'C) The sum of a series',
            'D) A type of equation'
          ],
          correctAnswer: 'A',
          explanation: 'A derivative represents the instantaneous rate of change of a function, geometrically interpreted as the slope of the tangent line at a point.'
        },
        {
          question: 'What is an integral?',
          options: [
            'A) The accumulation of a quantity or area under a curve',
            'B) The slope of a line',
            'C) A type of limit',
            'D) A derivative'
          ],
          correctAnswer: 'A',
          explanation: 'An integral represents the accumulation of a quantity, geometrically interpreted as the area under a curve between two points.'
        },
        {
          question: 'What is the Fundamental Theorem of Calculus?',
          options: [
            'A) It connects differentiation and integration',
            'B) It defines limits',
            'C) It solves equations',
            'D) It calculates derivatives only'
          ],
          correctAnswer: 'A',
          explanation: 'The Fundamental Theorem of Calculus establishes the relationship between differentiation and integration, showing they are inverse operations.'
        }
      ],
      studyTip: 'Practice finding derivatives and integrals of various functions. Understand the geometric and physical interpretations. Work through many problems to build intuition. Use graphing tools to visualize functions and their derivatives/integrals.'
    },
    math: {
      summary: [
        'Calculus involves limits, derivatives, integrals, and their applications in optimization, related rates, and area/volume calculations.',
        'Key techniques include the chain rule, product rule, quotient rule for derivatives, and substitution and integration by parts for integrals.',
        'Applications include finding maxima/minima, calculating areas and volumes, and solving differential equations.'
      ],
      mathQuestion: {
        question: 'Find the derivative of f(x) = 3x⁴ - 2x³ + 5x - 7. Then find the critical points where f\'(x) = 0.',
        answer: 'f\'(x) = 12x³ - 6x² + 5. Critical points: Solve 12x³ - 6x² + 5 = 0 (requires numerical methods or factoring).',
        explanation: 'Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹. f\'(x) = 4(3x³) - 3(2x²) + 5(1) - 0 = 12x³ - 6x² + 5. Setting f\'(x) = 0 gives 12x³ - 6x² + 5 = 0, which may require numerical methods to solve.'
      },
      studyTip: 'Master the basic differentiation and integration rules. Practice the chain rule extensively. Work on application problems like optimization and related rates. Understand limits and continuity thoroughly.'
    }
  },
  'algebra': {
    normal: {
      summary: [
        'Algebra is the branch of mathematics dealing with symbols and the rules for manipulating them to solve equations.',
        'It includes linear algebra, polynomial equations, systems of equations, and abstract algebraic structures.',
        'Algebra provides the foundation for advanced mathematics and is essential for problem-solving across disciplines.'
      ],
      quiz: [
        {
          question: 'What is the solution to the equation 2x + 5 = 13?',
          options: [
            'A) x = 4',
            'B) x = 9',
            'C) x = 6',
            'D) x = 8'
          ],
          correctAnswer: 'A',
          explanation: 'Solving: 2x + 5 = 13 → 2x = 13 - 5 → 2x = 8 → x = 4'
        },
        {
          question: 'What is the quadratic formula?',
          options: [
            'A) x = (-b ± √(b² - 4ac)) / 2a',
            'B) x = b ± ac',
            'C) x = a² + b²',
            'D) x = -b/a'
          ],
          correctAnswer: 'A',
          explanation: 'The quadratic formula x = (-b ± √(b² - 4ac)) / 2a solves equations of the form ax² + bx + c = 0.'
        },
        {
          question: 'What is a system of linear equations?',
          options: [
            'A) Multiple equations with multiple variables solved simultaneously',
            'B) A single equation',
            'C) An equation with no solution',
            'D) A type of graph'
          ],
          correctAnswer: 'A',
          explanation: 'A system of linear equations consists of multiple linear equations with the same variables, solved together to find values satisfying all equations.'
        }
      ],
      studyTip: 'Practice solving equations step-by-step. Learn to factor polynomials and recognize common patterns. Use substitution and elimination methods for systems. Work on word problems to apply algebraic concepts.'
    },
    math: {
      summary: [
        'Algebra involves solving equations, working with polynomials, factoring, and understanding functions and their properties.',
        'Key concepts include linear equations, quadratic equations, systems of equations, and matrix operations.',
        'Algebraic manipulation skills are essential for calculus and higher mathematics.'
      ],
      mathQuestion: {
        question: 'Solve the system of equations: 2x + 3y = 12 and x - y = 1. Find the values of x and y.',
        answer: 'x = 3, y = 2',
        explanation: 'From x - y = 1, we get x = y + 1. Substituting into the first equation: 2(y + 1) + 3y = 12 → 2y + 2 + 3y = 12 → 5y = 10 → y = 2. Then x = 2 + 1 = 3.'
      },
      studyTip: 'Master factoring techniques (GCF, difference of squares, trinomials). Practice solving systems using substitution and elimination. Understand function notation and operations. Work on word problems to build problem-solving skills.'
    }
  },
  'world war ii': {
    normal: {
      summary: [
        'World War II (1939-1945) was a global conflict involving most of the world\'s nations, resulting in unprecedented destruction and loss of life.',
        'Key events include the rise of fascism, the Holocaust, major battles in Europe and the Pacific, and the use of atomic weapons.',
        'The war reshaped global politics, led to the formation of the United Nations, and marked the beginning of the Cold War era.'
      ],
      quiz: [
        {
          question: 'When did World War II begin and end?',
          options: [
            'A) 1939-1945',
            'B) 1914-1918',
            'C) 1941-1945',
            'D) 1935-1943'
          ],
          correctAnswer: 'A',
          explanation: 'World War II officially began on September 1, 1939, with Germany\'s invasion of Poland, and ended on September 2, 1945, with Japan\'s surrender.'
        },
        {
          question: 'Which event brought the United States into World War II?',
          options: [
            'A) Attack on Pearl Harbor',
            'B) Invasion of Poland',
            'C) Battle of Stalingrad',
            'D) D-Day'
          ],
          correctAnswer: 'A',
          explanation: 'The Japanese attack on Pearl Harbor on December 7, 1941, prompted the United States to declare war on Japan and enter World War II.'
        },
        {
          question: 'What was the Holocaust?',
          options: [
            'A) The systematic persecution and murder of six million Jews and millions of others by Nazi Germany',
            'B) A battle in the Pacific',
            'C) A peace treaty',
            'D) A military strategy'
          ],
          correctAnswer: 'A',
          explanation: 'The Holocaust was the systematic, state-sponsored persecution and murder of six million Jews and millions of other victims by Nazi Germany and its collaborators.'
        }
      ],
      studyTip: 'Create timelines to understand the chronological sequence of events. Study maps to see how the war spread globally. Read primary sources and personal accounts to understand different perspectives. Connect causes and consequences.'
    },
    math: {
      summary: [
        'World War II can be analyzed mathematically through statistics: casualties, economic costs, production numbers, and population changes.',
        'Understanding data visualization, percentages, and statistical analysis helps interpret the scale and impact of the war.',
        'Mathematical models can analyze military strategies, resource allocation, and economic impacts of the conflict.'
      ],
      mathQuestion: {
        question: 'If a country\'s population was 50 million before World War II and decreased by 8% due to war casualties, what was the population after? If the population then grew at 2% per year for 5 years, what was the final population?',
        answer: 'After war: 46 million. After 5 years: approximately 50.8 million',
        explanation: 'After 8% decrease: 50M × 0.92 = 46 million. After 5 years at 2% growth: 46 × (1.02)⁵ = 46 × 1.104 = 50.784 million ≈ 50.8 million.'
      },
      studyTip: 'Analyze historical data using statistics and graphs. Calculate percentages for casualties, economic costs, and population changes. Use mathematical reasoning to understand scale and proportions in historical events.'
    }
  },
  'machine learning': {
    normal: {
      summary: [
        'Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience without explicit programming.',
        'It uses algorithms to identify patterns in data, make predictions, and automate decision-making processes.',
        'Key types include supervised learning, unsupervised learning, and reinforcement learning, each with different applications.'
      ],
      quiz: [
        {
          question: 'What is the difference between supervised and unsupervised learning?',
          options: [
            'A) Supervised uses labeled data, unsupervised finds patterns in unlabeled data',
            'B) They are identical',
            'C) Supervised requires no data',
            'D) Unsupervised always needs labels'
          ],
          correctAnswer: 'A',
          explanation: 'Supervised learning uses labeled training data (input-output pairs), while unsupervised learning finds hidden patterns in data without labeled examples.'
        },
        {
          question: 'What is overfitting in machine learning?',
          options: [
            'A) When a model learns training data too well but fails on new data',
            'B) When a model is too simple',
            'C) When training takes too long',
            'D) When data is missing'
          ],
          correctAnswer: 'A',
          explanation: 'Overfitting occurs when a model memorizes training data patterns (including noise) but doesn\'t generalize well to unseen data, indicating poor model performance.'
        },
        {
          question: 'What is a neural network?',
          options: [
            'A) A computing system inspired by biological neural networks',
            'B) A type of database',
            'C) A programming language',
            'D) A hardware component'
          ],
          correctAnswer: 'A',
          explanation: 'A neural network is a machine learning model inspired by the human brain, consisting of interconnected nodes (neurons) that process information through layers.'
        }
      ],
      studyTip: 'Start with fundamental concepts like linear regression and classification. Practice with real datasets on platforms like Kaggle. Understand the bias-variance tradeoff. Learn to evaluate models using metrics like accuracy, precision, and recall.'
    },
    math: {
      summary: [
        'Machine Learning is deeply mathematical, using linear algebra, calculus, probability, and statistics.',
        'Key mathematical concepts include gradient descent, cost functions, matrix operations, and probability distributions.',
        'Understanding derivatives (for backpropagation), matrix multiplication, and statistical measures is essential for ML.'
      ],
      mathQuestion: {
        question: 'In linear regression, you have the cost function J(θ) = (1/2m) Σ(h(x) - y)². If you have 100 training examples (m=100), and the sum of squared errors is 500, what is the cost? What does minimizing this cost achieve?',
        answer: 'Cost = 2.5. Minimizing achieves the best-fit line.',
        explanation: 'J(θ) = (1/2 × 100) × 500 = (1/200) × 500 = 2.5. Minimizing this cost function finds the parameters (θ) that create the line of best fit, minimizing prediction errors.'
      },
      studyTip: 'Master linear algebra (matrix operations, vectors) and calculus (derivatives for gradient descent). Understand probability and statistics for data analysis. Practice implementing algorithms from scratch to deepen mathematical understanding.'
    }
  },
  'data structures': {
    normal: {
      summary: [
        'Data structures are ways of organizing and storing data in computer memory for efficient access and modification.',
        'Common structures include arrays, linked lists, stacks, queues, trees, and hash tables, each with different use cases.',
        'Choosing the right data structure is crucial for algorithm efficiency and optimal program performance.'
      ],
      quiz: [
        {
          question: 'What is the time complexity of accessing an element in an array by index?',
          options: [
            'A) O(1) - constant time',
            'B) O(n) - linear time',
            'C) O(log n) - logarithmic time',
            'D) O(n²) - quadratic time'
          ],
          correctAnswer: 'A',
          explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory, allowing direct calculation of the element\'s address.'
        },
        {
          question: 'What is the main advantage of a hash table?',
          options: [
            'A) Average O(1) lookup, insert, and delete operations',
            'B) Always sorted',
            'C) No collisions possible',
            'D) Unlimited size'
          ],
          correctAnswer: 'A',
          explanation: 'Hash tables provide average-case O(1) time complexity for basic operations by using a hash function to map keys to array indices.'
        },
        {
          question: 'What is the difference between a stack and a queue?',
          options: [
            'A) Stack is LIFO (Last In First Out), queue is FIFO (First In First Out)',
            'B) They are identical',
            'C) Stack is FIFO, queue is LIFO',
            'D) Both are random access'
          ],
          correctAnswer: 'A',
          explanation: 'A stack follows LIFO (like a stack of plates), while a queue follows FIFO (like a line of people). This affects insertion and removal order.'
        }
      ],
      studyTip: 'Visualize data structures using diagrams. Practice implementing them from scratch in your preferred language. Understand time and space complexities. Solve problems on platforms like LeetCode that require specific data structures.'
    },
    math: {
      summary: [
        'Data structures involve mathematical analysis of time and space complexity using Big O notation.',
        'Understanding algorithms requires mathematical reasoning about operations, comparisons, and memory usage.',
        'Tree structures involve mathematical properties like height, depth, and balancing algorithms with logarithmic complexity.'
      ],
      mathQuestion: {
        question: 'A binary search tree has n nodes. What is the best-case, average-case, and worst-case time complexity for searching? What determines the worst case?',
        answer: 'Best: O(1), Average: O(log n), Worst: O(n). Worst case occurs when the tree is unbalanced (like a linked list).',
        explanation: 'Best case: target is root (O(1)). Average case: balanced tree gives O(log n) as you eliminate half the tree each level. Worst case: unbalanced tree (all nodes on one side) becomes O(n) like a linear search.'
      },
      studyTip: 'Master Big O notation and complexity analysis. Practice calculating time/space complexity for different operations. Understand mathematical properties of trees (height, balance). Learn to analyze algorithm efficiency mathematically.'
    }
  }
};

function findMatchingTopic(topic) {
  const topicLower = topic.toLowerCase().trim();
  
  if (mockDataDatabase[topicLower]) {
    return topicLower;
  }
  
  for (const key in mockDataDatabase) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      return key;
    }
  }
  const variations = {
    'python programming': 'python',
    'javascript programming': 'javascript',
    'java programming': 'java',
    'biology science': 'biology',
    'chemistry science': 'chemistry',
    'physics science': 'physics',
    'calculus math': 'calculus',
    'algebra math': 'algebra',
    'ww2': 'world war ii',
    'world war 2': 'world war ii',
    'ml': 'machine learning',
    'ai': 'machine learning',
    'artificial intelligence': 'machine learning'
  };
  
  for (const [variation, match] of Object.entries(variations)) {
    if (topicLower.includes(variation) || topicLower === match) {
      return match;
    }
  }
  
  return null;
}

function isMathExpression(topic) {
  const cleaned = topic.replace(/\s+/g, '');
  const mathPattern = /^[\d+\-*/().\s]+$/;
  const hasOperators = /[+\-*/=]/.test(cleaned);
  const hasNumbers = /\d/.test(cleaned);
  
  return mathPattern.test(cleaned) && hasOperators && hasNumbers;
}

function isComplexMathProblem(topic) {
  const lowerTopic = topic.toLowerCase();
  
  const complexityKeywords = [
    'time complexity', 'space complexity', 'big o', 'worst-case', 'best-case',
    'linear search', 'binary search', 'sort', 'algorithm', 'array', 'worst case',
    'overall complexity', 'asymptotic', 'o(n)', 'o(log n)', 'o(n log n)',
    'data structure', 'tree', 'graph', 'hash', 'heap', 'stack', 'queue'
  ];
  
  const calculationKeywords = [
    'calculate', 'solve', 'find', 'what is', 'how many', 'determine',
    'compute', 'evaluate', 'result', 'answer', 'work out', 'figure out'
  ];
  
  const problemIndicators = [
    'if you', 'suppose', 'given that', 'assume', 'problem', 'question',
    'how would', 'what would', 'how much', 'how long', 'scenario',
    'situation', 'case', 'example', 'instance', 'when', 'where'
  ];
  
  const situationKeywords = [
    'you have', 'you are', 'you need', 'you want', 'given',
    'there are', 'there is', 'consider', 'imagine', 'think about',
    'word problem', 'story problem', 'real-world', 'practical'
  ];
  
  const wordProblemIndicators = [
    'how many', 'how much', 'how long', 'how far', 'how fast',
    'what is the', 'what are the', 'which', 'why', 'explain'
  ];
  
  const hasComplexityTerms = complexityKeywords.some(keyword => lowerTopic.includes(keyword));
  const hasCalculationTerms = calculationKeywords.some(keyword => lowerTopic.includes(keyword));
  const hasProblemIndicators = problemIndicators.some(keyword => lowerTopic.includes(keyword));
  const hasSituationKeywords = situationKeywords.some(keyword => lowerTopic.includes(keyword));
  const hasWordProblemIndicators = wordProblemIndicators.some(keyword => lowerTopic.includes(keyword));
  const hasQuestionMark = topic.includes('?');
  const hasMultipleSentences = topic.split(/[.!?]/).length > 2;
  
  return hasComplexityTerms || 
         hasSituationKeywords ||
         (hasCalculationTerms && hasProblemIndicators) || 
         (hasWordProblemIndicators && hasMultipleSentences) ||
         (hasQuestionMark && (hasComplexityTerms || hasCalculationTerms || hasSituationKeywords));
}

function safeEval(expression) {
  try {
    const cleaned = expression.replace(/\s+/g, '');
    if (!/^[\d+\-*/().]+$/.test(cleaned)) {
      return null;
    }
    return Function(`"use strict"; return (${cleaned})`)();
  } catch (error) {
    return null;
  }
}

function generateMathExpressionSolution(expression) {
  const result = safeEval(expression);
  
  if (result === null) {
    return {
      success: true,
      data: {
        summary: [
          `The expression "${expression}" contains mathematical operations`,
          'Mathematical expressions follow order of operations (PEMDAS)',
          'Understanding basic arithmetic is fundamental to mathematics'
        ],
        mathQuestion: {
          question: `Evaluate the expression: ${expression}`,
          answer: 'Unable to evaluate - please check the expression format',
          explanation: 'The expression could not be safely evaluated. Please ensure it contains only numbers and basic operators (+, -, *, /, parentheses).'
        },
        studyTip: 'Practice basic arithmetic operations. Remember PEMDAS: Parentheses, Exponents, Multiplication/Division, Addition/Subtraction.'
      }
    };
  }
  
  const parts = expression.split(/[+\-*/]/).map(p => p.trim()).filter(p => p);
  const operators = expression.match(/[+\-*/]/g) || [];
  
  let explanation = `To solve ${expression}: `;
  if (operators.length === 1) {
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    const op = operators[0];
    
    if (op === '+') {
      explanation = `${a} + ${b} = ${result}. Adding ${a} and ${b} gives us ${result}.`;
    } else if (op === '-') {
      explanation = `${a} - ${b} = ${result}. Subtracting ${b} from ${a} gives us ${result}.`;
    } else if (op === '*') {
      explanation = `${a} × ${b} = ${result}. Multiplying ${a} by ${b} gives us ${result}.`;
    } else if (op === '/') {
      explanation = `${a} ÷ ${b} = ${result}. Dividing ${a} by ${b} gives us ${result}.`;
    }
  } else {
    explanation = `Following order of operations (PEMDAS), ${expression} = ${result}.`;
  }
  
  return {
    success: true,
    data: {
      summary: [
        `The expression "${expression}" evaluates to ${result}`,
        'Mathematical expressions follow the order of operations (PEMDAS)',
        'Basic arithmetic operations are fundamental to all mathematics'
      ],
      mathQuestion: {
        question: `What is the result of: ${expression}?`,
        answer: `${result}`,
        explanation: explanation
      },
      studyTip: 'Practice mental math regularly. Break down complex expressions into smaller parts. Remember PEMDAS: Parentheses, Exponents, Multiplication/Division (left to right), Addition/Subtraction (left to right).'
    }
  };
}

function generateFromWikipediaContext(topic, context, mode) {
  try {
    console.log(`📖 Generating content from Wikipedia for: ${topic}`);
    console.log(`📄 Wikipedia context preview: ${context.substring(0, 200)}...`);
    
    const cleanedContext = context.replace(/\s+/g, ' ').trim();
    const sentences = cleanedContext.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 500);
    
    console.log(`📊 Found ${sentences.length} meaningful sentences from Wikipedia`);
    
    let summary = [];
    
    if (sentences.length >= 3) {
      summary = sentences.slice(0, 3).map(s => {
        if (s.length > 150) {
          return s.substring(0, 147) + '...';
        }
        return s;
      });
    } else if (sentences.length > 0) {
      summary = sentences.map(s => {
        if (s.length > 150) {
          return s.substring(0, 147) + '...';
        }
        return s;
      });
      
      while (summary.length < 3 && cleanedContext.length > summary.join('').length) {
        const usedLength = summary.join('').length;
        const remaining = cleanedContext.substring(usedLength);
        const nextChunk = remaining.substring(0, 150).trim();
        if (nextChunk.length > 30) {
          summary.push(nextChunk + (nextChunk.length >= 150 ? '...' : ''));
        } else {
          break;
        }
      }
    } else {
      summary.push(cleanedContext.substring(0, 150).trim() + '...');
      if (cleanedContext.length > 150) {
        summary.push(cleanedContext.substring(150, 300).trim() + '...');
      }
      if (cleanedContext.length > 300) {
        summary.push(cleanedContext.substring(300, 450).trim() + '...');
      }
    }
    
    while (summary.length < 3) {
      summary.push(cleanedContext.substring(summary.join('').length, summary.join('').length + 150).trim() + '...');
      if (summary.join('').length >= cleanedContext.length) break;
    }
    
    summary = summary.slice(0, 3);
    
    console.log(`Created summary with ${summary.length} points from Wikipedia`);
    
    if (mode === 'math') {
      const numbers = context.match(/\d+(?:\.\d+)?/g) || [];
      const sentences2 = cleanedContext.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 500);
      
      let mathQuestion;
      
      if (numbers.length >= 2 && sentences2.length > 0) {
        const num1 = parseFloat(numbers[0]);
        const num2 = parseFloat(numbers[1]);
        const operation = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
        
        let result;
        let explanation;
        
        if (operation === '+') {
          result = num1 + num2;
          explanation = `Adding ${num1} and ${num2} gives us ${result}.`;
        } else if (operation === '-') {
          result = Math.abs(num1 - num2);
          explanation = `The difference between ${num1} and ${num2} is ${result}.`;
        } else if (operation === '*') {
          result = num1 * num2;
          explanation = `Multiplying ${num1} by ${num2} gives us ${result}.`;
        } else {
          if (num2 !== 0) {
            result = (num1 / num2).toFixed(2);
            explanation = `Dividing ${num1} by ${num2} gives us ${result}.`;
          } else {
            result = num1 + num2;
            explanation = `Adding ${num1} and ${num2} gives us ${result} (division by zero avoided).`;
          }
        }
        
        mathQuestion = {
          question: `Based on the information about ${topic}, if we have ${num1} and ${num2} (numbers mentioned in the article), what is ${num1} ${operation} ${num2}?`,
          answer: `${result}`,
          explanation: `${explanation} This calculation is based on numerical data from the Wikipedia article about ${topic}.`
        };
      } else {
        const firstSentence = sentences2[0] || cleanedContext.substring(0, 200);
        const wordCount = firstSentence.split(/\s+/).length;
        const charCount = firstSentence.length;
        
        mathQuestion = {
          question: `Based on the Wikipedia information about ${topic}, if the first key point contains ${wordCount} words and ${charCount} characters, what is the average number of characters per word? Round to 2 decimal places.`,
          answer: `${(charCount / wordCount).toFixed(2)}`,
          explanation: `To find the average characters per word, divide total characters (${charCount}) by total words (${wordCount}): ${charCount} ÷ ${wordCount} = ${(charCount / wordCount).toFixed(2)} characters per word.`
        };
      }
      
      return {
        success: true,
        data: {
          summary: summary,
          mathQuestion: mathQuestion,
          studyTip: `To master ${topic}, practice quantitative problems related to the concepts. Break down complex calculations into smaller steps.`
        }
      };
    } else {
      const quiz = [];
      
      const firstPart = sentences[0] || cleanedContext.substring(0, 200);
      const middlePart = sentences[Math.floor(sentences.length / 2)] || cleanedContext.substring(200, 400);
      const laterPart = sentences[Math.min(2, sentences.length - 1)] || cleanedContext.substring(400, 600);
      
      if (firstPart && firstPart.length > 20) {
        const questionText = firstPart.length > 100 
          ? `What is ${topic} according to the information provided?`
          : `According to the Wikipedia information, what is ${topic}?`;
        
        const correctAnswer = firstPart.length > 100 ? firstPart.substring(0, 100) + '...' : firstPart;
        
        quiz.push({
          question: questionText,
          options: [
            `A) ${correctAnswer}`,
            'B) A medical procedure unrelated to this topic',
            'C) A technology concept with no clear definition',
            'D) An undefined term with no specific meaning'
          ],
          correctAnswer: 'A',
          explanation: `This definition comes directly from the Wikipedia article: "${firstPart.substring(0, 120)}${firstPart.length > 120 ? '...' : ''}"`
        });
      }
      
      if (middlePart && middlePart.length > 20) {
        const keyConcept = middlePart.length > 80 ? middlePart.substring(0, 80) + '...' : middlePart;
        
        quiz.push({
          question: `What is a key aspect, characteristic, or method related to ${topic} mentioned in the Wikipedia information?`,
          options: [
            'A) An approach that is not mentioned in the information',
            `B) ${keyConcept}`,
            'C) A concept that contradicts the provided information',
            'D) Something completely unrelated to the topic'
          ],
          correctAnswer: 'B',
          explanation: `This aspect is mentioned in the Wikipedia article: "${middlePart.substring(0, 120)}${middlePart.length > 120 ? '...' : ''}"`
        });
      }
      
      if (laterPart && laterPart.length > 20) {
        const application = laterPart.length > 80 ? laterPart.substring(0, 80) + '...' : laterPart;
        
        quiz.push({
          question: `Based on the Wikipedia information, how is ${topic} used, why is it important, or what are its applications?`,
          options: [
            'A) It has no practical applications or importance',
            'B) It is only used in theoretical contexts',
            `C) ${application}`,
            'D) It is not relevant to any field'
          ],
          correctAnswer: 'C',
          explanation: `This information comes from the Wikipedia article: "${laterPart.substring(0, 120)}${laterPart.length > 120 ? '...' : ''}"`
        });
      }
      
      while (quiz.length < 3) {
        const remainingContext = cleanedContext.substring(quiz.length * 200, (quiz.length + 1) * 200);
        if (remainingContext.length > 30) {
          quiz.push({
            question: `What information about ${topic} can you learn from the Wikipedia article?`,
            options: [
              `A) ${remainingContext.substring(0, 80)}${remainingContext.length > 80 ? '...' : ''}`,
              'B) Information that contradicts the Wikipedia article',
              'C) Details not mentioned in the provided information',
              'D) Facts unrelated to the topic'
            ],
            correctAnswer: 'A',
            explanation: `This information is based on the Wikipedia content provided about ${topic}.`
          });
        } else {
          break;
        }
      }
      
      if (quiz.length < 3) {
        summary.slice(0, 3 - quiz.length).forEach((summaryPoint, idx) => {
          if (summaryPoint.length > 30) {
            quiz.push({
              question: `Which of the following is mentioned in the Wikipedia information about ${topic}?`,
              options: [
                `A) ${summaryPoint.substring(0, 80)}${summaryPoint.length > 80 ? '...' : ''}`,
                'B) Information not found in the Wikipedia article',
                'C) Details that contradict the provided information',
                'D) Facts unrelated to the topic'
              ],
              correctAnswer: 'A',
              explanation: `This is based on the Wikipedia information: "${summaryPoint.substring(0, 100)}${summaryPoint.length > 100 ? '...' : ''}"`
            });
          }
        });
      }
      
      console.log(`Created ${quiz.length} quiz questions from Wikipedia content`);
      
      return {
        success: true,
        data: {
          summary: summary,
          quiz: quiz,
          studyTip: `To effectively study ${topic}, review the key points from the Wikipedia article and focus on understanding the main concepts and their relationships.`
        }
      };
    }
  } catch (error) {
    console.error('Error generating from Wikipedia context:', error);
    return generateMockContent(topic, mode);
  }
}

function generateMockContent(topic, mode) {
  const matchedTopic = findMatchingTopic(topic);
  const topicData = matchedTopic ? mockDataDatabase[matchedTopic] : null;
  
  if (matchedTopic) {
    console.log(`📚 Using topic-specific content for: ${matchedTopic} (${mode} mode)`);
  }
  
  if (mode === 'math') {
    if (topicData && topicData.math) {
      return {
        success: true,
        data: topicData.math
      };
    }
    
    return {
      success: true,
      data: {
        summary: [
          `${topic} involves important mathematical concepts and quantitative analysis.`,
          `Key principles require understanding numerical relationships and logical reasoning.`,
          `Applications of ${topic} can be modeled and solved using mathematical methods.`
        ],
        mathQuestion: {
          question: `A study session on ${topic} requires learning 8 key concepts. If you learn 3 concepts per day, how many full days are needed? How many concepts remain on the last day?`,
          answer: '3 full days (9 concepts total), with 1 concept remaining on day 3',
          explanation: `Day 1: 3 concepts, Day 2: 3 concepts, Day 3: 3 concepts = 9 total. But you only need 8, so: Day 1: 3, Day 2: 3, Day 3: 2 concepts. So 3 full days are needed, with 2 concepts on the last day (not 1 remaining - actually you complete all 8 in 3 days with 2 on day 3).`
        },
        studyTip: `Break down mathematical problems in ${topic} into smaller steps. Practice with real examples and use visual aids like graphs or diagrams to understand relationships.`
      }
    };
  }

  if (topicData && topicData.normal) {
    return {
      success: true,
      data: topicData.normal
    };
  }
  
  return {
    success: true,
    data: {
      summary: [
        `${topic} is a fascinating subject with many practical applications and real-world relevance.`,
        `Understanding ${topic} requires studying its fundamental principles, key concepts, and underlying theories.`,
        `${topic} has significant importance in modern contexts and connects to various related fields and disciplines.`
      ],
      quiz: [
        {
          question: `What is a fundamental concept in ${topic}?`,
          options: [
            'A) Understanding core principles and foundational knowledge',
            'B) Memorizing unrelated facts',
            'C) Avoiding practical applications',
            'D) Ignoring theoretical frameworks'
          ],
          correctAnswer: 'A',
          explanation: 'A solid understanding of fundamental concepts and core principles forms the foundation for deeper learning in any subject.'
        },
        {
          question: `Why is studying ${topic} valuable?`,
          options: [
            'A) It has limited real-world applications',
            'B) It helps develop critical thinking and problem-solving skills',
            'C) It is only useful for academic purposes',
            'D) It has no connection to other subjects'
          ],
          correctAnswer: 'B',
          explanation: 'Studying any topic develops critical thinking, problem-solving abilities, and helps you understand connections between different areas of knowledge.'
        },
        {
          question: `What is the best approach to learning ${topic}?`,
          options: [
            'A) Passive reading without practice',
            'B) Active engagement with examples, practice problems, and real-world applications',
            'C) Memorizing without understanding',
            'D) Avoiding hands-on practice'
          ],
          correctAnswer: 'B',
          explanation: 'Active learning through practice, examples, and real-world applications is the most effective way to truly understand and retain knowledge.'
        }
      ],
      studyTip: `Create study guides and summaries for ${topic}. Use active recall techniques like flashcards and practice questions. Connect new concepts to what you already know. Teach the material to someone else to reinforce your understanding.`
    }
  };
}

