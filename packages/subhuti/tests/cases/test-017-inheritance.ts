/**
 * 测试 017：Parser 继承
 * 测试 Parser 类的继承机制
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createKeywordToken('Const', 'const'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Equals', /=/, '='),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Let() { return this.consume('Let') }
    Const() { return this.consume('Const') }
    Identifier() { return this.consume('Identifier') }
    Equals() { return this.consume('Equals') }
    Number() { return this.consume('Number') }
}

// 基类 Parser
@Subhuti
class BaseParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    LetDeclaration() {
        this.tokenConsumer.Let()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Equals()
        this.tokenConsumer.Number()
    }
}

// 扩展 Parser
@Subhuti
class ExtendedParser extends BaseParser {
    @SubhutiRule
    ConstDeclaration() {
        this.tokenConsumer.Const()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Equals()
        this.tokenConsumer.Number()
    }

    @SubhutiRule
    Declaration() {
        this.Or([
            { alt: () => this.LetDeclaration() },
            { alt: () => this.ConstDeclaration() },
        ])
    }
}

console.log('='.repeat(60))
console.log('测试 017：Parser 继承')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 基类规则
try {
    const parser = new BaseParser('let x = 1')
    const cst = parser.LetDeclaration()
    if (cst?.name === 'LetDeclaration') {
        console.log('✅ 测试1: 基类规则正常工作')
        passed++
    } else {
        console.log('❌ 测试1: 基类规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 子类继承基类规则
try {
    const parser = new ExtendedParser('let y = 2')
    const cst = parser.LetDeclaration()
    if (cst?.name === 'LetDeclaration') {
        console.log('✅ 测试2: 子类继承基类规则成功')
        passed++
    } else {
        console.log('❌ 测试2: 子类继承基类规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 子类新增规则
try {
    const parser = new ExtendedParser('const z = 3')
    const cst = parser.ConstDeclaration()
    if (cst?.name === 'ConstDeclaration') {
        console.log('✅ 测试3: 子类新增规则成功')
        passed++
    } else {
        console.log('❌ 测试3: 子类新增规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 子类组合规则
try {
    const parser1 = new ExtendedParser('let a = 1')
    const cst1 = parser1.Declaration()
    
    const parser2 = new ExtendedParser('const b = 2')
    const cst2 = parser2.Declaration()
    
    if (cst1?.children?.some(c => c.name === 'LetDeclaration') &&
        cst2?.children?.some(c => c.name === 'ConstDeclaration')) {
        console.log('✅ 测试4: 子类组合规则成功')
        passed++
    } else {
        console.log('❌ 测试4: 子类组合规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
