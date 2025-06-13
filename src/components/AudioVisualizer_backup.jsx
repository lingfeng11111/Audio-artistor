import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import WaveSurfer from 'wavesurfer.js';

// 辅助函数：将AudioBuffer转换为WAV Blob
function audioBufferToWavBlob(audioBuffer) {
  // 获取音频数据
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const channelData = [];
  
  // 获取每个通道数据
  for (let i = 0; i < numOfChannels; i++) {
    channelData.push(audioBuffer.getChannelData(i));
  }
  
  // WAV文件头计算
  const dataLength = length * numOfChannels * 2; // 16-bit samples
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  
  // 编写WAV文件头
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM格式
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numOfChannels * 2, true); // 字节率
  view.setUint16(32, numOfChannels * 2, true); // 块对齐
  view.setUint16(34, 16, true); // 位深度
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // 写入音频样本
  const offset = 44;
  let index = 0;
  const volume = 1;
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = channelData[channel][i] * volume;
      // 将浮点样本转换为16位整数
      view.setInt16(offset + index, sample < 0 ? Math.max(-1, sample) * 0x8000 : Math.min(1, sample) * 0x7FFF, true);
      index += 2;
    }
  }
  
  // 创建Blob
  return new Blob([buffer], { type: 'audio/wav' });
}

// 辅助函数：将字符串写入DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const AudioVisualizer = React.forwardRef(({ audioBuffer, fileName, isPlaying, setIsPlaying }, ref) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const lowFreqCanvasRef = useRef(null);
  const highFreqCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationRef = useRef(null);
  
  // 提供接口给其他组件访问
  React.useImperativeHandle(ref, () => ({
    getWaveSurfer: () => wavesurferRef.current,
    getAudioContext: () => audioContextRef.current,
    getAnalyser: () => analyserRef.current
  }));
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 初始化音频上下文和分析器
  useEffect(() => {
    if (!audioBuffer) {
      // 当audioBuffer为null时（例如清除音频时），确保清理所有资源
      if (wavesurferRef.current) {
        console.log("AudioVisualizer: audioBuffer为null，清理资源");
        stopVisualization();
        
        try {
          wavesurferRef.current.pause();
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        } catch (e) {
          console.error("销毁WaveSurfer实例时出错:", e);
        }
        
        // 尝试关闭音频上下文
        if (audioContextRef.current) {
          try {
            if (audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
            }
          } catch (e) {
            console.error("关闭音频上下文时出错:", e);
          }
          audioContextRef.current = null;
        }
        
        // 重置状态
        setIsPlaying(false);
      }
      return;
    }
    
    console.log("AudioVisualizer: 初始化音频组件，audioBuffer 长度:", audioBuffer.length);
    
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // 创建分析器
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      // 创建波形可视化
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(0, 240, 255, 0.4)',
        progressColor: 'rgba(0, 240, 255, 0.8)',
        cursorColor: 'var(--accent-color)',
        barWidth: 2,
        barRadius: 2,
        cursorWidth: 1,
        height: 100,
        barGap: 1,
        responsive: true,
        normalize: true,
        backend: 'WebAudio'
      });
      
      wavesurferRef.current = wavesurfer;
      
      console.log("AudioVisualizer: 尝试载入音频到WaveSurfer");
      
      // 检查audioBuffer是否是有效的AudioBuffer实例
      if (!(audioBuffer instanceof AudioBuffer)) {
        console.error("AudioVisualizer: audioBuffer不是有效的AudioBuffer实例", audioBuffer);
        return;
      }
      
      // 将AudioBuffer转换为WAV Blob
      const wavBlob = audioBufferToWavBlob(audioBuffer);
      
      // 从Blob加载音频到WaveSurfer
      wavesurfer.loadBlob(wavBlob);
      
      // 设置音频持续时间
      setDuration(audioBuffer.duration);
      
      console.log("AudioVisualizer: 音频载入WaveSurfer成功");
      
      // 事件监听
      wavesurfer.on('ready', () => {
        console.log('WaveSurfer is ready');
      });
      
      wavesurfer.on('play', () => {
        console.log('WaveSurfer play');
        setIsPlaying(true);
        // 使用WaveSurfer内部的音频源进行可视化处理
        startVisualizationFromCurrentTime();
      });
      
      wavesurfer.on('pause', () => {
        console.log('WaveSurfer pause');
        setIsPlaying(false);
        stopVisualization();
      });
      
      wavesurfer.on('audioprocess', (time) => {
        setCurrentTime(time);
      });
        
      // 添加交互事件，处理用户点击
      wavesurfer.on('interaction', () => {
        console.log('WaveSurfer interaction');
        
        // 确保停止任何正在进行的可视化
        stopVisualization();
        
        // 记录用户交互前是否处于播放状态
        const wasPlaying = isPlaying;
        
        // 先暂停所有播放
        setIsPlaying(false);
        if (wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
        }
        
        // 如果之前正在播放，则在短暂延迟后继续播放
        if (wasPlaying) {
          setTimeout(() => {
            // 重新检查状态，确保没有被其他事件改变
            if (!wavesurferRef.current.isPlaying()) {
              wavesurferRef.current.play();
              setIsPlaying(true);
            }
          }, 100);
        }
      });
      
      // 添加seek事件处理，当用户拖动波形时触发
      wavesurfer.on('seek', (progress) => {
        console.log('WaveSurfer seek to:', progress);
        
        // 先停止当前可视化和任何正在播放的音频
        stopVisualization();
        
        // 暂时停止所有播放，防止声音重叠
        const wasPlaying = isPlaying;
        if (wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
          setIsPlaying(false);
        }
        
        // 如果之前是播放状态，等待短暂延迟后恢复播放
        if (wasPlaying) {
          setTimeout(() => {
            // 开始新的播放
            wavesurferRef.current.play();
            setIsPlaying(true);
            
            // 延迟一点再开始可视化，确保播放已经稳定
            setTimeout(() => {
              // 再次检查是否仍在播放状态
              if (wavesurferRef.current.isPlaying()) {
                startVisualizationFromCurrentTime();
              }
            }, 50);
          }, 100);
        }
      });
    
    // 添加错误处理
    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer错误:', err);
    });
    
    return () => {
      // 先停止可视化，确保所有音频节点都被正确停止
      stopVisualization();
      
      // 安全销毁WaveSurfer实例
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (e) {
          console.error("销毁WaveSurfer实例时出错:", e);
        }
        wavesurferRef.current = null;
      }
      
      // 安全关闭音频上下文
      if (audioContextRef.current) {
        try {
          // 先检查状态再关闭，避免重复关闭导致错误
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (e) {
          console.error("关闭音频上下文时出错:", e);
        }
        audioContextRef.current = null;
      }
    };
  } catch (error) {
    console.error('AudioVisualizer初始化错误:', error);
  }
  }, [audioBuffer]);
  
  // 从当前位置开始可视化
  const startVisualizationFromCurrentTime = () => {
    if (!wavesurferRef.current || !analyserRef.current || !audioContextRef.current || !audioBuffer) return;
    
    // 停止之前可能存在的可视化
    stopVisualization();
    
    try {
      // 获取当前播放进度，安全地计算，避免除以零
      const currentTime = wavesurferRef.current.getCurrentTime() || 0;
      const totalDuration = duration || audioBuffer.duration || 0;
      
      // 确保duration不为0，防止除以零产生NaN或Infinity
      if (totalDuration <= 0) {
        console.warn("无效的持续时间值，使用0作为起始偏移");
        startVisualization(0);
        return;
      }
      
      const currentProgress = currentTime / totalDuration;
      // 确保offset是有限数
      const offset = isFinite(currentProgress) ? currentProgress * audioBuffer.duration : 0;
      
      console.log("开始可视化，当前时间:", currentTime, "总时长:", totalDuration, "偏移量:", offset);
      
      // 启动新的可视化
      startVisualization(offset);
    } catch (error) {
      console.error("开始可视化出错:", error);
    }
  };
  
  // 开始可视化，可以指定开始偏移量
  const startVisualization = (startOffset = 0) => {
    if (!analyserRef.current || !audioContextRef.current || !audioBuffer) return;
    
    const audioContext = audioContextRef.current;
    const analyser = analyserRef.current;
    
    // 创建音频源
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log("停止之前的音频源时出错:", e);
      }
      sourceNodeRef.current = null;
    }
    
    try {
      // 创建新的音频源
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // 创建一个增益节点并设置为极低音量
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.01; // 几乎听不到的音量，但足以分析
      
      // 连接节点: 源 -> 分析器 -> 增益节点 -> 目标
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      sourceNodeRef.current = source;
      
      // 验证偏移量是否合法
      let safeOffset = 0;
      if (isFinite(startOffset) && startOffset >= 0 && startOffset < audioBuffer.duration) {
        safeOffset = startOffset;
      } else {
        console.warn(`无效的偏移量: ${startOffset}，使用0作为替代`);
      }
      
      // 开始从指定偏移量播放
      try {
        // 确保使用有效的参数调用start()
        // AudioBufferSourceNode.start(when, offset, duration)
        const when = 0; // 立即开始播放
        // 确保所有参数都是有限数值
        source.start(when, safeOffset);
        
        // 绘制频谱
        requestAnimationFrame(drawSpectrum);
        
        console.log("频谱分析启动成功，从位置:", safeOffset);
      } catch (error) {
        console.error("启动音频源时出错:", error);
        // 尝试使用更安全的方式启动
        try {
          source.start(0, 0);
          console.log("使用备用参数启动音频源");
        } catch (fallbackError) {
          console.error("使用备用参数启动音频源仍然失败:", fallbackError);
        }
      }
    } catch (error) {
      console.error("创建音频源时出错:", error);
    }
  };
  
  // 停止可视化
  const stopVisualization = () => {
    // 先停止动画帧请求
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // 安全地停止和断开音频源
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        console.log("停止音频源时出错:", e);
      }
      
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log("断开音频源连接时出错:", e);
      }
      
      sourceNodeRef.current = null;
    }
  };
  
  // 绘制频谱
  const drawSpectrum = () => {
    // 确保我们有所有必要的引用
    const analyser = analyserRef.current;
    const lowFreqCanvas = lowFreqCanvasRef.current;
    const highFreqCanvas = highFreqCanvasRef.current;
    
    if (!analyser || !lowFreqCanvas || !highFreqCanvas) {
      console.error("频谱分析所需的组件不存在");
      return;
    }
    
    // 获取画布上下文
    const lowFreqCtx = lowFreqCanvas.getContext('2d');
    const highFreqCtx = highFreqCanvas.getContext('2d');
    
    // 获取画布尺寸
    const lowFreqWidth = lowFreqCanvas.width;
    const lowFreqHeight = lowFreqCanvas.height;
    const highFreqWidth = highFreqCanvas.width;
    const highFreqHeight = highFreqCanvas.height;
    
    // 获取频域数据
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // 检查数据是否有效
    let hasData = false;
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > 0) {
        hasData = true;
        break;
      }
    }
    
    if (!hasData) {
      console.log("没有检测到频域数据");
    } else {
      console.log("检测到频域数据");
    }
    
    // 清除画布
    lowFreqCtx.clearRect(0, 0, lowFreqWidth, lowFreqHeight);
    highFreqCtx.clearRect(0, 0, highFreqWidth, highFreqHeight);
    
    // 设置渐变背景 - 低频
    const lowFreqGradient = lowFreqCtx.createLinearGradient(0, lowFreqHeight, 0, 0);
    lowFreqGradient.addColorStop(0.1, 'rgba(0, 180, 255, 0.4)');
    lowFreqGradient.addColorStop(0.9, 'rgba(0, 240, 255, 0.9)');
    
    // 设置渐变背景 - 高频
    const highFreqGradient = highFreqCtx.createLinearGradient(0, highFreqHeight, 0, 0);
    highFreqGradient.addColorStop(0.1, 'rgba(255, 0, 80, 0.4)');
    highFreqGradient.addColorStop(0.9, 'rgba(255, 0, 119, 0.9)');
    
    // 计算频率分割点
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    
    // 低频范围 (0-500Hz)
    const lowFreqCutoff = Math.floor(500 / nyquist * bufferLength);
    
    // 高频范围 (3000Hz+)
    const highFreqStart = Math.floor(3000 / nyquist * bufferLength);
    
    console.log(`频谱分析: 样本率=${sampleRate}, 低频截止=${lowFreqCutoff}, 高频起始=${highFreqStart}`);
    
    // 绘制低频部分
    const lowFreqBarWidth = Math.max(1, (lowFreqWidth / lowFreqCutoff) * 0.8);
    let lowX = 0;
    
    for (let i = 1; i <= lowFreqCutoff; i++) {
      const barHeight = (dataArray[i] / 255) * lowFreqHeight;
      
      lowFreqCtx.fillStyle = lowFreqGradient;
      lowFreqCtx.fillRect(lowX, lowFreqHeight - barHeight, lowFreqBarWidth, barHeight);
      
      lowFreqCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      lowFreqCtx.strokeRect(lowX, lowFreqHeight - barHeight, lowFreqBarWidth, barHeight);
      
      lowX += lowFreqBarWidth + 1;
    }
    
    // 绘制高频部分
    const highFreqCount = bufferLength - highFreqStart;
    const highFreqBarWidth = Math.max(1, (highFreqWidth / highFreqCount) * 0.8);
    let highX = 0;
    
    for (let i = highFreqStart; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * highFreqHeight;
      
      highFreqCtx.fillStyle = highFreqGradient;
      highFreqCtx.fillRect(highX, highFreqHeight - barHeight, highFreqBarWidth, barHeight);
      
      highFreqCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      highFreqCtx.strokeRect(highX, highFreqHeight - barHeight, highFreqBarWidth, barHeight);
      
      highX += highFreqBarWidth + 1;
    }
    
    // 继续动画循环
    animationRef.current = requestAnimationFrame(drawSpectrum);
  };
  
  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Container>
      <Title>音频分析</Title>
      <FileName>{fileName || "未选择文件"}</FileName>
      
      {audioBuffer && (
        <>
          <VisualizerSection>
            <SectionTitle>
              <SectionIcon>◢</SectionIcon>
              波形分析
              <WaveformTip>拖动波形可调整播放位置</WaveformTip>
            </SectionTitle>
            <WaveformContainer ref={waveformRef} />
            
            <ControlsContainer>
              <TimeDisplay>{formatTime(currentTime)} / {formatTime(duration)}</TimeDisplay>
              <PlayButton onClick={togglePlayPause}>
                {isPlaying ? '暂停' : '播放'}
              </PlayButton>
            </ControlsContainer>
          </VisualizerSection>
          
          <FrequencyAnalysisContainer>
            <VisualizerColumn>
              <SectionTitle>
                <SectionIcon>◢</SectionIcon>
                低频分析
                <FrequencyInfo>20Hz - 250Hz</FrequencyInfo>
              </SectionTitle>
              <SpectrumCanvas ref={lowFreqCanvasRef} width="800" height="200" />
            </VisualizerColumn>
            
            <VisualizerColumn>
            <SectionTitle>
              <SectionIcon>◢</SectionIcon>
                高频分析
                <FrequencyInfo>4kHz - 20kHz</FrequencyInfo>
            </SectionTitle>
              <SpectrumCanvas ref={highFreqCanvasRef} width="800" height="200" />
            </VisualizerColumn>
          </FrequencyAnalysisContainer>
        </>
      )}
      
      {!audioBuffer && (
        <EmptyState>
          请上传音频文件以查看分析结果
        </EmptyState>
      )}
    </Container>
  );
});


const Container = styled.div`
  margin: 2rem 0;
  background: var(--panel-bg);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
  text-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
  display: flex;
  align-items: center;
  
  &:before, &:after {
    content: "//";
    font-size: 1rem;
    color: var(--accent-color);
    margin: 0 0.5rem;
    opacity: 0.7;
  }
`;

const FileName = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
  padding-left: 1rem;
  border-left: 2px solid var(--accent-color);
`;

const VisualizerSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
`;

const SectionIcon = styled.span`
  color: var(--primary-color);
  margin-right: 0.5rem;
  font-size: 0.8rem;
`;

const WaveformContainer = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid rgba(0, 240, 255, 0.1);
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const TimeDisplay = styled.div`
  font-family: 'Orbitron', monospace;
  color: var(--primary-color);
  font-size: 0.9rem;
`;

const PlayButton = styled.button`
  min-width: 80px;
`;

const SpectrumCanvas = styled.canvas`
  width: 100%;
  height: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(0, 240, 255, 0.1);
`;

const FrequencyAnalysisContainer = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const VisualizerColumn = styled.div`
  flex: 1;
`;

const FrequencyInfo = styled.span`
  margin-left: auto;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
`;

const EmptyState = styled.div`
  padding: 3rem 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
`;

const WaveformTip = styled.span`
  margin-left: auto;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 2px;
`;

export default AudioVisualizer;