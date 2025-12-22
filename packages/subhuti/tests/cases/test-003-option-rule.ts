/**
 * 测试 003：Option 规则
 * 测试 Parser 的可选匹配功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Export', 'export'),
    createKeywordToken('Default', 'default'),
    createKeywordToken('Function', 'function'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Export() { return this.consume('Export') }
    Default() { return this.consume('Default') }
    Function() { return this.consume('Function') }
    Identifier() { return this.consume('Identifier') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    ExportDeclaration() {
        this.tokenConsumer.Export()
        this.Option(() => this.tokenConsumer.Default())
        this.tokenConsumer.Function()
        this.tokenConsumer.Identifier()
    }
}

console.log('='.repeat(60))
console.log('测试 003：Option 规则')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 有 default
try {
    const parser = new TestParser('export default function foo')
    const cst = parser.ExportDeclaration()
    if (cst?.children?.length === 4 && cst.children[1]?.name === 'Default') {
        console.log('✅ 测试1: Option 匹配 default 成功')
        passed++
    } else {
        console.log('❌ 测试1: Option 匹配 default 失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 没有 default
try {
    const parser = new TestParser('export function bar')
    const cst = parser.ExportDeclaration()
    if (cst?.children?.length === 3 && cst.children[1]?.name === 'Function') {
        console.log('✅ 测试2: Option 跳过 default 成功')
        passed++
    } else {
        console.log('❌ 测试2: Option 跳过 default 失败, children:', cst?.children?.map(c => c.name))
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
