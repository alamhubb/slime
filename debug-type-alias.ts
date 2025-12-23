import SlimeParser from './packages/slime-parser/src/SlimeParser.ts'
import SlimeCstToAstUtil from './packages/slime-parser/src/SlimeCstToAstUtil.ts'
import SlimeGenerator from './packages/slime-generator/src/SlimeGenerator.ts'

const code = `// Phase 4: 类型别名声明
// 测试 type Name = Type 语法

// 12.1 基础类型别名
type ID = number
type Name = string
type Flag = boolean

// 12.2 联合类型别名
type StringOrNumber = string | number
`

console.log('=== 调试 type alias 解析 ===')
console.log('源码:', JSON.stringify(code))

// Step 1: Parse to CST
console.log('\n=== Step 1: Parse to CST ===')
const parser = new SlimeParser(code)
const cst = parser.Program('module')
const tokens = parser.parsedTokens
console.log('CST 解析成功, tokens:', tokens.length)

// Step 2: CST to AST
console.log('\n=== Step 2: CST to AST ===')
const ast = SlimeCstToAstUtil.toProgram(cst)
console.log('AST 转换成功')
console.log('AST body length:', ast.body.length)
for (let i = 0; i < ast.body.length; i++) {
    console.log(`  [${i}] ${ast.body[i].type}`)
}

// Step 3: AST to Code
console.log('\n=== Step 3: AST to Code ===')
const result = SlimeGenerator.generator(ast, tokens)
console.log('生成的代码:')
console.log(result.code)

// Step 4: Re-parse generated code
console.log('\n=== Step 4: Re-parse generated code ===')
const parser2 = new SlimeParser(result.code)
try {
    const cst2 = parser2.Program('module')
    const tokens2 = parser2.parsedTokens
    console.log('重新解析成功, tokens:', tokens2.length)
} catch (e: any) {
    console.log('重新解析失败:', e.message)
}
