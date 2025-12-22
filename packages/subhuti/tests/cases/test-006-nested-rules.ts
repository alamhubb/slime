/**
 * 测试 006：嵌套规则
 * 测试 Parser 的规则嵌套调用
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Function', 'function'),
    createKeywordToken('Return', 'return'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('LBrace', /\{/, '{'),
    createValueRegToken('RBrace', /\}/, '}'),
    createValueRegToken('Semicolon', /;/, ';'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Function() { return this.consume('Function') }
    Return() { return this.consume('Return') }
    Identifier() { return this.consume('Identifier') }
    Number() { return this.consume('Number') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
    LBrace() { return this.consume('LBrace') }
    RBrace() { return this.consume('RBrace') }
    Semicolon() { return this.consume('Semicolon') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    FunctionDeclaration() {
        this.tokenConsumer.Function()
        this.tokenConsumer.Identifier()
        this.ParameterList()
        this.FunctionBody()
    }

    @SubhutiRule
    ParameterList() {
        this.tokenConsumer.LParen()
        this.tokenConsumer.RParen()
    }

    @SubhutiRule
    FunctionBody() {
        this.tokenConsumer.LBrace()
        this.ReturnStatement()
        this.tokenConsumer.RBrace()
    }

    @SubhutiRule
    ReturnStatement() {
        this.tokenConsumer.Return()
        this.tokenConsumer.Number()
        this.tokenConsumer.Semicolon()
    }
}

console.log('='.repeat(60))
console.log('测试 006：嵌套规则')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 完整函数解析
try {
    const parser = new TestParser('function foo() { return 42; }')
    const cst = parser.FunctionDeclaration()
    
    if (cst?.name === 'FunctionDeclaration' && 
        cst.children?.some(c => c.name === 'ParameterList') &&
        cst.children?.some(c => c.name === 'FunctionBody')) {
        console.log('✅ 测试1: 嵌套规则解析成功')
        passed++
    } else {
        console.log('❌ 测试1: 嵌套规则解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 验证深层嵌套
try {
    const parser = new TestParser('function bar() { return 100; }')
    const cst = parser.FunctionDeclaration()
    
    const body = cst?.children?.find(c => c.name === 'FunctionBody')
    const returnStmt = body?.children?.find(c => c.name === 'ReturnStatement')
    const numberNode = returnStmt?.children?.find(c => c.name === 'Number')
    
    if (numberNode?.value === '100') {
        console.log('✅ 测试2: 深层嵌套值提取成功')
        passed++
    } else {
        console.log('❌ 测试2: 深层嵌套值提取失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
