# 问题修复指南

本文档记录了常见问题的排查和修复方法，遇到类似问题时可先查阅本指南。

## 目录

1. [无限递归 (Maximum call stack size exceeded)](#1-无限递归-maximum-call-stack-size-exceeded)
2. [方法拦截不生效](#2-方法拦截不生效)
3. [Import/Export 解析错误](#3-importexport-解析错误)
4. [测试框架与直接运行结果不一致](#4-测试框架与直接运行结果不一致)

---

## 1. 无限递归 (Maximum call stack size exceeded)

### 症状
```
RangeError: Maximum call stack size exceeded
    at SlimeCstToAst.createPrimaryExpressionAst (...)
    at SlimeCstToAst.createPrimaryExpressionAst (...)
```

### 常见原因

#### 1.1 方法拦截导致的循环调用

**问题**: deprecated 包中的方法内部调用 `SlimeCstToAstUtil.xxx()`，而 `SlimeCstToAstUtil` 的方法被拦截后指向新实现，新实现又调用原始方法，形成循环。

**调用链示例**:
```
SlimeCstToAstUtil.createExpressionAst 
  → this.createExpressionAstUncached (被拦截)
  → 我们的 createExpressionAstUncached
  → SlimeJavascriptExpressionCstToAst.createExpressionAstUncached
  → SlimeCstToAstUtil.createPrimaryExpressionAst
  → ... → SlimeCstToAstUtil.createExpressionAst (回到起点)
```

**解决方案**: 
1. 保存原始方法引用
2. 只处理 TypeScript 特有类型，其他类型调用原始实现

```typescript
// 正确做法：保存原始方法引用
const originalMethod = SlimeCstToAstUtil.someMethod.bind(SlimeCstToAstUtil)
;(SlimeCstToAstUtil as any).someMethod = (cst: SubhutiCst) => {
    if (cst.name === 'TSSpecificType') {
        return handleTSType(cst)  // 处理 TypeScript 特有类型
    }
    return originalMethod(cst)  // 其他类型用原始实现
}
```

#### 1.2 super 调用导致的循环

**问题**: 在重写的方法中调用 `super.xxx()`，但 super 方法内部又调用了被拦截的方法。

**解决方案**: 直接调用原始的静态方法，而不是通过 super。

```typescript
// 错误做法
override createExpressionAstUncached(cst: SubhutiCst): any {
    return super.createExpressionAstUncached(cst)  // 可能导致循环
}

// 正确做法
override createExpressionAstUncached(cst: SubhutiCst): any {
    return SlimeJavascriptExpressionCstToAst.createExpressionAstUncached(cst)
}
```

---

## 2. 方法拦截不生效

### 症状
- TypeScript 特有语法（如 `TSTypeAssertion`）报错 "Unsupported expression type"
- 新增的处理逻辑没有被执行

### 常见原因

#### 2.1 忘记重新构建包

**问题**: 修改了源代码但没有重新构建，测试框架使用的是旧的 dist 文件。

**解决方案**:
```bash
# 重新构建 slime-parser
npm run build --prefix packages/slime-parser

# 重新构建 slime-generator
npm run build --prefix packages/slime-generator
```

#### 2.2 拦截时机问题

**问题**: 方法拦截在 `SlimeCstToAst` 构造函数中执行，但测试框架可能在拦截之前就加载了模块。

**解决方案**: 确保 `_intercepted` 静态标志正确工作，且在任何 CST-to-AST 转换之前创建 `SlimeCstToAst` 实例。

#### 2.3 拦截的方法名错误

**问题**: 拦截的方法名与实际调用的方法名不一致。

**排查方法**: 在拦截的方法中添加 `console.log` 确认是否被调用。

---

## 3. Import/Export 解析错误

### 症状
- `import "foo"` 生成错误的 AST
- `import { a as b }` 中别名解析错误
- Token 不匹配错误

### 常见原因

#### 3.1 函数参数顺序错误

**问题**: 调用 `createImportDeclaration` 等工厂函数时参数顺序错误。

**正确的参数顺序**:
```typescript
SlimeJavascriptCreateUtils.createImportDeclaration(
    specifiers,    // 第1个: specifiers 数组
    source,        // 第2个: source 字符串字面量
    loc,           // 第3个: 位置信息
    importToken,   // 第4个: import token
    fromToken      // 第5个: from token
)
```

#### 3.2 CST 节点过滤错误

**问题**: 在处理 `import { a as b }` 时，把 `as` 关键字也当作标识符处理。

**CST 结构**:
```
ImportSpecifier
  ├── ModuleExportName (包含 "a")
  ├── IdentifierName (值为 "as" - 这是关键字!)
  └── ImportedBinding (包含 "b")
```

**解决方案**: 明确查找 `ModuleExportName` 和 `ImportedBinding`，而不是泛泛地过滤 `IdentifierName`。

```typescript
// 错误做法
const identifiers = children.filter(c => 
    c.name === 'IdentifierName' || c.name === 'ImportedBinding'
)

// 正确做法
const moduleExportNameCst = children.find(c => c.name === 'ModuleExportName')
const importedBindingCst = children.find(c => c.name === 'ImportedBinding')
```

#### 3.3 specifiers 不是数组

**问题**: 对于 side-effect import（`import "foo"`），`specifiers` 可能是 `undefined`。

**解决方案**:
```typescript
const specifiers = Array.isArray(node.specifiers) ? node.specifiers : []
```

---

## 4. 测试框架与直接运行结果不一致

### 症状
- 临时测试文件（如 `temp-test.ts`）运行正常
- 测试框架（`test-stage4.ts`）运行失败

### 常见原因

#### 4.1 模块加载路径不同

**问题**: 
- 临时测试文件直接从源文件导入: `from '../../slime-parser/src/...'`
- 测试框架从包导入: `from "slime-parser"`（使用 dist 文件）

**解决方案**: 确保重新构建包后再运行测试。

#### 4.2 单例状态问题

**问题**: `_intercepted` 静态标志在不同的模块加载中可能有不同的状态。

**排查方法**: 
1. 在 `_setupMethodInterception()` 中添加日志
2. 确认拦截只执行一次

---

## 调试技巧

### 1. 打印 CST 结构
```typescript
console.log('CST:', JSON.stringify(cst, null, 2))
```

### 2. 打印 AST 结构
```typescript
console.log('AST:', JSON.stringify(ast, null, 2))
```

### 3. 创建临时测试文件
```typescript
// packages/slime-test/src/temp-test.ts
import { SlimeCstToAst } from '../../slime-parser/src/SlimeCstToAstUtil.ts';
import SlimeParser from '../../slime-parser/src/SlimeParser.ts';

const code = `你要测试的代码`;
const parser = new SlimeParser(code);
const cst = parser.Program('module');
const cstToAst = new SlimeCstToAst();
const ast = cstToAst.toProgram(cst);
console.log('AST:', JSON.stringify(ast, null, 2));
```

### 4. 运行单个测试
```bash
# TypeScript 测试
npx tsx packages/slime-test/src/utils/test-stage4.ts 8

# JavaScript 测试
npx tsx packages/slime-test/src/utils/test-stage3.ts 170
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `packages/slime-parser/src/SlimeCstToAstUtil.ts` | 方法拦截和 TypeScript CST-to-AST 转换 |
| `packages/slime-parser/src/cstToAst/module/SlimeModuleCstToAst.ts` | 模块相关的 CST-to-AST 转换 |
| `packages/slime-generator/src/SlimeGenerator.ts` | TypeScript 代码生成 |
| `packages/slime-parser/src/deprecated/` | JavaScript 基础实现（不要修改！） |
