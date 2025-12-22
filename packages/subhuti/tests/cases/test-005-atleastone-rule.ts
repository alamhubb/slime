/**
 * 测试 005：AtLeastOne 规则
 * 测试 Parser 的一次或多次匹配功能
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('Plus', /\+/, '+'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Number() { return this.consume('Number') }
    Plus() { return this.consume('Plus') }
}

@Subhuti
class TestParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    AddExpression() {
        this.tokenConsumer.Number()
        this.AtLeastOne(() => {
            this.tokenConsumer.Plus()
            this.tokenConsumer.Number()
        })
    }
}

console.log('='.repeat(60))
console.log('测试 005：AtLeastOne 规则')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 至少一次（1 + 2）
try {
    const parser = new TestParser('1 + 2')
    const cst = parser.AddExpression()
    if (cst?.children?.length === 3) {
        console.log('✅ 测试1: AtLeastOne 匹配 1 次成功')
        passed++
    } else {
        console.log('❌ 测试1: AtLeastOne 匹配 1 次失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 多次（1 + 2 + 3）
try {
    const parser = new TestParser('1 + 2 + 3')
    const cst = parser.AddExpression()
    if (cst?.children?.length === 5) {
        console.log('✅ 测试2: AtLeastOne 匹配多次成功')
        passed++
    } else {
        console.log('❌ 测试2: AtLeastOne 匹配多次失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 零次应该失败
try {
    const parser = new TestParser('1')  // 只有一个数字，没有 + 后续
    parser.AddExpression()
    console.log('❌ 测试3: AtLeastOne 应该要求至少一次')
    failed++
} catch (e: any) {
    console.log('✅ 测试3: AtLeastOne 正确要求至少一次')
    passed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
