import User from '../models/User.js';
import { adminDb } from '../config/firebase.js';

// Get user's study history
export async function getHistory(req, res) {
  try {
    let history = [];

    if (req.authType === 'firebase') {
      // Get from Firestore
      const userDoc = await adminDb.collection('users').doc(req.firebaseUid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          error: true,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      history = (userData.studyHistory || [])
        .map((item, index) => ({
          id: item.id || `firebase-${Date.now()}-${index}`,
          topic: item.topic,
          mode: item.mode,
          timestamp: item.timestamp
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      // Get from MongoDB (backward compatibility)
      const user = await User.findById(req.userId).select('studyHistory');
      
      if (!user) {
        return res.status(404).json({
          error: true,
          message: 'User not found'
        });
      }

      history = user.studyHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(item => ({
          id: item._id.toString(),
          topic: item.topic,
          mode: item.mode,
          timestamp: item.timestamp
        }));
    }

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching history',
      details: error.message
    });
  }
}

// Delete a specific topic from history
export async function deleteHistoryItem(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: true,
        message: 'History item ID is required'
      });
    }

    if (req.authType === 'firebase') {
      // Delete from Firestore
      const userRef = adminDb.collection('users').doc(req.firebaseUid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          error: true,
          message: 'User not found'
        });
      }

      const userData = userDoc.data();
      const studyHistory = (userData.studyHistory || []).filter(item => {
        const itemId = item.id || `firebase-${userData.studyHistory.indexOf(item)}`;
        return itemId !== id;
      });

      await userRef.update({
        studyHistory: studyHistory
      });
    } else {
      // Delete from MongoDB (backward compatibility)
      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          $pull: {
            studyHistory: { _id: id }
          }
        },
        { new: true }
      ).select('studyHistory');

      if (!user) {
        return res.status(404).json({
          error: true,
          message: 'User not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'History item deleted successfully'
    });

  } catch (error) {
    console.error('Delete history item error:', error);
    res.status(500).json({
      error: true,
      message: 'Error deleting history item',
      details: error.message
    });
  }
}

// Clear all history
export async function clearHistory(req, res) {
  try {
    if (req.authType === 'firebase') {
      // Clear Firestore history
      await adminDb.collection('users').doc(req.firebaseUid).update({
        studyHistory: []
      });
    } else {
      // Clear MongoDB history (backward compatibility)
      await User.findByIdAndUpdate(
        req.userId,
        {
          $set: { studyHistory: [] }
        }
      );
    }

    res.json({
      success: true,
      message: 'History cleared successfully'
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      error: true,
      message: 'Error clearing history',
      details: error.message
    });
  }
}

