# 代码修改规则

## deprecated 包规则

**重要：不要修改 `packages/slime-parser/src/deprecated/` 目录下的任何文件！**

deprecated 包包含 JavaScript ES2025 的基础实现，是稳定的基础代码。

### 如何扩展功能（如添加 TypeScript 支持）

1. **重写方法**：在 `SlimeCstToAstUtil.ts` 中重写需要修改的方法
2. **方法拦截**：在 `_setupMethodInterception()` 中添加方法拦截
3. **新建文件**：在 `cstToAst/` 目录下创建对应的实现文件

### 文件对应关系

| deprecated 文件 | 扩展文件 |
|----------------|---------|
| `SlimeCstToAstUtil.ts` | `SlimeCstToAstUtil.ts` |
| `slimeJavascriptCstToAst/expressions/` | `cstToAst/` 目录下对应文件 |

### 示例：添加 TypeScript 表达式支持

```typescript
// 在 SlimeCstToAstUtil.ts 的 _setupMethodInterception() 中添加：
; (SlimeJavascriptCstToAstUtil as any).createExpressionAstUncached = 
    this.createExpressionAstUncached.bind(this)

// 然后重写 createExpressionAstUncached 方法
```

## Parser 规则

- JavaScript 基础语法：在 `SlimeJavascriptParser.ts` 中实现
- TypeScript 扩展语法：在 `SlimeParser.ts` 中通过 override 或新增规则实现

## Generator 规则

- 所有代码生成逻辑在 `SlimeGenerator.ts` 中实现
- TypeScript 节点类型需要添加对应的 generator 方法
