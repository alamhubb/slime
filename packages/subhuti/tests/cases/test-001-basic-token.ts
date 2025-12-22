/**
 * 测试 001：基础 Token 消费
 * 测试 Parser 的基本 token 消费功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

// Token 定义
const tokens = [
    createKeywordToken('Let', 'let'),
    createKeywordToken('Const', 'const'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Equals', /=/, '='),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('Semicolon', /;/, ';'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

// TokenConsumer
class TestTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Const() { return this.consume('Const') }
    Identifier() { return this.consume('Identifier') }
    Equals() { return this.consume('Equals') }
    Number() { return this.consume('Number') }
    Semicolon() { return this.consume('Semicolon') }
}

// Parser
@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    VariableDeclaration() {
        this.tokenConsumer.Let()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Equals()
        this.tokenConsumer.Number()
        this.tokenConsumer.Semicolon()
    }
}

// 测试
console.log('='.repeat(60))
console.log('测试 001：基础 Token 消费')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 正常解析
try {
    const parser = new TestParser('let x = 42;')
    const cst = parser.VariableDeclaration()
    if (cst && cst.name === 'VariableDeclaration' && cst.children?.length === 5) {
        console.log('✅ 测试1: 正常解析 "let x = 42;" 成功')
        passed++
    } else {
        console.log('❌ 测试1: CST 结构不正确')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: token 值验证
try {
    const parser = new TestParser('let myVar = 123;')
    const cst = parser.VariableDeclaration()
    const identifierNode = cst?.children?.[1]
    const numberNode = cst?.children?.[3]
    if (identifierNode?.value === 'myVar' && numberNode?.value === '123') {
        console.log('✅ 测试2: Token 值正确提取')
        passed++
    } else {
        console.log('❌ 测试2: Token 值不正确')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 解析失败（错误的 token）
try {
    const parser = new TestParser('const x = 42;')  // 期望 let，但输入 const
    parser.VariableDeclaration()
    console.log('❌ 测试3: 应该抛出异常')
    failed++
} catch (e: any) {
    console.log('✅ 测试3: 正确检测到 token 不匹配')
    passed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
