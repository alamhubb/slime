/**
 * 阶段4: subhuti 源码测试 (SlimeParser + SlimeCstToAst + SlimeGenerator)
 * 功能与 stage3 一致，测试目录为 subhuti/src
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

// subhuti 源码目录
const casesDir = path.join(__dirname, '..', '..', '..', 'subhuti', 'src')

// 运行测试
runTests(testStage3, {
    stageName: '阶段4: subhuti 源码测试',
    description: 'AST → JavaScript代码，比较输入/输出的 token 序列',
    casesDir: casesDir,
    startFrom: 1,
    stopOnFail: true,
    fileExtension: '.ts'
})
