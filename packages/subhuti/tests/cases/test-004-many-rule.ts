/**
 * 测试 004：Many 规则
 * 测试 Parser 的零次或多次匹配功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Comma', /,/, ','),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Identifier() { return this.consume('Identifier') }
    Comma() { return this.consume('Comma') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    IdentifierList() {
        this.tokenConsumer.Identifier()
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.tokenConsumer.Identifier()
        })
    }
}

console.log('='.repeat(60))
console.log('测试 004：Many 规则')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 单个标识符（Many 匹配 0 次）
try {
    const parser = new TestParser('a')
    const cst = parser.IdentifierList()
    if (cst?.children?.length === 1) {
        console.log('✅ 测试1: Many 匹配 0 次成功')
        passed++
    } else {
        console.log('❌ 测试1: Many 匹配 0 次失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 两个标识符（Many 匹配 1 次）
try {
    const parser = new TestParser('a, b')
    const cst = parser.IdentifierList()
    if (cst?.children?.length === 3) {  // Identifier, Comma, Identifier
        console.log('✅ 测试2: Many 匹配 1 次成功')
        passed++
    } else {
        console.log('❌ 测试2: Many 匹配 1 次失败, children:', cst?.children?.length)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 多个标识符（Many 匹配多次）
try {
    const parser = new TestParser('a, b, c, d')
    const cst = parser.IdentifierList()
    if (cst?.children?.length === 7) {  // a , b , c , d
        console.log('✅ 测试3: Many 匹配多次成功')
        passed++
    } else {
        console.log('❌ 测试3: Many 匹配多次失败, children:', cst?.children?.length)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
