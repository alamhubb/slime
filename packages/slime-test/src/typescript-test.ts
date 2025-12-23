/**
 * TypeScript 语法测试
 * 测试 SlimeParser 对 TypeScript 语法的支持
 * 
 * 用法:
 *   npx tsx packages/slime-test/src/typescript-test.ts              # 测试所有
 *   npx tsx packages/slime-test/src/typescript-test.ts 3            # 从第3个开始
 *   npx tsx packages/slime-test/src/typescript-test.ts 3 -s         # 从第3个开始，遇错停止
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { SlimeParser, SlimeCstToAst } from 'slime-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试目录
const TYPESCRIPT_DIR = path.join(__dirname, 'typescript')

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
}

interface TestResult {
    file: string
    success: boolean
    message: string
    error?: Error
}

/**
 * 获取所有 TypeScript 测试文件
 */
function getTypeScriptFiles(): string[] {
    if (!fs.existsSync(TYPESCRIPT_DIR)) {
        console.error(`❌ 测试目录不存在: ${TYPESCRIPT_DIR}`)
        process.exit(1)
    }
    
    return fs.readdirSync(TYPESCRIPT_DIR)
        .filter(f => f.endsWith('.ts'))
        .sort()
}

/**
 * 测试单个文件
 */
function testFile(filePath: string): TestResult {
    const fileName = path.basename(filePath)
    const code = fs.readFileSync(filePath, 'utf-8')
    
    try {
        // 解析为 CST
        const parser = new SlimeParser(code)
        const cst = parser.Program('module')
        
        if (!cst) {
            return {
                file: fileName,
                success: false,
                message: 'CST 生成失败 (返回 undefined)'
            }
        }
        
        // 转换为 AST
        const converter = new SlimeCstToAst()
        const ast = converter.toProgram(cst)
        
        if (!ast) {
            return {
                file: fileName,
                success: false,
                message: 'AST 转换失败 (返回 undefined)'
            }
        }
        
        // 统计节点数
        const nodeCount = countNodes(ast)
        
        return {
            file: fileName,
            success: true,
            message: `解析成功 (${nodeCount} 个 AST 节点)`
        }
    } catch (error: any) {
        return {
            file: fileName,
            success: false,
            message: error.message,
            error
        }
    }
}

/**
 * 统计 AST 节点数量
 */
function countNodes(node: any): number {
    if (!node || typeof node !== 'object') return 0
    let count = node.type ? 1 : 0
    for (const key of Object.keys(node)) {
        const val = node[key]
        if (Array.isArray(val)) {
            val.forEach(child => {
                count += countNodes(child)
            })
        } else if (val && typeof val === 'object' && key !== 'loc') {
            count += countNodes(val)
        }
    }
    return count
}

/**
 * 运行所有测试
 */
function runTests() {
    const args = process.argv.slice(2)
    const startFrom = parseInt(args.find(a => !a.startsWith('-')) || '1', 10)
    const stopOnFail = args.includes('-s') || args.includes('--stop-on-fail')
    
    const files = getTypeScriptFiles()
    
    console.log('='.repeat(60))
    console.log(`${colors.cyan}🧪 TypeScript 语法测试${colors.reset}`)
    console.log(`📁 测试目录: ${path.relative(process.cwd(), TYPESCRIPT_DIR)}`)
    console.log(`📊 共 ${files.length} 个测试文件`)
    if (startFrom > 1) console.log(`📍 从第 ${startFrom} 个开始`)
    if (stopOnFail) console.log(`🛑 模式: 遇到第一个失败就停止`)
    console.log('='.repeat(60))
    console.log()
    
    let passed = 0
    let failed = 0
    const results: TestResult[] = []
    
    for (let i = startFrom - 1; i < files.length; i++) {
        const file = files[i]
        const filePath = path.join(TYPESCRIPT_DIR, file)
        const result = testFile(filePath)
        results.push(result)
        
        const index = i + 1
        if (result.success) {
            console.log(`[${index}] ${colors.green}✅${colors.reset} ${file} - ${result.message}`)
            passed++
        } else {
            console.log(`[${index}] ${colors.red}❌${colors.reset} ${file} - ${result.message}`)
            if (result.error) {
                console.log(`    ${colors.gray}${result.error.stack?.split('\n').slice(0, 3).join('\n    ')}${colors.reset}`)
            }
            failed++
            
            if (stopOnFail) {
                console.log(`\n${colors.yellow}🛑 在第 ${index} 个测试停止${colors.reset}`)
                break
            }
        }
    }
    
    // 打印汇总
    console.log()
    console.log('='.repeat(60))
    console.log(`${colors.cyan}📊 测试结果汇总${colors.reset}`)
    console.log('='.repeat(60))
    console.log(`${colors.green}✅ 通过: ${passed}${colors.reset}`)
    console.log(`${colors.red}❌ 失败: ${failed}${colors.reset}`)
    console.log(`📊 总计: ${passed + failed}/${files.length}`)
    
    if (failed === 0) {
        console.log(`\n${colors.green}🎉 所有测试通过!${colors.reset}`)
    } else {
        console.log(`\n${colors.yellow}⚠️  有 ${failed} 个测试失败${colors.reset}`)
    }
    console.log('='.repeat(60))
    
    process.exit(failed > 0 ? 1 : 0)
}

// 运行测试
runTests()
