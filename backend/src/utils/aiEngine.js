const Anthropic = require('@anthropic-ai/sdk');

const emergencyKeywords = ['chest pain', 'severe bleeding', 'stroke', 'heart attack', 'can\'t breathe', 'suicide'];

const getDisclaimer = () => {
  return "\n\n*Disclaimer: I am an AI, not a doctor. This information is for educational purposes only. Please consult a qualified healthcare professional for medical advice.*";
};

const rulesBasedEngine = (message) => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('headache') || lowerMsg.includes('fever')) {
    return "For common symptoms like a headache or fever, make sure to stay hydrated and rest. You can use the Symptom Checker tool for a more detailed AI analysis of your symptoms.";
  }
  
  if (lowerMsg.includes('appointment') || lowerMsg.includes('book')) {
    return "You can easily book a doctor by navigating to the 'Appointments' section in your dashboard. You can search by specialization and choose an available time slot.";
  }
  
  if (lowerMsg.includes('report') || lowerMsg.includes('upload')) {
    return "To upload a medical report, head over to the 'Reports' section. Our AI can also provide a summary of the uploaded document once you submit it!";
  }

  return "I'm sorry, I don't have medical expertise to diagnose that. Please try using our Symptom Checker or book an appointment with a doctor.";
};

const claudeEngine = async (history, currentMessage) => {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = "You are a helpful medical AI assistant. You must NEVER diagnose the user. Always recommend consulting a professional doctor. Be concise, educational, and empathetic.";

  // Map history to anthropic format
  const messages = history.map(msg => ({
    role: msg.sender === 'ai' ? 'assistant' : 'user',
    content: msg.text
  }));

  messages.push({ role: 'user', content: currentMessage });

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    system: systemPrompt,
    messages: messages,
  });

  return response.content[0].text;
};

const processMessage = async (user, message, chatHistory = []) => {
  let reply = "";
  let isEmergency = false;
  
  // 1. Safety Check
  const lowerMsg = message.toLowerCase();
  for (const keyword of emergencyKeywords) {
    if (lowerMsg.includes(keyword)) {
      isEmergency = true;
      reply = "URGENT: Your symptoms sound like a medical emergency. Please call your local emergency services (e.g., 911) or go to the nearest emergency room immediately.";
      break;
    }
  }

  // 2. Routing
  if (!isEmergency) {
    if (process.env.AI_PROVIDER === 'claude' && process.env.ANTHROPIC_API_KEY) {
      try {
        reply = await claudeEngine(chatHistory, message);
      } catch (error) {
        console.error("Claude API Error:", error);
        reply = rulesBasedEngine(message); // Fallback
      }
    } else {
      reply = rulesBasedEngine(message);
    }
  }

  // 3. Disclaimer injection
  if (!user.aiDisclaimerAccepted) {
    reply += getDisclaimer();
    user.aiDisclaimerAccepted = true;
    await user.save();
  }

  return reply;
};

module.exports = { processMessage };
