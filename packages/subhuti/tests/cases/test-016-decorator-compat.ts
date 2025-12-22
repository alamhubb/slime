/**
 * 测试 016：装饰器兼容性
 * 测试装饰器在不同模式下的兼容性
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Identifier() { return this.consume('Identifier') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    SingleIdentifier() {
        this.tokenConsumer.Identifier()
    }

    @SubhutiRule
    TwoIdentifiers() {
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Identifier()
    }

    @SubhutiRule
    ThreeIdentifiers() {
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Identifier()
        this.tokenConsumer.Identifier()
    }
}

console.log('='.repeat(60))
console.log('测试 016：装饰器兼容性')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: @Subhuti 类装饰器
try {
    const parser = new TestParser('foo')
    if (parser instanceof SubhutiParser) {
        console.log('✅ 测试1: @Subhuti 类装饰器正常工作')
        passed++
    } else {
        console.log('❌ 测试1: @Subhuti 类装饰器失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: @SubhutiRule 方法装饰器 - 单个规则
try {
    const parser = new TestParser('hello')
    const cst = parser.SingleIdentifier()
    if (cst?.name === 'SingleIdentifier' && cst.children?.[0]?.value === 'hello') {
        console.log('✅ 测试2: @SubhutiRule 单个规则正常工作')
        passed++
    } else {
        console.log('❌ 测试2: @SubhutiRule 单个规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: @SubhutiRule 方法装饰器 - 多个规则
try {
    const parser = new TestParser('a b')
    const cst = parser.TwoIdentifiers()
    if (cst?.name === 'TwoIdentifiers' && cst.children?.length === 2) {
        console.log('✅ 测试3: @SubhutiRule 多个规则正常工作')
        passed++
    } else {
        console.log('❌ 测试3: @SubhutiRule 多个规则失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 规则名称保持
try {
    const parser = new TestParser('x y z')
    const cst = parser.ThreeIdentifiers()
    if (cst?.name === 'ThreeIdentifiers') {
        console.log('✅ 测试4: 规则名称正确保持')
        passed++
    } else {
        console.log('❌ 测试4: 规则名称丢失:', cst?.name)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

// 测试 5: 多次实例化
try {
    const parser1 = new TestParser('aaa')
    const parser2 = new TestParser('bbb')
    const cst1 = parser1.SingleIdentifier()
    const cst2 = parser2.SingleIdentifier()
    if (cst1?.children?.[0]?.value === 'aaa' && cst2?.children?.[0]?.value === 'bbb') {
        console.log('✅ 测试5: 多次实例化正常工作')
        passed++
    } else {
        console.log('❌ 测试5: 多次实例化失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试5 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
