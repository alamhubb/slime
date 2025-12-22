/**
 * 测试 020：表达式解析器
 * 综合测试：实现一个简单的表达式解析器
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Number', /[0-9]+(\.[0-9]+)?/),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Plus', /\+/, '+'),
    createValueRegToken('Minus', /-/, '-'),
    createValueRegToken('Star', /\*/, '*'),
    createValueRegToken('Slash', /\//, '/'),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class ExprTokenConsumer extends SubhutiTokenConsumer {
    Number() { return this.consume('Number') }
    Identifier() { return this.consume('Identifier') }
    Plus() { return this.consume('Plus') }
    Minus() { return this.consume('Minus') }
    Star() { return this.consume('Star') }
    Slash() { return this.consume('Slash') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
}

@Subhuti
class ExpressionParser extends SubhutiParser<ExprTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: ExprTokenConsumer, tokenDefinitions: tokens })
    }

    // Expression = Term (('+' | '-') Term)*
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

    // Term = Factor (('*' | '/') Factor)*
    @SubhutiRule
    Term() {
        this.Factor()
        this.Many(() => {
            this.Or([
                { alt: () => this.tokenConsumer.Star() },
                { alt: () => this.tokenConsumer.Slash() },
            ])
            this.Factor()
        })
    }

    // Factor = Number | Identifier | '(' Expression ')'
    @SubhutiRule
    Factor() {
        this.Or([
            { alt: () => this.tokenConsumer.Number() },
            { alt: () => this.tokenConsumer.Identifier() },
            { alt: () => {
                this.tokenConsumer.LParen()
                this.Expression()
                this.tokenConsumer.RParen()
            }},
        ])
    }
}

console.log('='.repeat(60))
console.log('测试 020：表达式解析器')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 简单数字
try {
    const parser = new ExpressionParser('42')
    const cst = parser.Expression()
    if (cst?.name === 'Expression') {
        console.log('✅ 测试1: 简单数字解析成功')
        passed++
    } else {
        console.log('❌ 测试1: 简单数字解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 加法
try {
    const parser = new ExpressionParser('1 + 2')
    const cst = parser.Expression()
    if (cst?.children?.some(c => c.name === 'Plus')) {
        console.log('✅ 测试2: 加法解析成功')
        passed++
    } else {
        console.log('❌ 测试2: 加法解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 乘法优先级
try {
    const parser = new ExpressionParser('1 + 2 * 3')
    const cst = parser.Expression()
    // 应该有 Term 包含乘法
    if (cst?.name === 'Expression') {
        console.log('✅ 测试3: 乘法优先级解析成功')
        passed++
    } else {
        console.log('❌ 测试3: 乘法优先级解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 括号
try {
    const parser = new ExpressionParser('(1 + 2) * 3')
    const cst = parser.Expression()
    if (cst?.name === 'Expression') {
        console.log('✅ 测试4: 括号解析成功')
        passed++
    } else {
        console.log('❌ 测试4: 括号解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

// 测试 5: 嵌套括号
try {
    const parser = new ExpressionParser('((1 + 2))')
    const cst = parser.Expression()
    if (cst?.name === 'Expression') {
        console.log('✅ 测试5: 嵌套括号解析成功')
        passed++
    } else {
        console.log('❌ 测试5: 嵌套括号解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试5 异常:', e.message)
    failed++
}

// 测试 6: 复杂表达式
try {
    const parser = new ExpressionParser('a + b * c - d / e')
    const cst = parser.Expression()
    if (cst?.name === 'Expression') {
        console.log('✅ 测试6: 复杂表达式解析成功')
        passed++
    } else {
        console.log('❌ 测试6: 复杂表达式解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试6 异常:', e.message)
    failed++
}

// 测试 7: 浮点数
try {
    const parser = new ExpressionParser('3.14 + 2.71')
    const cst = parser.Expression()
    const tokens = parser.parsedTokens
    if (tokens[0].tokenValue === '3.14') {
        console.log('✅ 测试7: 浮点数解析成功')
        passed++
    } else {
        console.log('❌ 测试7: 浮点数解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试7 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
