import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
`;

const BackgroundWaves = ({ colors }) => {
  const containerRef = useRef(null);
  const wavesBgRef = useRef(null);

  useEffect(() => {
    // 确保脚本已加载
    if (typeof window.Color4Bg === 'undefined') {
      console.error('ChaosWavesBg.min.js 未加载');
      return;
    }

    if (containerRef.current && !wavesBgRef.current) {
      try {
        wavesBgRef.current = new window.Color4Bg.ChaosWavesBg({
          dom: containerRef.current.id,
          colors: colors || undefined,
          loop: true
        });
        
        console.log('背景波浪效果已初始化');
      } catch (error) {
        console.error('初始化背景波浪效果时出错:', error);
      }
    }

    return () => {
      // 清理资源
      if (wavesBgRef.current && typeof wavesBgRef.current.destroy === 'function') {
        try {
          wavesBgRef.current.destroy();
          wavesBgRef.current = null;
          console.log('背景波浪效果已销毁');
        } catch (error) {
          console.error('销毁背景波浪效果时出错:', error);
        }
      }
    };
  }, [colors]);

  return <BackgroundContainer id="background-waves" ref={containerRef} />;
};

export default BackgroundWaves; 