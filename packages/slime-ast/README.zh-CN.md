# slime-ast

Slime 解析器的 ESTree 兼容 AST 类型定义和工厂方法。

## 安装

```bash
npm install slime-ast
```

## 使用

```typescript
import { SlimeAstUtil, SlimeAstTypeName } from 'slime-ast'

// 创建 AST 节点
const identifier = SlimeAstUtil.createIdentifier('foo')
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
