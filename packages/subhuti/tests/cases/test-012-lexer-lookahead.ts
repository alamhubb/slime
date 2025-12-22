/**
 * 测试 012：词法分析器前瞻
 * 测试 SubhutiLexer 的 lookaheadAfter 功能
 */
import SubhutiLexer from "../../src/SubhutiLexer.ts"
import { createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

console.log('='.repeat(60))
console.log('测试 012：词法分析器前瞻')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 区分 ?. 和 ?
const tokens1 = [
    createValueRegToken('OptionalChaining', /\?\./, '?.'),
    createValueRegToken('Question', /\?/, '?', false, { not: '.' }),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('Colon', /:/, ':'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

try {
    const lexer = new SubhutiLexer(tokens1)
    const result = lexer.tokenize('a?.b')
    if (result[1].tokenName === 'OptionalChaining') {
        console.log('✅ 测试1: 可选链 ?. 识别成功')
        passed++
    } else {
        console.log('❌ 测试1: 可选链识别失败:', result[1].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 三元运算符 ?
try {
    const lexer = new SubhutiLexer(tokens1)
    const result = lexer.tokenize('a ? b : c')
    if (result[1].tokenName === 'Question') {
        console.log('✅ 测试2: 三元运算符 ? 识别成功')
        passed++
    } else {
        console.log('❌ 测试2: 三元运算符识别失败:', result[1].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 区分 -> 和 -
const tokens2 = [
    createValueRegToken('Arrow', /->/, '->'),
    createValueRegToken('Minus', /-/, '-', false, { not: '>' }),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

try {
    const lexer = new SubhutiLexer(tokens2)
    const result = lexer.tokenize('a -> b')
    if (result[1].tokenName === 'Arrow') {
        console.log('✅ 测试3: 箭头 -> 识别成功')
        passed++
    } else {
        console.log('❌ 测试3: 箭头识别失败:', result[1].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 减法 -
try {
    const lexer = new SubhutiLexer(tokens2)
    const result = lexer.tokenize('a - b')
    if (result[1].tokenName === 'Minus') {
        console.log('✅ 测试4: 减法 - 识别成功')
        passed++
    } else {
        console.log('❌ 测试4: 减法识别失败:', result[1].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

// 测试 5: 正则前瞻 - 数字后缀
const tokens3 = [
    createValueRegToken('BigInt', /[0-9]+n/, '0n'),
    createValueRegToken('Float', /[0-9]+\.[0-9]+/, '0.0'),
    createRegToken('Integer', /[0-9]+/, undefined, false, { not: /^[.n]/ }),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

try {
    const lexer = new SubhutiLexer(tokens3)
    const result = lexer.tokenize('123')
    if (result[0].tokenName === 'Integer') {
        console.log('✅ 测试5: 整数识别成功')
        passed++
    } else {
        console.log('❌ 测试5: 整数识别失败:', result[0].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试5 异常:', e.message)
    failed++
}

// 测试 6: BigInt
try {
    const lexer = new SubhutiLexer(tokens3)
    const result = lexer.tokenize('123n')
    if (result[0].tokenName === 'BigInt') {
        console.log('✅ 测试6: BigInt 识别成功')
        passed++
    } else {
        console.log('❌ 测试6: BigInt 识别失败:', result[0].tokenName)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试6 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
