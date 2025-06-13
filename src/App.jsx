import { useState, useEffect } from 'react'
import styled from 'styled-components'
import GlobalStyles from './styles/GlobalStyles'
import Header from './components/Header'
import AudioUpload from './components/AudioUpload'
import AudioVisualizer from './components/AudioVisualizer'
import ChladniPattern from './components/ChladniPattern'
import BackgroundWaves from './components/BackgroundWaves'
import useAudioProcessor from './hooks/useAudioProcessor'

function App() {
  const { 
    audioBuffer, 
    fileName, 
    error, 
    isProcessing, 
    handleAudioLoad, 
    clearAudio 
  } = useAudioProcessor();

  // 添加统一的播放状态管理
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 当播放状态变化时记录日志
  useEffect(() => {
    console.log("全局播放状态变化:", isPlaying ? "播放" : "暂停");
  }, [isPlaying]);
  
  // 处理全局音频清除，确保停止播放
  const handleClearAudio = () => {
    console.log("执行清除音频操作");
    
    // 确保先停止播放
    setIsPlaying(false);
    
    // 然后清除音频 - 增加延迟以确保组件有时间响应播放状态变化
    setTimeout(() => {
      // 触发全局清除
      clearAudio();
      
      console.log("音频已清除");
    }, 200);
  };

  // 背景波浪使用的颜色
  const backgroundColors = [
    "#0A2463", // 深蓝色
    "#3E92CC", // 亮蓝色
    "#2CA6A4", // 青绿色
    "#73D2DE", // 浅蓝色
    "#7B287D", // 紫色
    "#3D0066"  // 深紫色
  ];

  console.log("App渲染, audioBuffer状态:", audioBuffer ? "已加载" : "未加载", "播放状态:", isPlaying);

  return (
    <>
      <GlobalStyles />
      <BackgroundWaves colors={backgroundColors} />
      
      <AppContainer>
        <Header />
        
        <MainContent>
          <GlassPanel>
            <AudioUpload onAudioLoad={handleAudioLoad} />
          
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {isProcessing && <LoadingMessage>处理音频中...</LoadingMessage>}
          </GlassPanel>
          
          <VisualizersContainer>
            <VisualizerColumn>
              <AudioVisualizer 
                audioBuffer={audioBuffer} 
                fileName={fileName} 
                isPlaying={isPlaying} 
                setIsPlaying={setIsPlaying}
                ref={(ref) => window.audioVisualizerRef = ref}
              />
            </VisualizerColumn>
            
            <VisualizerColumn>
              <ChladniPattern 
                audioBuffer={audioBuffer}
                isPlaying={isPlaying}
                audioVisualizerRef={window.audioVisualizerRef}
              />
            </VisualizerColumn>
          </VisualizersContainer>
          
          {audioBuffer && (
            <ClearButton onClick={handleClearAudio}>
              清除并上传新音频
            </ClearButton>
          )}
        </MainContent>
        
        <Footer>
          <TechStack>
            使用 React + Web Audio API + WaveSurfer.js + P5.js 开发
          </TechStack>
          <ContactInfo>
            @凌峰   2328972932@qq.com
          </ContactInfo>
        </Footer>
      </AppContainer>
    </>
  )
}

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const MainContent = styled.main`
  margin: 2rem 0;
`;

// 毛玻璃效果卡片
const GlassPanel = styled.div`
  background: rgba(15, 20, 40, 0.2);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const VisualizersContainer = styled.div`
  display: flex;
  gap: 2rem;
  margin: 2rem 0;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
`;

const VisualizerColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-left: 4px solid var(--accent-color);
  padding: 1rem;
  margin: 1rem 0;
  color: #ffffff;
  border-radius: 4px;
`;

const LoadingMessage = styled.div`
  background-color: rgba(0, 240, 255, 0.1);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  margin: 1rem 0;
  color: #ffffff;
  border-radius: 4px;
  text-align: center;
  
  &:after {
    content: ".";
    animation: dots 1.5s steps(5, end) infinite;
  }
  
  @keyframes dots {
    0%, 20% {
      color: rgba(0, 0, 0, 0);
      text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
    }
    40% {
      color: #ffffff;
      text-shadow: 0.3em 0 0 rgba(0, 0, 0, 0), 0.6em 0 0 rgba(0, 0, 0, 0);
    }
    60% {
      text-shadow: 0.3em 0 0 #ffffff, 0.6em 0 0 rgba(0, 0, 0, 0);
    }
    80%, 100% {
      text-shadow: 0.3em 0 0 #ffffff, 0.6em 0 0 #ffffff;
    }
  }
`;

const ClearButton = styled.button`
  display: block;
  margin: 2rem auto;
  background: rgba(255, 0, 119, 0.2);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border: 1px solid rgba(255, 0, 119, 0.3);
  color: #ffffff;
  
  &:hover {
    background: rgba(255, 0, 119, 0.3);
  }
`;

const Footer = styled.footer`
  margin-top: 4rem;
  text-align: center;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const TechStack = styled.p`
  font-size: 0.8rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const ContactInfo = styled.p`
  font-size: 0.8rem;
  color: #ffffff;
  margin-top: 0.5rem;
`;

export default App
