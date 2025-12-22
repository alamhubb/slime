/**
 * 测试 008：Packrat 缓存
 * 测试 Parser 的 Packrat 缓存功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('Plus', /\+/, '+'),
    createValueRegToken('Minus', /-/, '-'),
    createValueRegToken('Star', /\*/, '*'),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Number() { return this.consume('Number') }
    Plus() { return this.consume('Plus') }
    Minus() { return this.consume('Minus') }
    Star() { return this.consume('Star') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Expression() {
        this.Term()
        this.Many(() => {
            this.Or([
                { alt: () => this.tokenConsumer.Plus() },
                { alt: () => this.tokenConsumer.Minus() },
            ])
            this.Term()
        })
    }

    @SubhutiRule
    Term() {
        this.Factor()
        this.Many(() => {
            this.tokenConsumer.Star()
            this.Factor()
        })
    }

    @SubhutiRule
    Factor() {
        this.Or([
            { alt: () => this.tokenConsumer.Number() },
            { alt: () => {
                this.tokenConsumer.LParen()
                this.Expression()
                this.tokenConsumer.RParen()
            }},
        ])
    }
}

console.log('='.repeat(60))
console.log('测试 008：Packrat 缓存')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 缓存启用（默认）
try {
    const parser = new TestParser('1 + 2 * 3')
    if (parser.enableMemoization === true) {
        console.log('✅ 测试1: 缓存默认启用')
        passed++
    } else {
        console.log('❌ 测试1: 缓存默认未启用')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 缓存禁用
try {
    const parser = new TestParser('1 + 2').cache(false)
    if (parser.enableMemoization === false) {
        console.log('✅ 测试2: 缓存可以禁用')
        passed++
    } else {
        console.log('❌ 测试2: 缓存禁用失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 有缓存和无缓存结果一致
try {
    const parser1 = new TestParser('1 + 2 * 3')
    const cst1 = parser1.Expression()
    
    const parser2 = new TestParser('1 + 2 * 3').cache(false)
    const cst2 = parser2.Expression()
    
    if (cst1?.children?.length === cst2?.children?.length) {
        console.log('✅ 测试3: 缓存不影响解析结果')
        passed++
    } else {
        console.log('❌ 测试3: 缓存影响了解析结果')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 复杂表达式
try {
    const parser = new TestParser('(1 + 2) * (3 + 4)')
    const cst = parser.Expression()
    if (cst?.name === 'Expression') {
        console.log('✅ 测试4: 复杂表达式解析成功')
        passed++
    } else {
        console.log('❌ 测试4: 复杂表达式解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
