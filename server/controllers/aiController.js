const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPTS = {
  explain: `You are a senior developer and coding mentor. Explain the given code line-by-line in simple, clear terms.
Rules:
- Use markdown formatting
- Start with a brief overview of what the code does
- Then explain each important line or block
- Highlight key concepts for beginners
- Keep explanations concise but thorough
- Use code formatting for references to variables, functions, etc.`,

  fix: `You are a senior developer and bug hunter. Analyze the given code for bugs, errors, edge cases, and potential issues.
Rules:
- Use markdown formatting
- List each bug/issue you find with a clear title
- Explain WHY it's a problem
- Show the corrected code in a code block
- If no bugs are found, suggest defensive coding improvements
- Be specific and actionable`,

  optimize: `You are a senior developer focused on code quality. Analyze the given code and suggest optimizations.
Rules:
- Use markdown formatting
- Cover performance, readability, and best practices
- Show the optimized version in a code block
- Explain each optimization and why it matters
- Suggest modern language features where applicable
- Keep suggestions practical and impactful`,
};

const analyzeCode = async (req, res) => {
  try {
    const { code, language, action } = req.body;

    if (!code || !action) {
      return res.status(400).json({ message: 'Code and action are required' });
    }

    if (!['explain', 'fix', 'optimize'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use: explain, fix, or optimize' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI service is not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${SYSTEM_PROMPTS[action]}

Language: ${language || 'Unknown'}

Code:
\`\`\`${language || ''}
${code}
\`\`\`

Provide your analysis:`;

    // Retry logic for rate-limited new API keys
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ result: text });
      } catch (err) {
        lastError = err;
        const isRetryable =
          err.message?.includes('RATE_LIMIT') ||
          err.message?.includes('RetryInfo') ||
          err.message?.includes('429') ||
          err.message?.includes('RESOURCE_EXHAUSTED') ||
          err.status === 429;

        if (isRetryable && attempt < MAX_RETRIES - 1) {
          const delayMs = (attempt + 1) * 5000; // 5s, 10s, 15s
          console.log(`AI rate limited, retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }
  } catch (error) {
    console.error('AI Analysis Error:', error.message || error);

    // Return the actual error message so we can debug the quota/404 issue in the UI
    res.status(500).json({ 
      message: error.message || 'AI analysis failed. Please try again.' 
    });
  }
};

module.exports = { analyzeCode };
