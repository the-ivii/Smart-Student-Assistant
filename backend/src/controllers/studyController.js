import { fetchWikipediaData } from '../services/wikipediaService.js';
import { generateAIContent } from '../services/aiService.js';
import User from '../models/User.js';
import { adminDb } from '../config/firebase.js';

function extractMainTopic(query) {
  if (!query) return '';
  let cleaned = query
    .replace(/^(what is|what's|what are|tell me about|explain|describe|define|what do you know about)\s+/i, '')
    .replace(/\?+$/, '') 
    .trim();
  cleaned = cleaned.replace(/^(a|an)\s+/i, '');
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 4) {
    return cleaned;
  }
  const techTerms = ['python', 'javascript', 'java', 'machine', 'learning', 'data', 'structure', 'algorithm', 'calculus', 'algebra', 'biology', 'chemistry', 'physics', 'quantum', 'computing', 'artificial', 'intelligence', 'neural', 'network'];
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (techTerms.includes(word)) {
      if (i + 1 < words.length && (word === 'machine' || word === 'data' || word === 'world' || word === 'war' || word === 'artificial' || word === 'neural' || word === 'quantum')) {
        return `${words[i]} ${words[i + 1]}`;
      }
      return words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    if (words[i][0] === words[i][0].toUpperCase() && words[i].length > 2) {
      if (i + 1 < words.length && 
          (words[i].toLowerCase() === 'machine' || 
           words[i].toLowerCase() === 'world' || 
           words[i].toLowerCase() === 'data' ||
           words[i].toLowerCase() === 'artificial' ||
           words[i].toLowerCase() === 'neural' ||
           words[i].toLowerCase() === 'quantum')) {
        return `${words[i]} ${words[i + 1]}`;
      }
      if (i + 1 < words.length && words[i + 1].length > 2) {
        return `${words[i]} ${words[i + 1]}`;
      }
      return words[i];
    }
  }
  return words.slice(0, 3).join(' ') || cleaned;
}

export async function getStudyMaterial(req, res) {
  try {
    const { topic, mode = 'normal' } = req.query;
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
    const topicToUse = mode === 'math' ? topic : extractMainTopic(topic);
    const cleanTopic = mode === 'math' ? topic : extractMainTopic(topic);
    let wikipediaData = { success: false, extract: '', error: 'Skipped for math mode' };
    if (mode === 'normal') {
      wikipediaData = await fetchWikipediaData(topicToUse);      
      if (!wikipediaData.success && cleanTopic !== topic) {
        console.log(`Trying original topic "${topic}" after cleaned version failed`);
        wikipediaData = await fetchWikipediaData(topic);
      }
    } else {
      console.log(`Wikipedia fetch skipped for math mode - will solve the problem directly`);
    }
    const context = wikipediaData.success ? wikipediaData.extract : '';
    if (wikipediaData.success) {
      console.log(`Wikipedia data fetched successfully. Context length: ${context.length} characters`);
      console.log(`Wikipedia title: ${wikipediaData.title}`);
    } else {
      console.log(`Wikipedia fetch skipped or failed. Will use AI or mock data.`);
    }
    const aiContent = await generateAIContent(
      mode === 'math' ? topic : cleanTopic,
      context,
      mode
    );
    if (!aiContent.success) {
      return res.status(500).json({
        error: true,
        message: 'Failed to generate study materials',
        details: aiContent.error
      });
    }
    if (req.userId) {
      try {
        if (req.authType === 'firebase') {
          const userRef = adminDb.collection('users').doc(req.firebaseUid);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const studyHistory = userData.studyHistory || [];
            const newItem = {
              id: `firebase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              topic: cleanTopic,
              mode: mode,
              timestamp: new Date().toISOString()
            };
            
            studyHistory.unshift(newItem);
            const updatedHistory = studyHistory.slice(0, 50)
            await userRef.update({
              studyHistory: updatedHistory
            });
          }
        } else {
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
                  $slice: -50
                }
              }
            }
          );
        }
      } catch (historyError) {
        console.error('Error saving to history:', historyError);
      }
    }
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

