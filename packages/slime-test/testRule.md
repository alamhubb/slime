# 测试规则与问题排查指南

本文档记录了测试流程、规范和常见问题的排查方法。

## 目录

1. [测试流程与规范](#1-测试流程与规范)
2. [测试结果汇总](#2-测试结果汇总)
3. [问题定位方法](#3-问题定位方法)
4. [常见问题排查](#4-常见问题排查)
5. [调试技巧](#5-调试技巧)

---

## 1. 测试流程与规范

### 1.1 测试执行顺序（必须严格遵守）

```
Stage 1 (CST生成) → Stage 2 (AST生成) → Stage 3 (代码生成)
     ↓                    ↓                    ↓
   JS先 → TS后          JS先 → TS后          JS先 → TS后
```

**完整测试顺序：**
1. JS Stage 1: `SlimeJavascriptParser` CST 生成
2. TS Stage 1: `SlimeParser` CST 生成
3. JS Stage 2: `SlimeJavascriptParser` + `SlimeJavascriptCstToAst` AST 生成
4. TS Stage 2: `SlimeParser` + `SlimeCstToAst` AST 生成
5. JS Stage 3: `SlimeJavascriptParser` + `SlimeJavascriptCstToAst` + `SlimeJavascriptGenerator` 代码生成
6. TS Stage 3: `SlimeParser` + `SlimeCstToAst` + `SlimeGenerator` 代码生成

### 1.2 测试命令

```bash
# JavaScript 测试 (使用 SlimeJavascriptParser + SlimeJavascriptCstToAst + SlimeJavascriptGenerator)
npx tsx packages/slime-test/src/utils/test-js-stage1.ts  # JS CST生成测试
npx tsx packages/slime-test/src/utils/test-js-stage2.ts  # JS AST生成测试
npx tsx packages/slime-test/src/utils/test-js-stage3.ts  # JS 代码生成测试

# TypeScript 测试 (使用 SlimeParser + SlimeCstToAst + SlimeGenerator)
npx tsx packages/slime-test/src/utils/test-ts-stage1.ts  # TS CST生成测试
npx tsx packages/slime-test/src/utils/test-ts-stage2.ts  # TS AST生成测试
npx tsx packages/slime-test/src/utils/test-ts-stage3.ts  # TS 代码生成测试

# 从指定测试编号开始（用于调试失败的测试）
npx tsx packages/slime-test/src/utils/test-ts-stage3.ts 2271
```

### 1.3 组件对应关系

| 组件 | JavaScript 版本 | TypeScript 版本 |
|------|----------------|-----------------|
| Parser | `SlimeJavascriptParser` | `SlimeParser` |
| CstToAst | `SlimeJavascriptCstToAst` | `SlimeCstToAst` |
| Generator | `SlimeJavascriptGenerator` | `SlimeGenerator` |

---

## 2. 测试结果汇总

### 最新测试结果 (2024-12-23)

| 测试 | Parser | 状态 |
|------|--------|------|
| JS Stage 1 | SlimeJavascriptParser | ✅ 1732 passed |
| TS Stage 1 | SlimeParser | ✅ 1732 passed |
| JS Stage 2 | SlimeJavascriptParser | ✅ 1732 passed |
| TS Stage 2 | SlimeParser | ✅ 1732 passed |
| JS Stage 3 | SlimeJavascriptParser | ✅ 1732 passed |
| TS Stage 3 | SlimeParser | ❌ 1201 passed, 1 failed |

---

## 3. 问题定位方法

### 3.1 基本定位原则

| 失败位置 | 问题所在 |
|---------|---------|
| JS Stage 1 失败 | `deprecated/SlimeJavascriptParser.ts` (基础解析器) |
| TS Stage 1 失败，JS通过 | `SlimeParser.ts` (TypeScript扩展) |
| JS Stage 2 失败 | `deprecated/SlimeJavascriptCstToAstUtil.ts` (基础CST→AST) |
| TS Stage 2 失败，JS通过 | `SlimeCstToAstUtil.ts` 或 `cstToAst/` 目录 |
| JS Stage 3 失败 | `deprecated/SlimeJavascriptGenerator.ts` (基础代码生成) |
| TS Stage 3 失败，JS通过 | `SlimeGenerator.ts` (TypeScript代码生成) |

### 3.2 组合测试定位法

当 TS Stage 3 失败时，可以通过组合不同的组件来精确定位问题：

```typescript
// 创建调试文件: packages/slime-test/src/utils/debug-test.ts
import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import { SlimeJavascriptGeneratorUtil, SlimeGeneratorUtil } from 'slime-generator';

const code = '你要测试的代码';

// 使用 TS Parser 解析
const parser = new SlimeParser(code);
const cst = parser.Program('module');

// 使用 TS CstToAst 转换
const converter = new SlimeCstToAst();
const ast = converter.toProgram(cst);

// 分别用 JS 和 TS Generator 生成代码
const jsGenerator = new SlimeJavascriptGeneratorUtil();
const jsResult = jsGenerator.generator(ast, parser.parsedTokens);
console.log('JS Generator 生成的代码:', JSON.stringify(jsResult.code));

const tsGenerator = new SlimeGeneratorUtil();
const tsResult = tsGenerator.generator(ast, parser.parsedTokens);
console.log('TS Generator 生成的代码:', JSON.stringify(tsResult.code));
```

**组合测试结果分析：**

| TS Parser + TS CstToAst + JS Generator | TS Parser + TS CstToAst + TS Generator | 问题定位 |
|----------------------------------------|----------------------------------------|---------|
| ✅ 成功 | ❌ 失败 | 问题在 `SlimeGenerator.ts` |
| ❌ 失败 | ❌ 失败 | 问题在 `SlimeCstToAst` 或 `SlimeParser` |
| ✅ 成功 | ✅ 成功 | 可能是测试框架问题，需要重新构建 |

### 3.3 重新构建命令

修改代码后必须重新构建才能生效：

```bash
# 重新构建 slime-parser
npm run build --workspace=slime-parser

# 重新构建 slime-generator
npm run build --workspace=slime-generator

# 或者构建所有包
npm run build
```

---

## 4. 常见问题排查

### 4.1 无限递归 (Maximum call stack size exceeded)

**症状:**
```
RangeError: Maximum call stack size exceeded
    at SlimeCstToAst.createPrimaryExpressionAst (...)
```

**常见原因:**

1. **方法拦截导致的循环调用**
   - deprecated 包中的方法调用 `SlimeJavascriptCstToAstUtil.xxx()`
   - 该方法被拦截后指向新实现，新实现又调用原始方法，形成循环

2. **super 调用导致的循环**
   - 在重写的方法中调用 `super.xxx()`，但 super 方法内部又调用了被拦截的方法

**解决方案:**
```typescript
// 正确做法：保存原始方法引用
const originalMethod = SlimeJavascriptCstToAstUtil.someMethod.bind(SlimeJavascriptCstToAstUtil)
;(SlimeJavascriptCstToAstUtil as any).someMethod = (cst: SubhutiCst) => {
    if (cst.name === 'TSSpecificType') {
        return handleTSType(cst)  // 处理 TypeScript 特有类型
    }
    return originalMethod(cst)  // 其他类型用原始实现
}
```

### 4.2 方法拦截不生效

**症状:**
- TypeScript 特有语法报错 "Unsupported expression type"
- 新增的处理逻辑没有被执行

**常见原因:**
1. 忘记重新构建包
2. 拦截时机问题
3. 拦截的方法名错误

**解决方案:**
```bash
# 重新构建
npm run build --workspace=slime-parser
npm run build --workspace=slime-generator
```

### 4.3 Import/Export 解析错误

**症状:**
- `import "foo"` 生成错误的 AST
- `import { a as b }` 中别名解析错误
- Token 不匹配错误

**常见原因:**
1. 函数参数顺序错误
2. CST 节点过滤错误（把 `as` 关键字当作标识符）
3. specifiers 不是数组

**解决方案:**
```typescript
// 明确查找特定节点
const moduleExportNameCst = children.find(c => c.name === 'ModuleExportName')
const importedBindingCst = children.find(c => c.name === 'ImportedBinding')

// 确保 specifiers 是数组
const specifiers = Array.isArray(node.specifiers) ? node.specifiers : []
```

### 4.4 测试框架与直接运行结果不一致

**症状:**
- 临时测试文件运行正常
- 测试框架运行失败

**常见原因:**
1. 模块加载路径不同（源文件 vs dist 文件）
2. 单例状态问题

**解决方案:**
确保重新构建包后再运行测试。

---

## 5. 调试技巧

### 5.1 打印 CST/AST 结构
```typescript
console.log('CST:', JSON.stringify(cst, null, 2))
console.log('AST:', JSON.stringify(ast, null, 2))
```

### 5.2 创建临时测试文件
```typescript
// packages/slime-test/src/utils/debug-test.ts
import { SlimeParser, SlimeCstToAst } from 'slime-parser';

const code = `你要测试的代码`;
const parser = new SlimeParser(code);
const cst = parser.Program('module');
const cstToAst = new SlimeCstToAst();
const ast = cstToAst.toProgram(cst);
console.log('AST:', JSON.stringify(ast, null, 2));
```

### 5.3 运行单个测试
```bash
npx tsx packages/slime-test/src/utils/test-ts-stage3.ts 2271
npx tsx packages/slime-test/src/utils/test-js-stage3.ts 170
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `packages/slime-parser/src/SlimeCstToAstUtil.ts` | 方法拦截和 TypeScript CST-to-AST 转换 |
| `packages/slime-parser/src/cstToAst/` | TypeScript CST-to-AST 转换模块 |
| `packages/slime-generator/src/SlimeGenerator.ts` | TypeScript 代码生成 |
| `packages/slime-parser/src/deprecated/` | JavaScript 基础实现（**不要修改！**） |
| `packages/slime-generator/src/deprecated/` | JavaScript 代码生成基础实现（**不要修改！**） |
