/**
 * TS Stage 1: CST生成测试 (SlimeParser - TypeScript扩展)
 */
import {runTests, testStage1} from './test-framework.ts'

runTests(testStage1, {
    stageName: '阶段1: CST生成测试 (SlimeParser)',
    description: '词法分析 → 语法分析 (TS扩展)',
    startFrom: 1,
    stopOnFail: true
    // 使用默认的 SlimeParser
})
