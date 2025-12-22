/**
 * 测试 015：复杂语法
 * 测试 Parser 处理复杂语法的能力
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Function', 'function'),
    createKeywordToken('Return', 'return'),
    createKeywordToken('If', 'if'),
    createKeywordToken('Else', 'else'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('LParen', /\(/, '('),
    createValueRegToken('RParen', /\)/, ')'),
    createValueRegToken('LBrace', /\{/, '{'),
    createValueRegToken('RBrace', /\}/, '}'),
    createValueRegToken('Comma', /,/, ','),
    createValueRegToken('Semicolon', /;/, ';'),
    createValueRegToken('Plus', /\+/, '+'),
    createValueRegToken('Minus', /-/, '-'),
    createValueRegToken('Star', /\*/, '*'),
    createValueRegToken('Lt', /</, '<'),
    createValueRegToken('Gt', />/, '>'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Function() { return this.consume('Function') }
    Return() { return this.consume('Return') }
    If() { return this.consume('If') }
    Else() { return this.consume('Else') }
    Identifier() { return this.consume('Identifier') }
    Number() { return this.consume('Number') }
    LParen() { return this.consume('LParen') }
    RParen() { return this.consume('RParen') }
    LBrace() { return this.consume('LBrace') }
    RBrace() { return this.consume('RBrace') }
    Comma() { return this.consume('Comma') }
    Semicolon() { return this.consume('Semicolon') }
    Plus() { return this.consume('Plus') }
    Minus() { return this.consume('Minus') }
    Star() { return this.consume('Star') }
    Lt() { return this.consume('Lt') }
    Gt() { return this.consume('Gt') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    Program() {
        this.AtLeastOne(() => this.FunctionDeclaration())
    }

    @SubhutiRule
    FunctionDeclaration() {
        this.tokenConsumer.Function()
        this.tokenConsumer.Identifier()
        this.ParameterList()
        this.Block()
    }

    @SubhutiRule
    ParameterList() {
        this.tokenConsumer.LParen()
        this.Option(() => {
            this.tokenConsumer.Identifier()
            this.Many(() => {
                this.tokenConsumer.Comma()
                this.tokenConsumer.Identifier()
            })
        })
        this.tokenConsumer.RParen()
    }

    @SubhutiRule
    Block() {
        this.tokenConsumer.LBrace()
        this.Many(() => this.Statement())
        this.tokenConsumer.RBrace()
    }

    @SubhutiRule
    Statement() {
        this.Or([
            { alt: () => this.ReturnStatement() },
            { alt: () => this.IfStatement() },
        ])
    }

    @SubhutiRule
    ReturnStatement() {
        this.tokenConsumer.Return()
        this.Expression()
        this.tokenConsumer.Semicolon()
    }

    @SubhutiRule
    IfStatement() {
        this.tokenConsumer.If()
        this.tokenConsumer.LParen()
        this.Expression()
        this.tokenConsumer.RParen()
        this.Block()
        this.Option(() => {
            this.tokenConsumer.Else()
            this.Block()
        })
    }

    @SubhutiRule
    Expression() {
        this.Or([
            { alt: () => this.tokenConsumer.Number() },
            { alt: () => this.tokenConsumer.Identifier() },
        ])
    }
}

console.log('='.repeat(60))
console.log('测试 015：复杂语法')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 简单函数
try {
    const parser = new TestParser('function foo() { return 1; }')
    const cst = parser.Program()
    if (cst?.children?.some(c => c.name === 'FunctionDeclaration')) {
        console.log('✅ 测试1: 简单函数解析成功')
        passed++
    } else {
        console.log('❌ 测试1: 简单函数解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 带参数的函数
try {
    const parser = new TestParser('function add(a, b) { return a; }')
    const cst = parser.Program()
    if (cst?.name === 'Program') {
        console.log('✅ 测试2: 带参数函数解析成功')
        passed++
    } else {
        console.log('❌ 测试2: 带参数函数解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 带 if 语句的函数
try {
    const parser = new TestParser('function test(x) { if (x) { return 1; } }')
    const cst = parser.Program()
    if (cst?.name === 'Program') {
        console.log('✅ 测试3: 带 if 语句函数解析成功')
        passed++
    } else {
        console.log('❌ 测试3: 带 if 语句函数解析失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 多个函数
try {
    const parser = new TestParser('function a() { return 1; } function b() { return 2; }')
    const cst = parser.Program()
    const funcCount = cst?.children?.filter(c => c.name === 'FunctionDeclaration').length
    if (funcCount === 2) {
        console.log('✅ 测试4: 多个函数解析成功')
        passed++
    } else {
        console.log('❌ 测试4: 多个函数解析失败, count:', funcCount)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
