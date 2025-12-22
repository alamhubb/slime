/**
 * 测试 013：错误处理
 * 测试 Parser 的错误处理机制
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Equals', /=/, '='),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('Semicolon', /;/, ';'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Identifier() { return this.consume('Identifier') }
    Equals() { return this.consume('Equals') }
    Number() { return this.consume('Number') }
    Semicolon() { return this.consume('Semicolon') }
}

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

console.log('='.repeat(60))
console.log('测试 013：错误处理')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 缺少 token
try {
    const parser = new TestParser('let x =')  // 缺少数字和分号
    parser.VariableDeclaration()
    console.log('❌ 测试1: 应该抛出异常')
    failed++
} catch (e: any) {
    if (e.message) {
        console.log('✅ 测试1: 缺少 token 正确抛出异常')
        passed++
    } else {
        console.log('❌ 测试1: 异常信息缺失')
        failed++
    }
}

// 测试 2: 错误的 token
try {
    const parser = new TestParser('let 123 = 5;')  // 标识符位置是数字
    parser.VariableDeclaration()
    console.log('❌ 测试2: 应该抛出异常')
    failed++
} catch (e: any) {
    console.log('✅ 测试2: 错误 token 正确抛出异常')
    passed++
}

// 测试 3: 空输入
try {
    const parser = new TestParser('')
    parser.VariableDeclaration()
    console.log('❌ 测试3: 空输入应该抛出异常')
    failed++
} catch (e: any) {
    console.log('✅ 测试3: 空输入正确抛出异常')
    passed++
}

// 测试 4: 未识别的字符
try {
    const parser = new TestParser('let x = @;')  // @ 是未识别字符
    parser.VariableDeclaration()
    console.log('❌ 测试4: 未识别字符应该抛出异常')
    failed++
} catch (e: any) {
    console.log('✅ 测试4: 未识别字符正确抛出异常')
    passed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
