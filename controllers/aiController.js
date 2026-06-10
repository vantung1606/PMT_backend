const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Mock response if no API key is provided
      return res.status(200).json({ 
        success: true, 
        reply: `Đây là phản hồi AI tự động cho: "${message}". Tính năng Gemini AI đang hoạt động nhưng thiếu GEMINI_API_KEY.` 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Bạn là một trợ lý AI thông minh chuyên hỗ trợ luyện thi VSTEP (Tiếng Anh bậc 3). Hãy trả lời câu hỏi sau một cách ngắn gọn, hữu ích và thân thiện: ${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ success: true, reply: text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error processing AI request' });
  }
};
