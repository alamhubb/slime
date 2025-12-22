/**
 * 测试 002：Or 规则
 * 测试 Parser 的 Or 选择功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createKeywordToken('Const', 'const'),
    createKeywordToken('Var', 'var'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Const() { return this.consume('Const') }
    Var() { return this.consume('Var') }
    Identifier() { return this.consume('Identifier') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Declaration() {
        this.Or([
            { alt: () => this.tokenConsumer.Let() },
            { alt: () => this.tokenConsumer.Const() },
            { alt: () => this.tokenConsumer.Var() },
        ])
        this.tokenConsumer.Identifier()
    }
}

console.log('='.repeat(60))
console.log('测试 002：Or 规则')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 匹配第一个分支 let
try {
    const parser = new TestParser('let x')
    const cst = parser.Declaration()
    if (cst?.children?.[0]?.name === 'Let') {
        console.log('✅ 测试1: Or 匹配 let 成功')
        passed++
    } else {
        console.log('❌ 测试1: Or 匹配 let 失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 匹配第二个分支 const
try {
    const parser = new TestParser('const y')
    const cst = parser.Declaration()
    if (cst?.children?.[0]?.name === 'Const') {
        console.log('✅ 测试2: Or 匹配 const 成功')
        passed++
    } else {
        console.log('❌ 测试2: Or 匹配 const 失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 匹配第三个分支 var
try {
    const parser = new TestParser('var z')
    const cst = parser.Declaration()
    if (cst?.children?.[0]?.name === 'Var') {
        console.log('✅ 测试3: Or 匹配 var 成功')
        passed++
    } else {
        console.log('❌ 测试3: Or 匹配 var 失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
