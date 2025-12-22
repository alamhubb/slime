/**
 * 测试 011：词法分析器基础
 * 测试 SubhutiLexer 的基本功能
 */
import SubhutiLexer from "../../src/SubhutiLexer.ts"
import { createKeywordToken, createRegToken, createValueRegToken } from "../../src/struct/SubhutiCreateToken.ts"

const tokens = [
    createKeywordToken('Let', 'let'),
    createKeywordToken('Const', 'const'),
    createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
    createRegToken('Number', /[0-9]+/),
    createValueRegToken('Equals', /=/, '='),
    createValueRegToken('Plus', /\+/, '+'),
    createValueRegToken('Semicolon', /;/, ';'),
    createValueRegToken('WhiteSpace', /[ \t\r\n]+/, ' ', true),
]

console.log('='.repeat(60))
console.log('测试 011：词法分析器基础')
console.log('='.repeat(60))

let passed = 0, failed = 0

// 测试 1: 基本 tokenize
try {
    const lexer = new SubhutiLexer(tokens)
    const result = lexer.tokenize('let x = 5;')
    if (result.length === 5) {  // let, x, =, 5, ;
        console.log('✅ 测试1: 基本 tokenize 成功')
        passed++
    } else {
        console.log('❌ 测试1: token 数量错误:', result.length)
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试1 异常:', e.message)
    failed++
}

// 测试 2: 关键字识别
try {
    const lexer = new SubhutiLexer(tokens)
    const result = lexer.tokenize('let const')
    if (result[0].tokenName === 'Let' && result[1].tokenName === 'Const') {
        console.log('✅ 测试2: 关键字识别成功')
        passed++
    } else {
        console.log('❌ 测试2: 关键字识别失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试2 异常:', e.message)
    failed++
}

// 测试 3: 标识符 vs 关键字
try {
    const lexer = new SubhutiLexer(tokens)
    const result = lexer.tokenize('letter')  // 不是 let
    if (result[0].tokenName === 'Identifier' && result[0].tokenValue === 'letter') {
        console.log('✅ 测试3: 标识符 vs 关键字区分成功')
        passed++
    } else {
        console.log('❌ 测试3: 标识符 vs 关键字区分失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试3 异常:', e.message)
    failed++
}

// 测试 4: 空白跳过
try {
    const lexer = new SubhutiLexer(tokens)
    const result = lexer.tokenize('let   x')  // 多个空格
    if (result.length === 2 && !result.some(t => t.tokenName === 'WhiteSpace')) {
        console.log('✅ 测试4: 空白跳过成功')
        passed++
    } else {
        console.log('❌ 测试4: 空白跳过失败')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试4 异常:', e.message)
    failed++
}

// 测试 5: 位置信息
try {
    const lexer = new SubhutiLexer(tokens)
    const result = lexer.tokenize('let x')
    if (result[0].index === 0 && result[1].index === 4) {
        console.log('✅ 测试5: 位置信息正确')
        passed++
    } else {
        console.log('❌ 测试5: 位置信息错误')
        failed++
    }
} catch (e: any) {
    console.log('❌ 测试5 异常:', e.message)
    failed++
}

console.log(`\n总计: ${passed + failed} 测试, 通过: ${passed}, 失败: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
