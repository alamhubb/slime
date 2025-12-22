/**
 * Token 一致性测试
 *
 * 测试用例: const a = 1
 * 验证:
 *   1. 解析出来的 token 数量大于 0
 *   2. 生成后的代码再次解析出来的 token 数量大于 0
 *   3. 两次解析的 token 序列一致
 *
 * 用法:
 *   npx tsx packages/slime-test/src/test-token-consistency.ts
 */
import { SlimeParser, SlimeCstToAst } from 'slime-parser'
import { SlimeGenerator } from 'slime-generator'
import type { SubhutiMatchToken } from 'subhuti'

// ============================================
// 测试配置
// ============================================

const TEST_CODE = 'const a: number = 1'
const PARSE_MODE: 'module' | 'script' = 'script'

// ============================================
// 工具函数
// ============================================

/**
 * 解析代码并返回 AST 和 Tokens
 */
function parseCode(code: string, mode: 'module' | 'script') {
    const parser = new SlimeParser(code)
    const cst = parser.Program(mode)
    const tokens = parser.parsedTokens

    if (!cst) {
        return { cst: null, ast: null, tokens }
    }

    const converter = new SlimeCstToAst()
    const ast = converter.toProgram(cst)

    return { cst, ast, tokens }
}

/**
 * 提取 token 的关键信息用于比较
 * 忽略位置信息，只比较 tokenName 和 tokenValue
 * 过滤掉分号 (;)，因为代码生成器可能会自动添加分号 (ASI 的逆过程)
 */
function extractTokenInfo(tokens: SubhutiMatchToken[]): Array<{ name: string; value: string }> {
    return tokens
        .filter(t => t.tokenValue !== ';')  // 过滤分号
        .map(t => ({
            name: t.tokenName,
            value: t.tokenValue
        }))
}

/**
 * 比较两个 token 序列是否一致
 */
function compareTokenSequences(
    original: Array<{ name: string; value: string }>,
    regenerated: Array<{ name: string; value: string }>
): { match: boolean; details: string } {
    if (original.length !== regenerated.length) {
        return {
            match: false,
            details: `Token 数量不一致: 原始 ${original.length}, 重新生成 ${regenerated.length}`
        }
    }

    for (let i = 0; i < original.length; i++) {
        const origToken = original[i]
        const regenToken = regenerated[i]

        if (origToken.name !== regenToken.name || origToken.value !== regenToken.value) {
            return {
                match: false,
                details: `Token[${i}] 不匹配:\n` +
                    `  原始: { name: "${origToken.name}", value: "${origToken.value}" }\n` +
                    `  重新生成: { name: "${regenToken.name}", value: "${regenToken.value}" }`
            }
        }
    }

    return { match: true, details: 'Token 序列完全一致' }
}

// ============================================
// 主测试逻辑
// ============================================

function runTest() {
    console.log('='.repeat(60))
    console.log('🧪 Token 一致性测试')
    console.log('='.repeat(60))
    console.log(`📝 测试代码: "${TEST_CODE}"`)
    console.log(`📦 解析模式: ${PARSE_MODE}`)
    console.log('')

    // 第一步: 解析原始代码
    console.log('【步骤 1】解析原始代码...')
    const { ast, tokens: originalTokens } = parseCode(TEST_CODE, PARSE_MODE)

    if (!ast) {
        console.log('❌ 测试失败: AST 转换失败')
        process.exit(1)
    }

    if (!originalTokens || originalTokens.length === 0) {
        console.log('❌ 测试失败: 原始 token 数量为 0')
        process.exit(1)
    }

    console.log(`✅ 原始代码解析成功, Token 数量: ${originalTokens.length}`)
    console.log('   原始 Tokens:')
    originalTokens.forEach((t, i) => {
        console.log(`     [${i}] ${t.tokenName}: "${t.tokenValue}"`)
    })
    console.log('')

    // 调试：打印 AST 中的类型注解
    const declaration = (ast as any).body?.[0]?.declarations?.[0]
    const id = declaration?.id
    console.log('   [DEBUG] VariableDeclarator.id:', id?.name)
    console.log('   [DEBUG] VariableDeclarator.id.typeAnnotation:', id?.typeAnnotation)
    console.log('')

    // 第二步: 使用 Generator 生成代码
    console.log('【步骤 2】生成代码...')
    const result = SlimeGenerator.generator(ast, originalTokens)
    const generatedCode = result.code
    console.log(`✅ 代码生成成功: "${generatedCode}"`)
    console.log('')

    // 第三步: 重新解析生成的代码
    console.log('【步骤 3】重新解析生成的代码...')
    const { tokens: regeneratedTokens } = parseCode(generatedCode, PARSE_MODE)

    if (!regeneratedTokens || regeneratedTokens.length === 0) {
        console.log('❌ 测试失败: 重新生成的 token 数量为 0')
        process.exit(1)
    }

    console.log(`✅ 重新解析成功, Token 数量: ${regeneratedTokens.length}`)
    console.log('   重新生成的 Tokens:')
    regeneratedTokens.forEach((t, i) => {
        console.log(`     [${i}] ${t.tokenName}: "${t.tokenValue}"`)
    })
    console.log('')

    // 第四步: 比较 Token 序列
    console.log('【步骤 4】比较 Token 序列...')
    const originalInfo = extractTokenInfo(originalTokens)
    const regeneratedInfo = extractTokenInfo(regeneratedTokens)

    const comparison = compareTokenSequences(originalInfo, regeneratedInfo)

    if (!comparison.match) {
        console.log(`❌ 测试失败: ${comparison.details}`)
        process.exit(1)
    }

    console.log(`✅ ${comparison.details}`)
    console.log('')

    // 测试通过
    console.log('='.repeat(60))
    console.log('🎉 测试通过!')
    console.log('='.repeat(60))
    console.log('')
    console.log('📊 测试摘要:')
    console.log(`   ✓ 原始 Token 数量: ${originalTokens.length} (> 0)`)
    console.log(`   ✓ 重新生成 Token 数量: ${regeneratedTokens.length} (> 0)`)
    console.log(`   ✓ Token 序列一致性: 通过`)
    console.log('')
}

// 执行测试
runTest()
