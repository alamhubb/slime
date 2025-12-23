# slime-parser

Slime 的 CST 解析器和 CST→AST 转换器。

## 安装

```bash
npm install slime-parser
```

## 使用

```typescript
import { SlimeParser, SlimeCstToAstUtil } from 'slime-parser'

// 1. 将代码解析为 CST
const parser = new SlimeParser(code)
const cst = parser.Program()

// 2. 将 CST 转换为 AST
const ast = SlimeCstToAstUtil.toProgram(cst)
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
