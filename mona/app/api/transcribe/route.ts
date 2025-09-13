import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60秒超时
  maxRetries: 2, // 最多重试2次
});

// 定义任务信息的 Zod schema
const TaskInfo = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high']).nullable(),
  category: z.enum(['work', 'personal', 'study', 'health', 'other']).nullable(),
  deadline: z.string().nullable(), // YYYY-MM-DD 格式
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ 
        error: '未找到音频文件',
        code: 'NO_AUDIO_FILE'
      }, { status: 400 });
    }

    // 验证音频文件大小和格式
    const maxSize = 25 * 1024 * 1024; // 25MB
    const minSize = 1024; // 1KB
    
    if (audioFile.size > maxSize) {
      return NextResponse.json({ 
        error: '音频文件过大，请录制较短的语音（最大25MB）',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }
    
    if (audioFile.size < minSize) {
      return NextResponse.json({ 
        error: '音频文件过小，请重新录制较长的语音',
        code: 'FILE_TOO_SMALL'
      }, { status: 400 });
    }

    // 验证音频格式
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ 
        error: '不支持的音频格式，请使用标准音频格式录制',
        code: 'UNSUPPORTED_FORMAT'
      }, { status: 400 });
    }

    let transcription;
    try {
      // 转录音频 - 使用官方推荐的配置
      transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'text',
        language: 'zh',
      });
    } catch (transcriptionError: any) {
      console.error('音频转录失败:', {
        error: transcriptionError.message,
        status: transcriptionError.status,
        code: transcriptionError.code,
        type: transcriptionError.type,
        audioFileSize: audioFile.size,
        audioFileType: audioFile.type
      });
      
      // 根据不同的错误类型返回相应的提示
      if (transcriptionError?.status === 400) {
        return NextResponse.json({ 
          error: '音频格式不正确或文件损坏，请重新录制',
          code: 'TRANSCRIPTION_FORMAT_ERROR',
          details: transcriptionError.message
        }, { status: 400 });
      } else if (transcriptionError?.status === 413) {
        return NextResponse.json({ 
          error: '音频文件过大，请录制较短的语音',
          code: 'TRANSCRIPTION_FILE_TOO_LARGE'
        }, { status: 400 });
      } else if (transcriptionError?.status === 429) {
        return NextResponse.json({ 
          error: '请求过于频繁，请稍后重试',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 });
      } else if (transcriptionError?.status === 401) {
        return NextResponse.json({ 
          error: 'API 认证失败，请联系管理员',
          code: 'AUTHENTICATION_ERROR'
        }, { status: 500 });
      } else {
        return NextResponse.json({ 
          error: '音频转录服务暂时不可用，请稍后重试',
          code: 'TRANSCRIPTION_SERVICE_ERROR',
          details: transcriptionError.message
        }, { status: 503 });
      }
    }

    // 验证转录结果
    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json({ 
        error: '未能识别到语音内容，请重新录制并确保说话清晰',
        code: 'NO_TRANSCRIPTION_RESULT'
      }, { status: 400 });
    }

    const transcribedText = transcription.trim();
    
    // 验证转录文本长度
    if (transcribedText.length < 2) {
      return NextResponse.json({ 
        error: '识别到的语音内容过短，请重新录制并说出完整的任务描述',
        code: 'TRANSCRIPTION_TOO_SHORT'
      }, { status: 400 });
    }
    
    if (transcribedText.length > 1000) {
      return NextResponse.json({ 
        error: '识别到的语音内容过长，请录制较短的任务描述',
        code: 'TRANSCRIPTION_TOO_LONG'
      }, { status: 400 });
    }

    let extractedData;
    try {
      // 获取当前时间信息
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
      });
      const currentWeekday = now.toLocaleDateString('zh-CN', { weekday: 'long' });

      // 使用结构化输出提取任务信息
      const extraction = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: `你是一个智能任务管理助手。请从用户的语音转录文本中提取任务信息，并按照指定的JSON格式返回。

当前时间信息：
- 当前日期：${currentDate}
- 当前时间：${currentTime}
- 今天是：${currentWeekday}

提取规则：
 1. title: 任务标题，简洁明了
 2. description: 任务详细描述，可以为空
 3. priority: 优先级，只能是 "low", "medium", "high" 之一
 4. category: 分类，只能是 "work", "personal", "study", "health", "other" 之一
 5. deadline: 截止日期，格式为 YYYY-MM-DD，如果没有明确日期则为 null
 
 时间处理规则：
 - "今天"、"今日" = ${currentDate}
 - "明天" = ${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]}
 - "后天" = ${new Date(now.getTime() + 2*24*60*60*1000).toISOString().split('T')[0]}
 - "下周一"、"下周二" 等需要计算具体日期
 - "这周五"、"本周六" 等相对于当前日期计算
 - "下个月" 等需要根据当前日期推算
 
 注意：
 - 如果用户没有明确提到某个字段，请根据上下文合理推断
 - 优先级默认为 "medium"
 - 分类默认为 "other"
 - 所有相对时间表达都要转换为具体的 YYYY-MM-DD 格式`
          },
          {
            role: 'user',
            content: `请从以下语音转录文本中提取任务信息：\n\n"${transcribedText}"`
          }
        ],
        response_format: zodResponseFormat(TaskInfo, 'task_info'),
        temperature: 0,
      });

      extractedData = extraction.choices[0].message.content ? JSON.parse(extraction.choices[0].message.content) : null;
    } catch (extractionError: any) {
      console.error('信息提取失败:', extractionError);
      return NextResponse.json({ 
        error: '任务信息提取失败，请稍后重试',
        code: 'EXTRACTION_ERROR',
        transcription: transcribedText // 仍然返回转录文本供用户参考
      }, { status: 500 });
    }

    // 验证提取结果的有效性
    if (!extractedData || (!extractedData.title && !extractedData.description)) {
      return NextResponse.json({ 
        error: '未能从语音中识别出有效的任务信息，请重新录制并明确描述任务内容',
        code: 'NO_VALID_TASK_INFO',
        transcription: transcribedText // 返回转录文本供用户参考
      }, { status: 400 });
    }

    return NextResponse.json({
      transcription: transcribedText,
      extracted: extractedData,
      success: true
    });
  } catch (error: any) {
    console.error('处理音频时发生未知错误:', error);
    return NextResponse.json({ 
      error: '处理音频时发生未知错误，请重试',
      code: 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}