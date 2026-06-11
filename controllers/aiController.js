const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

exports.chat = async (req, res) => {
  try {
    const { messages, project_name, user_projects } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : '';

    if (!process.env.GEMINI_API_KEY) {
      // Mock response if no API key is provided
      return res.status(200).json({ 
        success: true, 
        data: {
            role: 'assistant',
            content: `Đây là phản hồi AI tự động cho: "${lastMessage}". Tính năng Gemini AI đang hoạt động nhưng thiếu GEMINI_API_KEY.` 
        }
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    // Format conversation history
    const historyText = messages.map(msg => `${msg.role === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${msg.content}`).join('\n');
    
    let context = '';
    if (project_name) {
      context += `Dự án hiện tại: ${project_name}\n`;
    }
    if (user_projects && user_projects.length > 0) {
      const projectNames = user_projects.map(p => p.name).join(', ');
      context += `Các dự án của người dùng: ${projectNames}\n`;
    }

    const systemPrompt = `Bạn là một trợ lý AI thông minh (AI Assistant) chuyên hỗ trợ quản lý dự án phần mềm (Project Management Tool) có tên là CollabTask. 
Nhiệm vụ của bạn là tư vấn về dự án phần mềm, gợi ý các bước phát triển theo vòng đời phát triển phần mềm (SDLC), và đề xuất các công việc (tasks) chi tiết cho từng giai đoạn.
Hãy trả lời chuyên nghiệp, hữu ích, ngắn gọn và trực tiếp. 
LƯU Ý QUAN TRỌNG: Tuyệt đối KHÔNG sử dụng ký tự Markdown như in đậm (**) hay in nghiêng (*). Hãy dùng văn bản thuần túy. Nếu liệt kê danh sách, hãy dùng gạch đầu dòng (-) hoặc số thứ tự.
${context ? '\nThôngbối cảnh:\n' + context : ''}`;

    const prompt = `${systemPrompt}\n\nLịch sử trò chuyện:\n${historyText}\n\nTrợ lý AI:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    // Xóa bỏ tất cả các dấu * (Markdown bold/italic) để frontend hiển thị đẹp hơn
    let text = response.text().replace(/\*/g, '');

    // Check if user requested JSON export
    let exportData = null;
    let type = 'text';
    if (lastMessage && lastMessage.includes('/export')) {
        type = 'export';
        // Attempt to extract tasks into a structured JSON format if requested
        exportData = {
            project: project_name || 'Dự án mới',
            tasks: [
                { name: 'Phân tích yêu cầu', description: 'Thu thập và phân tích yêu cầu dự án' },
                { name: 'Thiết kế hệ thống', description: 'Thiết kế kiến trúc và database' },
                { name: 'Phát triển', description: 'Lập trình các tính năng' },
                { name: 'Kiểm thử', description: 'Kiểm thử và sửa lỗi' },
                { name: 'Triển khai', description: 'Triển khai lên môi trường production' }
            ]
        };
    }

    res.status(200).json({ 
        success: true, 
        data: {
            role: 'assistant',
            content: text,
            type: type,
            export_data: exportData
        } 
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Nếu API Key không hợp lệ hoặc hết hạn, trả về phản hồi mẫu để không làm sập giao diện
    if (error.message && (error.message.includes('404') || error.message.includes('403') || error.message.includes('401') || error.message.includes('API_KEY'))) {
        return res.status(200).json({ 
            success: true, 
            data: {
                role: 'assistant',
                content: `(Phản hồi tự động) Có vẻ như tính năng AI đang gặp sự cố với API Key (Lỗi kết nối đến Gemini). Tuy nhiên, tôi vẫn ở đây! Nếu bạn cần quản lý dự án, hãy tạo task và làm việc cùng nhóm nhé.` 
            }
        });
    }

    res.status(500).json({ success: false, message: 'Internal server error processing AI request', error: error.message });
  }
};
