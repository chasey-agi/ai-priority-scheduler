'use client';

import { useState, useRef, useEffect } from 'react';

export default function TestAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 清理音频URL
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('当前浏览器不支持麦克风访问');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setError('');
      setResult(null);
      // 清除之前的音频URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && isRecording) {
      // 先挂载 onstop，再触发 stop，避免竞态
      mr.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // 创建音频URL用于预览播放
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'test-recording.webm');
          
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            setResult(data);
            setError('');
          } else {
            setError(data.error || '转录失败');
            setResult(data);
          }
        } catch (err) {
          setError('处理音频时出错: ' + (err as Error).message);
        } finally {
          setIsProcessing(false);
          // 彻底释放麦克风
          try { mr.stream?.getTracks?.().forEach(track => track.stop()); } catch {}
        }
      };
      setIsRecording(false);
      setIsProcessing(true);
      mr.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">音频转录功能测试</h1>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <button
                onClick={startRecording}
                disabled={isRecording || isProcessing}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isRecording || isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:scale-105'
                } text-white`}
              >
                {isRecording ? (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    录音中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    🎤 开始录音
                  </span>
                )}
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!isRecording || isProcessing}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  !isRecording || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 hover:shadow-lg transform hover:scale-105'
                } text-white`}
              >
                <span className="flex items-center gap-2">
                  ⏹️ 停止录音
                </span>
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600 animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">正在录音...</span>
                </div>
              )}
            </div>
            
            {isProcessing && (
              <div className="text-blue-600">
                🎵 正在处理音频，请稍候...
              </div>
            )}
            
            {audioUrl && (
              <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="text-purple-800 font-semibold">🎵 录音预览</h3>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <audio 
                      ref={audioRef}
                      src={audioUrl} 
                      controls 
                      className="w-full"
                      preload="metadata"
                      style={{ height: '40px' }}
                    >
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          if (audioRef.current.paused) {
                            audioRef.current.play();
                          } else {
                            audioRef.current.pause();
                          }
                        }
                      }}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors duration-200 flex items-center gap-2"
                    >
                      ▶️ 快速播放
                    </button>
                    <div className="text-purple-600 text-xs bg-purple-100 px-3 py-1 rounded-full">
                      💡 请确认音质清晰
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-medium">错误信息</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-green-800 font-medium mb-2">转录结果</h3>
                  <p className="text-green-700">{result.transcription}</p>
                </div>
                
                {result.extracted && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="text-blue-800 font-medium mb-2">提取的任务信息</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>标题:</strong> {result.extracted.title || '未提取'}</div>
                      <div><strong>描述:</strong> {result.extracted.description || '未提取'}</div>
                      <div><strong>优先级:</strong> {result.extracted.priority || '未提取'}</div>
                      <div><strong>分类:</strong> {result.extracted.category || '未提取'}</div>
                      <div><strong>截止日期:</strong> {result.extracted.deadline || '未提取'}</div>
                    </div>
                  </div>
                )}
                
                <details className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <summary className="cursor-pointer font-medium text-gray-700">查看完整响应</summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-yellow-800 font-medium mb-2">测试说明</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• 点击&quot;开始录音&quot;并允许麦克风权限</li>
              <li>• 说一些包含任务信息的话，如：&quot;明天下午开会，优先级高&quot;</li>
              <li>• 点击&quot;停止录音&quot;后会显示录音预览</li>
              <li>• 试听录音确认音质清晰后再查看转录结果</li>
              <li>• 检查转录文本和提取的任务信息是否正确</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
