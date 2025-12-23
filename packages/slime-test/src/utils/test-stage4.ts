/**
 * 阶段4: TypeScript 语法测试
 * 测试范围: TypeScript 语法解析 → CST → AST → 代码生成
 * 验证方式: 比较输入代码和输出代码的 token 序列是否一致
 * 前提: 阶段1、2、3已通过（CST、AST、代码生成可以正常工作）
 *
 * 用法:
 *   npx tsx packages/slime-test/src/utils/test-stage4.ts              # 从头开始测试
 *   npx tsx packages/slime-test/src/utils/test-stage4.ts 100          # 从第100个开始
 *   npx tsx packages/slime-test/src/utils/test-stage4.ts 100 -s       # 从第100个开始，遇错停止
 */
import * as path from 'path'
import { fileURLToPath } from 'url'
import { runTests, testStage3 } from "./test-framework.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TypeScript 测试目录
const TYPESCRIPT_DIR = path.join(__dirname, '..', 'typescript')

// 运行测试
runTests(testStage3, {
    stageName: '阶段4: TypeScript 语法测试',
    description: 'TypeScript 语法解析 → CST → AST → 代码生成，比较输入/输出的 token 序列',
    casesDir: TYPESCRIPT_DIR,
    startFrom: 1,
    stopOnFail: true,
    fileExtension: '.ts'
})
