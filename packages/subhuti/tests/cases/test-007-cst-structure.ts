/**
 * 测试 007：CST 结构
 * 测试 CST 节点的结构和位置信息
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
console.log('测试 007：CST 结构')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: CST 节点名称
try {
    const parser = new TestParser('let x = 5')
    const cst = parser.Assignment()
    
    if (cst?.name === 'Assignment') {
        console.log('✅ 测试1: CST 根节点名称正确')
        passed++
    } else {
        console.log('❌ 测试1: CST 根节点名称错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: CST children 结构
try {
    const parser = new TestParser('let y = 10')
    const cst = parser.Assignment()
    const names = cst?.children?.map(c => c.name)
    
    if (JSON.stringify(names) === JSON.stringify(['Let', 'Identifier', 'Equals', 'Number'])) {
        console.log('✅ 测试2: CST children 结构正确')
        passed++
    } else {
        console.log('❌ 测试2: CST children 结构错误:', names)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: CST 位置信息
try {
    const parser = new TestParser('let z = 99')
    const cst = parser.Assignment()
    const letNode = cst?.children?.[0]
    
    if (letNode?.loc && letNode.loc.start && letNode.loc.end) {
        console.log('✅ 测试3: CST 位置信息存在')
        passed++
    } else {
        console.log('❌ 测试3: CST 位置信息缺失')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: Token 值
try {
    const parser = new TestParser('let abc = 123')
    const cst = parser.Assignment()
    const idNode = cst?.children?.[1]
    const numNode = cst?.children?.[3]
    
    if (idNode?.value === 'abc' && numNode?.value === '123') {
        console.log('✅ 测试4: Token 值正确')
        passed++
    } else {
        console.log('❌ 测试4: Token 值错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
