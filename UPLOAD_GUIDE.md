# 如何上传项目到GitHub

以下是将项目上传到GitHub仓库的详细步骤：

## 1. 创建新仓库（已创建可跳过）

如果你还没有创建GitHub仓库，请先在GitHub上创建一个名为"Audio-artistor"的新仓库。

## 2. 初始化本地Git仓库并上传

### 方法1: 创建新仓库并上传

如果这是一个全新的仓库，请按照以下步骤操作：

```bash
# 初始化Git仓库
git init

# 添加所有文件到暂存区
git add .

# 提交更改
git commit -m "初始提交：Audio Artistor音频可视化工具"

# 设置分支名称为main（GitHub默认分支名）
git branch -M main

# 添加远程仓库
git remote add origin https://github.com/lingfeng11111/Audio-artistor.git

# 推送到GitHub
git push -u origin main
```

### 方法2: 推送现有仓库

如果已经初始化了Git仓库，只需要添加远程仓库并推送：

```bash
# 添加远程仓库
git remote add origin https://github.com/lingfeng11111/Audio-artistor.git

# 设置分支名称为main
git branch -M main

# 推送到GitHub
git push -u origin main
```

## 3. 后续更新

完成初始推送后，每次修改代码后可以使用以下命令更新GitHub仓库：

```bash
# 添加修改的文件
git add .

# 提交更改，添加有意义的提交信息
git commit -m "更新：描述你的更改"

# 推送到GitHub
git push
```

## 4. 验证上传

完成上传后，访问https://github.com/lingfeng11111/Audio-artistor 确认文件已正确上传。

## 注意事项

1. 确保在项目根目录下执行Git命令
2. 如果遇到权限问题，可能需要配置GitHub认证
3. 记得替换README.md中的截图为实际项目截图
4. 大文件可能需要使用Git LFS上传 