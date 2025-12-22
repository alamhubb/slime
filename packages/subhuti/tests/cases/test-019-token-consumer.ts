/**
 * 测试 019：TokenConsumer 扩展
 * 测试自定义 TokenConsumer 的功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createKeywordToken('Async', 'async'),
    createKeywordToken('Function', 'function'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('LBrace', /\{/, '{'),
    createValueRegToken('RBrace', /\}/, '}'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

// 自定义 TokenConsumer，添加辅助方法
class CustomTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Async() { return this.consume('Async') }
    Function() { return this.consume('Function') }
    Identifier() { return this.consume('Identifier') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
    LBrace() { return this.consume('LBrace') }
    RBrace() { return this.consume('RBrace') }
}

@Subhuti
class TestParser extends SubhutiParser<CustomTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: CustomTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    FunctionDeclaration() {
        this.Option(() => this.tokenConsumer.Async())
        this.tokenConsumer.Function()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.LParen()
        this.tokenConsumer.RParen()
        this.tokenConsumer.LBrace()
        this.tokenConsumer.RBrace()
    }
}

console.log('='.repeat(60))
console.log('测试 019：TokenConsumer 扩展')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 基本 TokenConsumer 方法
try {
    const parser = new TestParser('function foo() { }')
    const cst = parser.FunctionDeclaration()
    if (cst?.children?.some(c => c.name === 'Function')) {
        console.log('✅ 测试1: 基本 TokenConsumer 方法正常')
        passed++
    } else {
        console.log('❌ 测试1: 基本 TokenConsumer 方法失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: async function
try {
    const parser = new TestParser('async function bar() { }')
    const cst = parser.FunctionDeclaration()
    if (cst?.children?.some(c => c.name === 'Async')) {
        console.log('✅ 测试2: async function 解析成功')
        passed++
    } else {
        console.log('❌ 测试2: async function 解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: TokenConsumer 实例访问
try {
    const parser = new TestParser('function test() { }')
    if (parser.tokenConsumer instanceof CustomTokenConsumer) {
        console.log('✅ 测试3: TokenConsumer 实例类型正确')
        passed++
    } else {
        console.log('❌ 测试3: TokenConsumer 实例类型错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
