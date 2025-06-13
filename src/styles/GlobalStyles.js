import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --primary-color: #00f0ff;
    --secondary-color: #7700ff;
    --bg-color: #080808;
    --text-color: #ffffff;
    --accent-color: #ff0077;
    --dark-accent: #001029;
    --panel-bg: rgba(5, 10, 20, 0.2);
    --border-color: rgba(255, 255, 255, 0.1);
    --glass-effect: blur(10px);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Rajdhani', 'Orbitron', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    min-height: 100vh;
    overflow-x: hidden;
    font-weight: 500;
  }

  button {
    background: rgba(10, 20, 40, 0.2);
    backdrop-filter: var(--glass-effect);
    -webkit-backdrop-filter: var(--glass-effect);
    border: 1px solid var(--border-color);
    color: #ffffff;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: 'Orbitron', sans-serif;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: rgba(10, 20, 40, 0.3);
      box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
    }
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--dark-accent);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--primary-color);
    border-radius: 3px;
  }
`;

export default GlobalStyles;