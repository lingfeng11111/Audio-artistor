import styled from 'styled-components';

const Header = () => {
  return (
    <HeaderContainer>
      <Title>
        <GlowText>Audio</GlowText>
        <HighlightText>Artistor</HighlightText>
      </Title>
      <Subtitle>上传音频文件以查看频谱和克拉尼图形</Subtitle>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  padding: 2rem 0;
  text-align: center;
  position: relative;
  
  &::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(0, 240, 255, 0.3), 
      rgba(0, 240, 255, 0.8), 
      rgba(0, 240, 255, 0.3), 
      transparent);
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;

const GlowText = styled.span`
  color: #ffffff;
  position: relative;
  
  &::after {
    content: "";
    position: absolute;
    top: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background-color: #ffffff;
    border-radius: 50%;
  }
`;

const HighlightText = styled.span`
  color: #ffffff;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #ffffff;
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Rajdhani', sans-serif;
`;

export default Header;