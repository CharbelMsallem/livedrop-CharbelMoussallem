
import express from 'express';
import { runAssistant } from '../assistant/engine.js';

const router = express.Router();

/**
 * @route   POST /api/assistant/chat
 * @desc    Handles a chat query from the user, maintaining conversation context via a sessionId.
 * @access  Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { query, userEmail, sessionId } = req.body;

    // --- Validation ---
    // The query and sessionId are now required for a stateful conversation.
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'The "query" field is required and cannot be empty.' });
    }
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return res.status(400).json({ error: 'The "sessionId" field is required to maintain conversation context.' });
    }

    // Pass all relevant data to the assistant engine.
    const result = await runAssistant(query, userEmail, sessionId);
    
    // Send the structured result back to the client.
    res.status(200).json(result);

  } catch (error) {
    console.error("Error in assistant chat endpoint:", error.message);
    res.status(500).json({ error: 'An internal server error occurred while processing your request.' });
  }
});

export default router;