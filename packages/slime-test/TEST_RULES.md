# 测试规范

## 测试架构

测试分为两套，共 6 个阶段文件：

### 默认测试（TypeScript + JavaScript）
使用 `SlimeParser` + `SlimeCstToAst` + `SlimeGenerator`

| 文件 | 阶段 | 说明 |
|------|------|------|
| `test-stage1.ts` | CST 生成 | 词法分析 → 语法分析 |
| `test-stage2.ts` | AST 生成 | CST → AST 转换 |
| `test-stage3.ts` | 代码生成 | AST → 代码，比较 token 序列 |

### JavaScript 专用测试
使用 `SlimeJavascriptParser` + `SlimeCstToAst` + `SlimeJavascriptGenerator`

| 文件 | 阶段 | 说明 |
|------|------|------|
| `test-js-stage1.ts` | CST 生成 | 仅 JavaScript 语法 |
| `test-js-stage2.ts` | AST 生成 | 仅 JavaScript 语法 |
| `test-js-stage3.ts` | 代码生成 | 仅 JavaScript 语法 |

## 组件对应关系

| 组件 | 默认（TS+JS） | JavaScript 专用 |
|------|--------------|----------------|
| Parser | `SlimeParser` | `SlimeJavascriptParser` |
| CstToAst | `SlimeCstToAst` | `SlimeCstToAst` |
| Generator | `SlimeGenerator` | `SlimeJavascriptGenerator` |

> **注意**: CstToAst 不区分 JS/TS，统一使用 `SlimeCstToAst`

## 运行测试

### 在 slime-test 包目录下运行

```bash
cd packages/slime-test

# 运行单个阶段
npm run test:stage1      # 默认 Stage 1
npm run test:stage2      # 默认 Stage 2
npm run test:stage3      # 默认 Stage 3

npm run test:js-stage1   # JS Stage 1
npm run test:js-stage2   # JS Stage 2
npm run test:js-stage3   # JS Stage 3

# 运行全部
npm run test             # 运行默认全部阶段
npm run test:js          # 运行 JS 全部阶段
```

### 在项目根目录运行

```bash
# 使用 npx tsx 直接运行
npx tsx --conditions=development packages/slime-test/src/utils/test-stage1.ts

# 从指定测试编号开始
npx tsx --conditions=development packages/slime-test/src/utils/test-stage1.ts 100

# 遇错停止模式
npx tsx --conditions=development packages/slime-test/src/utils/test-stage1.ts 100 -s
```

## 开发模式说明

使用 `--conditions=development` 参数启用开发模式，直接从源码导入本地包，无需构建。

这是因为各包的 `package.json` 配置了：
```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "import": "./dist/index.mjs"
    }
  }
}
```

## 测试用例来源

测试用例来自 `slime-babel-test` 包，包含 Babel 和 ESprima 的测试 fixtures。

### 跳过的测试类型

- 错误恢复测试（errorRecovery）
- 期望抛出错误的测试（throws）
- 非标准插件（decorators, pipelineOperator 等）
- Babel 扩展选项（allowAwaitOutsideFunction 等）
- TypeScript 语法（在 JS 专用测试中跳过）
- accessor 提案（暂不支持）
