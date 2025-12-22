/**
 * 测试 009：Or 规则顺序
 * 测试 Or 规则的顺序敏感性（PEG 特性）
 */
import SubhutiParser, { Subhuti, SubhutiRule } from "../../src/SubhutiParser.ts"
import SubhutiTokenConsumer from "../../src/SubhutiTokenConsumer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Dot', /\./, '.'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

class TestTokenConsumer extends SubhutiTokenConsumer {
    Identifier() { return this.consume('Identifier') }
    Dot() { return this.consume('Dot') }
}

// 短规则在前（错误顺序）
@Subhuti
class ShortFirstParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    MemberAccess() {
        this.Or([
            { alt: () => this.tokenConsumer.Identifier() },  // 短规则在前
            { alt: () => {
                this.tokenConsumer.Identifier()
                this.tokenConsumer.Dot()
                this.tokenConsumer.Identifier()
            }},
        ])
    }
}

// 长规则在前（正确顺序）
@Subhuti
class LongFirstParser extends SubhutiParser<TestTokenConsumer> {
    constructor(source: string) {
        super(source, { tokenConsumer: TestTokenConsumer, tokenDefinitions: tokens })
    }

    @SubhutiRule
    MemberAccess() {
        this.Or([
            { alt: () => {
                this.tokenConsumer.Identifier()
                this.tokenConsumer.Dot()
                this.tokenConsumer.Identifier()
            }},
            { alt: () => this.tokenConsumer.Identifier() },  // 短规则在后
        ])
    }
}

console.log('='.repeat(60))
console.log('测试 009：Or 规则顺序')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 短规则在前 - 匹配短形式
try {
    const parser = new ShortFirstParser('foo')
    const cst = parser.MemberAccess()
    if (cst?.children?.length === 1) {
        console.log('✅ 测试1: 短规则在前，匹配短形式成功')
        passed++
    } else {
        console.log('❌ 测试1: 短规则在前，匹配短形式失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 短规则在前 - 长形式会失败（因为短规则先匹配）
try {
    const parser = new ShortFirstParser('foo.bar')
    parser.MemberAccess()
    // 短规则会先匹配 foo，剩余 .bar 无法处理
    console.log('❌ 测试2: 短规则在前应该导致长形式解析不完整')
    failed++
} catch (e: any) {
    console.log('✅ 测试2: 短规则在前，长形式正确失败')
    passed++
}

// 测试 3: 长规则在前 - 匹配长形式
try {
    const parser = new LongFirstParser('foo.bar')
    const cst = parser.MemberAccess()
    if (cst?.children?.length === 3) {
        console.log('✅ 测试3: 长规则在前，匹配长形式成功')
        passed++
    } else {
        console.log('❌ 测试3: 长规则在前，匹配长形式失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 长规则在前 - 也能匹配短形式（回溯）
try {
    const parser = new LongFirstParser('baz')
    const cst = parser.MemberAccess()
    if (cst?.children?.length === 1) {
        console.log('✅ 测试4: 长规则在前，回溯匹配短形式成功')
        passed++
    } else {
        console.log('❌ 测试4: 长规则在前，回溯匹配短形式失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
