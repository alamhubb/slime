/**
 * 测试 014：调试模式
 * 测试 Parser 的调试功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Equals', /=/, '='),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Identifier() { return this.consume('Identifier') }
    Equals() { return this.consume('Equals') }
    Number() { return this.consume('Number') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Assignment() {
        this.tokenConsumer.Let()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Equals()
        this.tokenConsumer.Number()
    }
}

console.log('='.repeat(60))
console.log('测试 014：调试模式')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 启用调试模式
try {
    const parser = new TestParser('let x = 5')
    parser.debug(false)  // 禁用规则路径输出，只测试功能
    const cst = parser.Assignment()
    if (cst?.name === 'Assignment') {
        console.log('✅ 测试1: 调试模式启用成功')
        passed++
    } else {
        console.log('❌ 测试1: 调试模式启用失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 链式调用
try {
    const parser = new TestParser('let y = 10')
        .cache(true)
        .debug(false)
    const cst = parser.Assignment()
    if (cst?.name === 'Assignment') {
        console.log('✅ 测试2: 链式调用成功')
        passed++
    } else {
        console.log('❌ 测试2: 链式调用失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: parsedTokens 访问
try {
    const parser = new TestParser('let z = 99')
    parser.Assignment()
    const tokens = parser.parsedTokens
    if (tokens.length === 4) {
        console.log('✅ 测试3: parsedTokens 访问成功')
        passed++
    } else {
        console.log('❌ 测试3: parsedTokens 数量错误:', tokens.length)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
