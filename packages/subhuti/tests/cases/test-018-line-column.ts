/**
 * 测试 018：行列信息
 * 测试 Parser 的行列位置追踪
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
    Statement() {
        this.tokenConsumer.Let()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Equals()
        this.tokenConsumer.Number()
        this.tokenConsumer.Semicolon()
    }
}

console.log('='.repeat(60))
console.log('测试 018：行列信息')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 单行位置
try {
    const parser = new TestParser('let x = 5;')
    parser.Statement()
    const tokens = parser.parsedTokens
    
    if (tokens[0].rowNum === 1 && tokens[0].columnStartNum === 1) {
        console.log('✅ 测试1: 单行位置正确')
        passed++
    } else {
        console.log('❌ 测试1: 单行位置错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 多行位置
try {
    const parser = new TestParser('let\nx\n=\n5\n;')
    parser.Statement()
    const tokens = parser.parsedTokens
    
    // 每个 token 应该在不同行
    const lines = tokens.map(t => t.rowNum)
    if (lines[0] === 1 && lines[1] === 2 && lines[2] === 3) {
        console.log('✅ 测试2: 多行位置正确')
        passed++
    } else {
        console.log('❌ 测试2: 多行位置错误:', lines)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 列位置
try {
    const parser = new TestParser('let abc = 123;')
    parser.Statement()
    const tokens = parser.parsedTokens
    
    // let 从第 1 列开始，abc 从第 5 列开始
    if (tokens[0].columnStartNum === 1 && tokens[1].columnStartNum === 5) {
        console.log('✅ 测试3: 列位置正确')
        passed++
    } else {
        console.log('❌ 测试3: 列位置错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: index 位置
try {
    const parser = new TestParser('let x = 5;')
    parser.Statement()
    const tokens = parser.parsedTokens
    
    // let 从 index 0 开始
    if (tokens[0].index === 0 && tokens[1].index === 4) {
        console.log('✅ 测试4: index 位置正确')
        passed++
    } else {
        console.log('❌ 测试4: index 位置错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
