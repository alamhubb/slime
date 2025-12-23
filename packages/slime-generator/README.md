# slime-generator

AST 到源代码的代码生成器，支持 JavaScript 和 TypeScript。

## 安装

```bash
npm install slime-generator
```

## 使用

```typescript
import SlimeGenerator from 'slime-generator'

// 从 AST 生成代码
const code = SlimeGenerator.generate(ast)
```

## TypeScript 扩展设计原则

### 核心原则：优先采用 override 重写

当扩展 JavaScript 代码生成以支持 TypeScript 时，应该：

**✅ 正确做法：override 重写父类方法**
```typescript
// SlimeGenerator.ts
override generatorPropertyDefinition(node: any) {
    // 处理 static 关键字
    if (node.static) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, node.staticToken?.loc)
        this.addSpacing()
    }

    // 处理 key
    if (node.key) {
        if (node.computed) {
            this.addLBracket(node.lBracketToken?.loc)
            this.generatorNode(node.key)
            this.addRBracket(node.rBracketToken?.loc)
        } else {
            this.generatorNode(node.key)
        }
    }

    // [TypeScript] 处理类型注解
    if (node.typeAnnotation) {
        this.generatorTSTypeAnnotation(node.typeAnnotation)
    }

    // 处理 value
    if (node.value) {
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Eq, node.equalToken?.loc)
        this.addSpacing()
        this.generatorNode(node.value)
    }

    this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
}
```

**❌ 错误做法：创建新方法**
```typescript
// 不要这样做！
generatorTSPropertyDefinition(node: any) { ... }
```

### 为什么要用 override？

1. **代码复用**：重写方法可以复用父类的大部分逻辑，只添加 TypeScript 特有的处理

2. **统一入口**：`generatorNode` 方法会根据节点类型分发，不需要区分 JS 和 TS 版本

3. **维护简单**：修改一处即可，不需要同步维护两个方法

### 什么时候创建新方法？

只有当需要生成 TypeScript 特有的 AST 节点时，才创建新方法：

```typescript
// TypeScript 特有的节点类型
generatorTSTypeAnnotation(node: any) { ... }
generatorTSType(node: any) { ... }
generatorTSInterfaceDeclaration(node: any) { ... }
generatorTSTypeAliasDeclaration(node: any) { ... }
```

## 架构

```
SlimeGenerator (TypeScript)
    └── extends SlimeJavascriptGenerator (JavaScript)
            └── 基础代码生成逻辑
```

## 依赖

- `slime-ast` - AST 类型定义
- `slime-token` - Token 类型定义

## License

MIT
