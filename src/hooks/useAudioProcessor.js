import { useState, useEffect, useRef } from 'react';

const useAudioProcessor = () => {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [fileName, setFileName] = useState('');
  const [audioContext, setAudioContext] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawArrayBuffer, setRawArrayBuffer] = useState(null);
  
  // 处理音频加载
  const handleAudioLoad = async (arrayBuffer, name) => {
    try {
      setIsProcessing(true);
      setFileName(name);
      console.log("开始处理音频文件:", name);
      
      // 保存原始数据以便调试
      setRawArrayBuffer(arrayBuffer);
      
      // 创建或重用音频上下文
      let context = audioContext;
      if (!context) {
        console.log("创建新的AudioContext");
        try {
          context = new (window.AudioContext || window.webkitAudioContext)();
          setAudioContext(context);
        } catch(ctxErr) {
          console.error("创建AudioContext失败:", ctxErr);
          setError(`无法创建音频上下文: ${ctxErr.message}`);
          setIsProcessing(false);
          return;
        }
      }
      
      // 解码音频数据
      console.log("开始解码音频数据...");
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("无效的音频数据");
      }
      
      // 使用更安全的回调方式进行解码，而不是Promise
      try {
        const bufferCopy = arrayBuffer.slice(0);
        
        // 使用老式回调API可能更稳定
        context.decodeAudioData(
          bufferCopy,
          // 成功回调
          (decodedData) => {
            console.log("音频解码成功, duration:", decodedData.duration);
            setAudioBuffer(decodedData);
            setIsProcessing(false);
          },
          // 错误回调
          (decodeErr) => {
            console.error("音频解码失败(回调):", decodeErr);
            setError(`无法解码音频文件`);
            setIsProcessing(false);
          }
        );
      } catch (decodeErr) {
        console.error("音频解码失败(try-catch):", decodeErr);
        setError(`无法解码音频文件: ${decodeErr.message}`);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('音频处理错误:', err);
      setError(`处理音频时出错: ${err.message}`);
      setIsProcessing(false);
    }
  };
  
  // 清除音频数据
  const clearAudio = () => {
    console.log("useAudioProcessor: 清除音频数据");
    
    // 先清除音频缓冲区，触发其他组件的更新
    setAudioBuffer(null);
    setFileName('');
    setError(null);
    
    // 尝试清理任何可能的全局音频资源
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        // 创建一个临时的空白音频上下文并立即关闭，这有助于停止任何正在进行的音频播放
        const tempContext = new (window.AudioContext || window.webkitAudioContext)();
        tempContext.close();
      } catch (e) {
        console.log("创建临时音频上下文失败:", e);
      }
    }
  };
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);
  
  return {
    audioBuffer,
    fileName,
    error,
    isProcessing,
    handleAudioLoad,
    clearAudio,
    rawArrayBuffer
  };
};

export default useAudioProcessor;