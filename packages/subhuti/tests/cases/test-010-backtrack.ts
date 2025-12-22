/**
 * 测试 010：回溯机制
 * 测试 Parser 的回溯功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('If', 'if'),
    createKeywordToken('Else', 'else'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('LBrace', /\{/, '{'),
    createValueRegToken('RBrace', /\}/, '}'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    If() { return this.consume('If') }
    Else() { return this.consume('Else') }
    Identifier() { return this.consume('Identifier') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
    LBrace() { return this.consume('LBrace') }
    RBrace() { return this.consume('RBrace') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    IfStatement() {
        this.tokenConsumer.If()
        this.tokenConsumer.LParen()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.RParen()
        this.Block()
        this.Option(() => {
            this.tokenConsumer.Else()
            this.Block()
        })
    }

    @SubhutiRule
    Block() {
        this.tokenConsumer.LBrace()
        this.Option(() => this.tokenConsumer.Identifier())
        this.tokenConsumer.RBrace()
    }
}

console.log('='.repeat(60))
console.log('测试 010：回溯机制')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: if 语句无 else
try {
    const parser = new TestParser('if (x) { y }')
    const cst = parser.IfStatement()
    const hasElse = cst?.children?.some(c => c.name === 'Else')
    if (!hasElse) {
        console.log('✅ 测试1: if 无 else 解析成功')
        passed++
    } else {
        console.log('❌ 测试1: if 无 else 解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: if-else 语句
try {
    const parser = new TestParser('if (a) { b } else { c }')
    const cst = parser.IfStatement()
    const hasElse = cst?.children?.some(c => c.name === 'Else')
    if (hasElse) {
        console.log('✅ 测试2: if-else 解析成功')
        passed++
    } else {
        console.log('❌ 测试2: if-else 解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 空 block
try {
    const parser = new TestParser('if (x) { }')
    const cst = parser.IfStatement()
    if (cst?.name === 'IfStatement') {
        console.log('✅ 测试3: 空 block 解析成功')
        passed++
    } else {
        console.log('❌ 测试3: 空 block 解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
