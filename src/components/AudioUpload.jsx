import { useState, useRef } from 'react';
import styled from 'styled-components';

const AudioUpload = ({ onAudioLoad }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      processFile(file);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };
  
  const processFile = (file) => {
    setFileName(file.name);
    console.log("准备处理文件:", file.name, "类型:", file.type, "大小:", file.size);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      console.log("FileReader读取完成, arrayBuffer大小:", arrayBuffer.byteLength);
      onAudioLoad(arrayBuffer, file.name);
    };
    reader.onerror = (error) => {
      console.error("FileReader错误:", error);
    };
    reader.readAsArrayBuffer(file);
  };
  
  const openFileDialog = () => {
    fileInputRef.current.click();
  };
  
  return (
    <Container>
      <UploadArea 
        data-is-dragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <UploadIcon>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 15V3m0 0L8 7m4-4l4 4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </UploadIcon>
        
        <UploadText>
          {fileName ? `已选择: ${fileName}` : '拖放音频文件或点击上传'}
        </UploadText>
        
        <HiddenInput 
          type="file" 
          ref={fileInputRef}
          accept="audio/*" 
          onChange={handleFileChange} 
        />
      </UploadArea>
      
      <SupportedFormats>
        支持的格式: MP3, WAV, OGG, FLAC
      </SupportedFormats>
    </Container>
  );
};

const Container = styled.div`
  margin: 2rem 0;
`;

const UploadArea = styled.div`
  border: 2px dashed ${props => props["data-is-dragging"] ? 'var(--primary-color)' : 'var(--border-color)'};
  background: ${props => props["data-is-dragging"] 
    ? 'rgba(0, 240, 255, 0.05)' 
    : 'rgba(10, 15, 25, 0.2)'};
  backdrop-filter: var(--glass-effect);
  -webkit-backdrop-filter: var(--glass-effect);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props["data-is-dragging"] 
    ? '0 0 20px rgba(0, 240, 255, 0.3)' 
    : '0 0 10px rgba(0, 0, 0, 0.3)'};
  
  &:hover {
    background: rgba(0, 240, 255, 0.05);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
  }
`;

const UploadIcon = styled.div`
  color: #ffffff;
  margin-bottom: 1rem;
  
  svg {
    filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.5));
  }
`;

const UploadText = styled.p`
  color: #ffffff;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const HiddenInput = styled.input`
  display: none;
`;

const SupportedFormats = styled.p`
  font-size: 0.8rem;
  color: #ffffff;
  text-align: center;
  margin-top: 0.5rem;
`;

export default AudioUpload;