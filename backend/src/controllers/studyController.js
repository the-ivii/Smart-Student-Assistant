import { fetchWikipediaData } from '../services/wikipediaService.js';
import { generateAIContent } from '../services/aiService.js';
import User from '../models/User.js';
import { adminDb } from '../config/firebase.js';

/**
 * Extracts the main topic from questions or complex queries
 * Examples:
 * - "What is Python?" -> "Python"
 * - "What is a Python list comprehension?" -> "Python list comprehension"
 * - "Tell me about Machine Learning" -> "Machine Learning"
 * - "Quantum computing" -> "Quantum computing"
 */
function extractMainTopic(query) {
  if (!query) return '';
  
  // Remove common question prefixes
  let cleaned = query
    .replace(/^(what is|what's|what are|tell me about|explain|describe|define|what do you know about)\s+/i, '')
    .replace(/\?+$/, '') // Remove trailing question marks
    .trim();
  
  // If it starts with "a" or "an", remove it (but keep the rest)
  cleaned = cleaned.replace(/^(a|an)\s+/i, '');
  
  // If the cleaned query is short (1-4 words), use it as-is
  // This preserves multi-word topics like "Machine Learning", "Quantum Computing", etc.
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length <= 4) {
    // Return the cleaned query, preserving multi-word topics
    return cleaned;
  }
  
  // For longer queries, try to extract the main topic
  // Look for capitalized words or common tech terms
  const techTerms = ['python', 'javascript', 'java', 'machine', 'learning', 'data', 'structure', 'algorithm', 'calculus', 'algebra', 'biology', 'chemistry', 'physics', 'quantum', 'computing', 'artificial', 'intelligence', 'neural', 'network'];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (techTerms.includes(word)) {
      // Return the tech term and potentially the next word
      if (i + 1 < words.length && (word === 'machine' || word === 'data' || word === 'world' || word === 'war' || word === 'artificial' || word === 'neural' || word === 'quantum')) {
        return `${words[i]} ${words[i + 1]}`;
      }
      return words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    // If word is capitalized, it's likely the main topic
    if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 2) {
      // Check if next word should be included (e.g., "Machine Learning", "World War", "Quantum Computing")
      if (i + 1 < words.length && 
          (words[i].toLowerCase() === 'machine' || 
           words[i].toLowerCase() === 'world' || 
           words[i].toLowerCase() === 'data' ||
           words[i].toLowerCase() === 'artificial' ||
           words[i].toLowerCase() === 'neural' ||
           words[i].toLowerCase() === 'quantum')) {
        return `${words[i]} ${words[i + 1]}`;
      }
      // For single capitalized words, return it with next word if it makes sense
      if (i + 1 < words.length && words[i + 1].length > 2) {
        return `${words[i]} ${words[i + 1]}`;
      }
      return words[i];
    }
  }
  
  // Fallback: return first 3 words (better for multi-word topics)
  return words.slice(0, 3).join(' ') || cleaned;
}

export async function getStudyMaterial(req, res) {
  try {
    const { topic, mode = 'normal' } = req.query;

    // Validate input
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Topic parameter is required'
      });
    }

    if (!['normal', 'math'].includes(mode)) {
      return res.status(400).json({
        error: true,
        message: 'Mode must be either "normal" or "math"'
      });
    }

    console.log(`Processing request for topic: "${topic}", mode: ${mode}`);

    // For math mode, use original topic (complex problems need full question)
    // For normal mode, extract main topic (e.g., "What is Python?" -> "Python")
    const topicToUse = mode === 'math' ? topic : extractMainTopic(topic);
    const cleanTopic = mode === 'math' ? topic : extractMainTopic(topic);

    // Step 1: Fetch data from Wikipedia (skip for math mode - we need to solve, not look up)
    let wikipediaData = { success: false, extract: '', error: 'Skipped for math mode' };
    
    // CRITICAL: For math mode, skip Wikipedia entirely
    // Math problems need to be solved, not looked up in Wikipedia
    // Wikipedia would give irrelevant content (like "numerical integration" article)
    if (mode === 'normal') {
      wikipediaData = await fetchWikipediaData(topicToUse);
      
      // If original topic fails, try the cleaned version
      if (!wikipediaData.success && cleanTopic !== topic) {
        console.log(`Trying original topic "${topic}" after cleaned version failed`);
        wikipediaData = await fetchWikipediaData(topic);
      }
    } else {
      console.log(`⚠️ Wikipedia fetch skipped for math mode - will solve the problem directly`);
    }

    // Use Wikipedia context if available, otherwise empty string
    // For complex math problems, context will be cleared in generateAIContent
    const context = wikipediaData.success ? wikipediaData.extract : '';
    
    if (wikipediaData.success) {
      console.log(`✅ Wikipedia data fetched successfully. Context length: ${context.length} characters`);
      console.log(`Wikipedia title: ${wikipediaData.title}`);
    } else {
      console.log(`⚠️ Wikipedia fetch skipped or failed. Will use AI or mock data.`);
    }

    // Step 2: Generate AI content
    // For math mode, pass original topic (needed for complex problems)
    // For normal mode, use cleaned topic for better matching
    const aiContent = await generateAIContent(
      mode === 'math' ? topic : cleanTopic, // Use original topic for math mode
      context, // Pass Wikipedia context (will be cleared for complex math problems)
      mode
    );

    if (!aiContent.success) {
      return res.status(500).json({
        error: true,
        message: 'Failed to generate study materials',
        details: aiContent.error
      });
    }

    // Step 3: Save to user's history if authenticated
    if (req.userId) {
      try {
        if (req.authType === 'firebase') {
          // Save to Firestore
          const userRef = adminDb.collection('users').doc(req.firebaseUid);
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const studyHistory = userData.studyHistory || [];
            
            // Add new history item with unique ID
            const newItem = {
              id: `firebase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              topic: cleanTopic,
              mode: mode,
              timestamp: new Date().toISOString()
            };
            
            studyHistory.unshift(newItem);
            
            // Keep only last 50 items
            const updatedHistory = studyHistory.slice(0, 50);
            
            await userRef.update({
              studyHistory: updatedHistory
            });
          }
        } else {
          // Save to MongoDB (for backward compatibility)
          await User.findByIdAndUpdate(
            req.userId,
            {
              $push: {
                studyHistory: {
                  $each: [{
                    topic: cleanTopic,
                    mode: mode,
                    timestamp: new Date()
                  }],
                  $slice: -50 // Keep only last 50 items
                }
              }
            }
          );
        }
      } catch (historyError) {
        console.error('Error saving to history:', historyError);
        // Don't fail the request if history save fails
      }
    }

    // Step 4: Return formatted response
    res.json({
      success: true,
      topic: cleanTopic,
      mode: mode,
      timestamp: new Date().toISOString(),
      source: wikipediaData.success ? wikipediaData.url : null,
      ...aiContent.data
    });

  } catch (error) {
    console.error('Error in getStudyMaterial:', error);
    res.status(500).json({
      error: true,
      message: 'An unexpected error occurred',
      details: error.message
    });
  }
}

