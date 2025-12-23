# slime-generator

Slime 解析器的 AST 到代码生成器。将 ESTree 兼容的 AST 转换回源代码。

## 安装

```bash
npm install slime-generator
```

## 使用

```typescript
import SlimeGenerator from 'slime-generator'

const code = SlimeGenerator.generate(ast)
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
