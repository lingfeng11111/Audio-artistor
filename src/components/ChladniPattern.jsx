import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import p5 from 'p5';

const ChladniPattern = ({ audioBuffer, isPlaying, audioVisualizerRef }) => {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const animationActiveRef = useRef(false);
  
  const [patternType, setPatternType] = useState('square');
  const [complexity, setComplexity] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // 清理资源函数
  const cleanupResources = () => {
    console.log("清理克拉尼图形资源");
    
    // 先标记动画为非活跃状态
    animationActiveRef.current = false;
    setIsGenerating(false);
    
    // 清理P5实例
    if (p5InstanceRef.current) {
      try {
        p5InstanceRef.current.remove();
      } catch (e) {
        console.log("移除P5实例时出错:", e);
      }
      p5InstanceRef.current = null;
    }
  };
  
  // 在组件卸载时清理资源
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);
  
  // 初始化并随audioBuffer变化重建P5实例
  useEffect(() => {
    if (!audioBuffer) {
      // 当audioBuffer为null时（例如清除音频时），清理资源
      console.log("ChladniPattern: audioBuffer为null，清理资源");
      cleanupResources();
      return;
    }
    
    if (!containerRef.current) return;
    
    console.log("ChladniPattern: 初始化组件");
    
    try {
      // 清除之前的实例
      cleanupResources();
      
      // 创建P5实例
      const sketch = (p) => {
        let particles = [];
        let freqData;
        const numParticles = 5000;  // 增加粒子数量以获得更好的效果
        let width, height;
        
        p.setup = () => {
          width = containerRef.current.clientWidth;
          height = Math.min(containerRef.current.clientWidth, 500);
          
          p.createCanvas(width, height);
          p.colorMode(p.HSB, 255);
          p.background(0);
          
          // 初始化粒子 - 确保粒子分布均匀
          initializeParticles();
          
          // 初始化频率数据数组
          freqData = new Uint8Array(1024); // 默认大小，后续会从分析器获取实际大小
        };
        
        // 提取粒子初始化到单独的函数，以便在需要时重新初始化
        const initializeParticles = () => {
          particles = [];
          
          const centerX = width / 2;
          const centerY = height / 2;
          const maxRadius = Math.min(width, height) / 2;
          
          // 不同图形类型的颜色主题
          const colorThemes = {
            square: { h: [160, 220], s: [180, 255], b: [200, 255] },  // 青蓝色
            circle: { h: [0, 60], s: [180, 255], b: [200, 255] },     // 红橙色
            cross: { h: [270, 330], s: [180, 255], b: [200, 255] }    // 紫色
          };
          
          // 使用当前图形类型的颜色主题
          const theme = colorThemes[patternType] || colorThemes.square;
          
          for (let i = 0; i < numParticles; i++) {
            // 生成均匀分布的点
            let x, y;
            
            // 混合策略: 部分随机分布，部分集中在中心区域
            if (i < numParticles * 0.7) {
              // 70%的粒子完全随机分布
              x = p.random(width);
              y = p.random(height);
            } else {
              // 30%的粒子在中心区域的高斯分布
              const angle = p.random(p.TWO_PI);
              const radius = p.randomGaussian(0, maxRadius * 0.5);  // 使用高斯分布
              x = centerX + Math.cos(angle) * radius;
              y = centerY + Math.sin(angle) * radius;
              
              // 确保在画布范围内
              x = p.constrain(x, 0, width);
              y = p.constrain(y, 0, height);
            }
            
            particles.push({
              x: x,
              y: y,
              size: p.random(1.5, 4),  // 稍微增大粒子尺寸
              color: p.color(
                p.random(theme.h[0], theme.h[1]),  // 色相
                p.random(theme.s[0], theme.s[1]),  // 饱和度
                p.random(theme.b[0], theme.b[1])   // 亮度
              )
            });
          }
        };
        
        p.draw = () => {
          // 降低透明度以创建拖尾效果
          p.background(0, 25); // 降低透明度,增强拖尾效果
          
          // 添加一个渐变背景,使图形更有层次感
          const gradientHeight = height;
          for (let i = 0; i < gradientHeight; i++) {
            const inter = p.map(i, 0, gradientHeight, 0, 1);
            const c = p.lerpColor(
              p.color(0, 0, 5),     // 深色背景底部
              p.color(10, 0, 30),   // 稍微亮一点的顶部
              inter
            );
            p.stroke(c);
            p.line(0, i, width, i);
          }
          p.noStroke();
          
          // 从AudioVisualizer获取音频分析器
          const analyser = audioVisualizerRef?.getAnalyser();
          
          // 如果不在生成状态或没有音频分析器，显示静态但有趣的效果
          if (!analyser || !isPlaying) {
            // 显示静态粒子，但添加一点随机动画
            for (let particle of particles) {
              // 添加轻微的随机移动，即使在静止状态
              if (p.random() < 0.1) { // 只有10%的粒子会移动
                particle.x += p.random(-0.5, 0.5);
                particle.y += p.random(-0.5, 0.5);
                
                // 确保粒子保持在边界内
                particle.x = p.constrain(particle.x, 0, width);
                particle.y = p.constrain(particle.y, 0, height);
              }
              
              p.fill(particle.color);
              p.ellipse(particle.x, particle.y, particle.size, particle.size);
            }
            return;
          }
          
          try {
            // 尝试获取频域数据
            if (analyser) {
              // 确保freqData数组大小正确
              if (freqData.length !== analyser.frequencyBinCount) {
                freqData = new Uint8Array(analyser.frequencyBinCount);
              }
              
              // 获取频域数据
              analyser.getByteFrequencyData(freqData);
              
              // 检查是否有有效数据
              let hasData = false;
              for (let i = 0; i < freqData.length; i++) {
                if (freqData[i] > 0) {
                  hasData = true;
                  break;
                }
              }
              
              // 如果没有数据，创建模拟的音频数据
              const defaultValue = 0.3; // 模拟数据的基础值
              
              // 计算或模拟频率平均值
              let bassAvg, midAvg, trebleAvg;
              
              if (hasData) {
                // 实际分析音频数据
                let bassSum = 0;
                let midSum = 0;
                let trebleSum = 0;
                
                // 更精确地定义频率范围
                const lowRange = Math.floor(freqData.length * 0.15); // 低频 (0-15%)
                const midRange = Math.floor(freqData.length * 0.5);  // 中频 (15-50%)
                
                for (let i = 0; i < freqData.length; i++) {
                  if (i < lowRange) {
                    // 低频范围，加权更重
                    bassSum += freqData[i] * 1.2;
                  } else if (i < midRange) {
                    // 中频范围
                    midSum += freqData[i];
                  } else {
                    // 高频范围
                    trebleSum += freqData[i] * 0.8;
                  }
                }
                
                // 计算平均值并规范化
                bassAvg = (bassSum / lowRange) / 255;
                midAvg = (midSum / (midRange - lowRange)) / 255;
                trebleAvg = (trebleSum / (freqData.length - midRange)) / 255;
                
                // 应用最小值，确保即使声音很小也有视觉效果
                bassAvg = Math.max(bassAvg, defaultValue * 0.7);
                midAvg = Math.max(midAvg, defaultValue * 0.5);
                trebleAvg = Math.max(trebleAvg, defaultValue * 0.3);
              } else {
                // 如果没有实际数据，创建周期性变化的模拟值
                const time = p.millis() * 0.001; // 转换为秒
                
                // 使用不同频率的正弦波模拟各频段变化
                bassAvg = defaultValue + Math.sin(time * 0.5) * 0.1;
                midAvg = defaultValue + Math.sin(time * 0.8) * 0.08;
                trebleAvg = defaultValue + Math.sin(time * 1.2) * 0.06;
              }
              
              // 生成克拉尼图形
              p.noStroke();
              
              // 为了增加效果的可见性，绘制更多粒子
              const activeParticleCount = Math.min(particles.length, 2000);
              
              for (let i = 0; i < activeParticleCount; i++) {
                const particle = particles[i];
                
                // 获取粒子位置（相对于中心点）
                let x = particle.x - width / 2;
                let y = particle.y - height / 2;
                
                // 计算克拉尼图形方程
                // 使用fixed + dynamic参数，确保即使没有音频也能产生基本图形
                let n = complexity * Math.max(0.8, bassAvg * 2); // 控制图形复杂度，提高基础值
                let m = complexity * Math.max(0.8, midAvg * 2);
                
                let z;
                if (patternType === 'square') {
                  z = Math.sin(n * Math.PI * x / width) * Math.sin(m * Math.PI * y / height);
                } else if (patternType === 'circle') {
                  let r = Math.sqrt(x * x + y * y) / (width / 2);
                  let theta = Math.atan2(y, x);
                  z = Math.sin(n * r) * Math.cos(m * theta);
                } else {
                  // 十字型
                  z = Math.sin(n * Math.PI * x / width) * Math.sin(m * Math.PI * y / height) + 
                      Math.sin(m * Math.PI * x / width) * Math.sin(n * Math.PI * y / height);
                }
                
                // 增大临界值的范围，让更多粒子可见
                const threshold = 0.05 * Math.max(1, 1 + midAvg);
                
                // 根据方程值移动粒子
                let d = 3 + trebleAvg * 8; // 增加运动范围
                
                if (Math.abs(z) < threshold) {
                  particle.x += p.random(-d, d);
                  particle.y += p.random(-d, d);
                  
                  // 限制粒子在画布内
                  particle.x = p.constrain(particle.x, 0, width);
                  particle.y = p.constrain(particle.y, 0, height);
                  
                  // 绘制粒子，增大尺寸提高可见性
                  p.fill(particle.color);
                  const particleSize = Math.max(1.5, particle.size * (1 + bassAvg * 2));
                  p.ellipse(particle.x, particle.y, particleSize, particleSize);
                }
              }
            }
          } catch (err) {
            console.error("在p5绘制函数中出错:", err);
          }
        };
        
        p.windowResized = () => {
          if (containerRef.current) {
            // 更新画布尺寸
            const oldWidth = width;
            const oldHeight = height;
            
            width = containerRef.current.clientWidth;
            height = Math.min(containerRef.current.clientWidth, 500);
            
            p.resizeCanvas(width, height);
            p.background(0);
            
            // 如果是第一次调整大小，旧值可能为0
            if (oldWidth > 0 && oldHeight > 0) {
              // 调整粒子位置，保持相对位置
              const scaleX = width / oldWidth;
              const scaleY = height / oldHeight;
              
              for (let particle of particles) {
                // 更新粒子位置，按比例缩放
                particle.x = particle.x * scaleX;
                particle.y = particle.y * scaleY;
                
                // 确保在边界内
                particle.x = p.constrain(particle.x, 0, width);
                particle.y = p.constrain(particle.y, 0, height);
              }
            }
          }
        };
      };
      
      // 创建P5实例
      p5InstanceRef.current = new p5(sketch, containerRef.current);
      
      // 添加一个重新可视化的方法，使外部可以触发重新可视化
      p5InstanceRef.current.revisualizePattern = () => {
        // 如果实例存在且容器已渲染
        if (p5InstanceRef.current && containerRef.current) {
          console.log("强制重新初始化克拉尼图形...");
          // 重新初始化粒子以匹配当前设置
          if (typeof p5InstanceRef.current._preload === 'function') {
            try {
              // 访问sketch内部的函数
              const p = p5InstanceRef.current;
              // 重新分配相关变量
              animationActiveRef.current = true;
              setIsGenerating(true);
            } catch (e) {
              console.error("重新初始化粒子时出错:", e);
            }
          }
        }
      };
      
      return () => {
        cleanupResources();
      };
    } catch (error) {
      console.error('ChladniPattern初始化错误:', error);
      setError('初始化克拉尼图形时出错: ' + error.message);
    }
  }, [audioBuffer, patternType]);
  
  // 监听播放状态变化
  useEffect(() => {
    console.log("播放状态变化:", isPlaying, "当前生成状态:", isGenerating);
    
    // 确保有效的audioBuffer和audioVisualizerRef
    if (!audioBuffer || !audioVisualizerRef) {
      if (isGenerating) {
        setIsGenerating(false);
        animationActiveRef.current = false;
      }
      return;
    }
    
    // 根据播放状态更新生成状态
    setIsGenerating(isPlaying);
    animationActiveRef.current = isPlaying;
    
    // 如果开始播放且有P5实例，确保图形立即显示活跃状态
    if (isPlaying && p5InstanceRef.current && p5InstanceRef.current.revisualizePattern) {
      p5InstanceRef.current.revisualizePattern();
    }
    
    console.log(`克拉尼图形状态已更新为: ${isPlaying ? '活跃' : '暂停'}`);
  }, [isPlaying, audioBuffer, audioVisualizerRef]);
  
  // 如果图形类型或复杂度变化，需要重新初始化
  useEffect(() => {
    if (audioBuffer && containerRef.current && p5InstanceRef.current) {
      // 重新创建图形，保持当前状态
      const currentState = isGenerating;
      
      // 清理并重建P5实例 (通过触发audioBuffer依赖项的useEffect)
      cleanupResources();
      
      // 短暂延迟后恢复状态
      setTimeout(() => {
        setIsGenerating(currentState && isPlaying);
        animationActiveRef.current = currentState && isPlaying;
      }, 100);
    }
  }, [patternType, complexity]);
  
  return (
    <Container>
      <Title>
        <TitleIcon>◈</TitleIcon>
        克拉尼图形生成器
      </Title>
      
      {audioBuffer ? (
        <>
          <Controls>
            <ControlGroup>
              <ControlLabel>图形类型:</ControlLabel>
              <Select value={patternType} onChange={(e) => setPatternType(e.target.value)}>
                <option value="square">方形</option>
                <option value="circle">圆形</option>
                <option value="cross">十字形</option>
              </Select>
            </ControlGroup>
            
            <ControlGroup>
              <ControlLabel>复杂度: {complexity}</ControlLabel>
              <RangeSlider 
                type="range" 
                min="2" 
                max="20" 
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
              />
            </ControlGroup>
          </Controls>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <PatternContainer ref={containerRef} />
          
          <Description>
            克拉尼图形是由声波引起的二维表面上的节点线图形,展现了声波的固有频率与振动模式。
          </Description>
        </>
      ) : (
        <EmptyState>请上传音频文件以生成克拉尼图形</EmptyState>
      )}
    </Container>
  );
};

const Container = styled.div`
  margin: 2rem 0;
  background: var(--panel-bg);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
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
  color: #ffffff;
  display: flex;
  align-items: center;
`;

const TitleIcon = styled.span`
  color: #ffffff;
  margin-right: 0.5rem;
  font-size: 1.2rem;
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-radius: 4px;
  border: 1px solid var(--border-color);
`;

const ControlGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ControlLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #ffffff;
`;

const Select = styled.select`
  width: 100%;
  background: rgba(10, 15, 25, 0.2);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border: 1px solid var(--border-color);
  color: #ffffff;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Rajdhani', sans-serif;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(119, 0, 255, 0.3);
  }
`;

const RangeSlider = styled.input`
  width: 100%;
  background: transparent;
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: #ffffff;
    border-radius: 2px;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #ffffff;
    cursor: pointer;
    margin-top: -6px;
  }
`;

const PatternContainer = styled.div`
  width: 100%;
  flex-grow: 1;
  min-height: 400px;
  max-height: 500px;
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 50px rgba(119, 0, 255, 0.2);
    z-index: 1;
    pointer-events: none;
  }
  
  canvas {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 0;
    opacity: 0.9;
  }
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: #ffffff;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-radius: 4px;
  border-left: 2px solid var(--secondary-color);
`;

const EmptyState = styled.div`
  padding: 3rem 0;
  text-align: center;
  color: #ffffff;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-left: 4px solid var(--accent-color);
  padding: 0.8rem;
  margin: 1rem 0;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.9rem;
`;

export default ChladniPattern;