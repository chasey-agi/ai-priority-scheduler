const OpenAI = require('openai');
const fs = require('fs');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

async function testBasicSetup() {
  console.log('🔍 检查基本配置...');
  
  // 检查 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY 未设置');
    return false;
  }
  
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY 格式不正确');
    return false;
  }
  
  console.log('✅ API Key 格式正确:', apiKey.substring(0, 15) + '...');
  
  // 检查 OpenAI 包是否正确安装
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000, // 30秒超时
      maxRetries: 1
    });
    console.log('✅ OpenAI 客户端初始化成功');
    return true;
  } catch (error) {
    console.error('❌ OpenAI 客户端初始化失败:', error.message);
    return false;
  }
}

// 测试转录 API 端点的错误处理
async function testTranscribeEndpoint() {
  console.log('\n🌐 测试转录 API 端点...');
  
  try {
    // 测试无文件的情况
    const response1 = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: new FormData()
    });
    
    const result1 = await response1.json();
    
    if (response1.status === 400 && result1.error && result1.code === 'NO_AUDIO_FILE') {
      console.log('✅ 无音频文件错误处理正常');
    } else {
      console.log('⚠️  无音频文件错误处理异常:', result1);
    }
    
    // 测试空文件的情况
    const formData = new FormData();
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    formData.append('audio', emptyBlob, 'empty.webm');
    
    const response2 = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData
    });
    
    const result2 = await response2.json();
    
    if (response2.status === 400 && result2.error && result2.code === 'INVALID_AUDIO_SIZE') {
      console.log('✅ 音频文件大小验证正常');
    } else {
      console.log('⚠️  音频文件大小验证异常:', result2);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API 端点测试失败:', error.message);
    return false;
  }
}

// 检查服务器状态
async function checkServerStatus() {
  console.log('\n🖥️  检查开发服务器状态...');
  
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ 开发服务器运行正常');
      return true;
    } else {
      console.log('⚠️  开发服务器响应异常:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ 无法连接到开发服务器:', error.message);
    console.log('💡 请确保运行了 pnpm dev 命令');
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始音频转录服务诊断\n');
  
  const setupTest = await testBasicSetup();
  const serverTest = await checkServerStatus();
  const endpointTest = serverTest ? await testTranscribeEndpoint() : false;
  
  console.log('\n📊 诊断结果总结:');
  console.log('基本配置:', setupTest ? '✅ 正常' : '❌ 异常');
  console.log('开发服务器:', serverTest ? '✅ 运行中' : '❌ 未运行');
  console.log('API 端点:', endpointTest ? '✅ 正常' : '❌ 异常');
  
  if (setupTest && serverTest && endpointTest) {
    console.log('\n🎉 所有基础检查通过！');
    console.log('💡 如果仍然遇到转录问题，可能是网络连接或 OpenAI 服务暂时不可用。');
    console.log('💡 建议在浏览器中测试实际的音频上传功能。');
  } else {
    console.log('\n⚠️  发现问题，请根据上述结果进行修复。');
  }
}

// 运行测试
runTests().catch(console.error);