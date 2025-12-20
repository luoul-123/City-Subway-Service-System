# 贡献指南

欢迎您对城市地铁服务系统项目感兴趣！本指南将帮助您了解如何为项目做出贡献。

## 📋 目录

- [如何贡献](#-如何贡献)
  - [报告问题](#报告问题)
  - [功能建议](#功能建议)
  - [提交代码](#提交代码)

## 🚀 如何贡献

### 报告问题

如果您发现了bug或有问题要报告：

1. 在[Issues页面](https://github.com/luoul-123/City-Subway-Service-System/issues)搜索是否已有类似问题
2. 如果没有，创建新的issue
3. 在issue中提供：
   - 清晰的标题
   - 详细的问题描述
   - 重现步骤
   - 期望的行为
   - 截图或错误信息（如果有）
   - 您的环境信息（浏览器、操作系统等）

### 功能建议

如果您有新的功能想法：

1. 创建新的issue，选择"Feature Request"标签
2. 详细描述：
   - 您想添加什么功能
   - 为什么需要这个功能
   - 如何使用这个功能
   - 可能的实现方案

### 提交代码

1. **Fork仓库**
   - 点击GitHub页面右上角的"Fork"按钮
   - 这将创建您自己的项目副本

2. **克隆您的Fork**
   ```bash
   git clone https://github.com/您的用户名/City-Subway-Service-System.git
   cd City-Subway-Service-System
   ```

3. **创建新分支**
    ```bash
    git checkout -b 分支类型/简短描述
    示例：
    git checkout -b feature/user-profile
    git checkout -b fix/login-validation
   ```

4. **进行更改并提交**
    ```bash
    git add .
    git commit -m
    ```

5. **推送到您的Fork**
    ```bash
    git push origin 您的分支名
    ```

6. **创建Pull Request**
    - 访问您Fork的GitHub页面
    - 点击"Compare & pull request"按钮
    - 填写PR描述，使用以下模板：
    ```bash
    ## 描述
    [简要描述这次PR做了什么]

    ## 相关Issue
    [链接到相关issue，格式：Closes #Issue编号 或 Fixes #Issue编号]

    ## 变更类型
    - [ ] Bug修复
    - [ ] 新功能
    - [ ] 破坏性更改（现有API变更）
    - [ ] 文档更新
    - [ ] 其他（请说明）

    ## 检查清单
    - [ ] 我的代码遵循项目的代码规范
    - [ ] 我已经进行自测
    - [ ] 我已经添加了必要的测试
    - [ ] 我已经更新了相关文档

    ## 截图（如适用）
    [添加相关截图]

    ## 测试步骤
    1. [第一步]
    2. [第二步]
    3. [第三步]

    ## 备注
    [其他需要说明的信息]
    ```

感谢您愿意为该城市地铁服务系统做出贡献🎉

