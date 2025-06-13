## ✨ 特性

- 🎵 音频波形可视化
- 🔊 频谱分析（低频和高频）
- 🎨 基于音频的克拉尼图形生成
- 💫 支持多种图形类型（方形、圆形、十字形）
- 🎛️ 复杂度可调节
- 🌊 动态背景波浪效果
- 💎 现代毛玻璃UI界面

![Audio Artistor Screenshot](screenshot.png)

## 🔧 技术栈

- **前端框架**: React
- **样式**: Styled Components
- **音频处理**: Web Audio API
- **波形渲染**: WaveSurfer.js
- **图形生成**: P5.js
- **构建工具**: Vite

## 🚀 本地运行

### 前提条件

- Node.js (推荐 v14.x 或更高版本)
- npm 或 yarn

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/lingfeng11111/Audio-artistor.git
   cd Audio-artistor
   ```

2. 安装依赖
   ```bash
   npm install
   # 或者使用 yarn
   yarn
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   # 或者使用 yarn
   yarn dev
   ```

4. 打开浏览器并访问 `http://localhost:5173/`

## 📦 构建生产版本

```bash
npm run build
# 或者使用 yarn
yarn build
```

构建后的文件将位于 `dist` 目录中，可以部署到任何静态网站托管服务。

## 📝 使用指南

1. 点击上传区域或将音频文件拖放到上传区域
2. 支持的音频格式: MP3, WAV, OGG, FLAC
3. 上传后，音频波形将自动显示
4. 使用播放按钮控制音频播放
5. 克拉尼图形区域将根据音频生成动态图形
6. 可以调整克拉尼图形的类型和复杂度

## 🧩 项目结构

```
/src
├── assets/         # 静态资源
├── components/     # React组件
│   ├── AudioUpload.jsx         # 音频上传组件
│   ├── AudioVisualizer.jsx     # 音频可视化组件
│   ├── BackgroundWaves.jsx     # 背景波浪效果
│   ├── ChladniPattern.jsx      # 克拉尼图形生成组件
│   └── Header.jsx              # 页面头部组件
├── hooks/          # 自定义React钩子
├── styles/         # 全局样式
├── App.jsx         # 主应用组件
└── main.jsx        # 应用入口点
```

## 📞 联系方式

@凌峰   2328972932@qq.com
