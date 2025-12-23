import SlimeParser from './packages/slime-parser/src/SlimeParser.ts'
import SlimeCstToAstUtil from './packages/slime-parser/src/SlimeCstToAstUtil.ts'
import SlimeGenerator from './packages/slime-generator/src/SlimeGenerator.ts'

const code = `enum Status {
    Pending = 1,
    Active = 2
}
`

console.log('=== 调试 enum 解析 ===')

// Step 1: Parse to CST
const parser = new SlimeParser(code)
const cst = parser.Program('module')
const tokens = parser.parsedTokens

console.log('CST:')
console.log(JSON.stringify(cst, null, 2))
