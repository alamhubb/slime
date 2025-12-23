/**
 * TS Stage 2: AST生成测试 (SlimeParser + SlimeCstToAst - TypeScript扩展)
 */
import {runTests, testStage2} from "./test-framework.ts";

runTests(testStage2, {
    stageName: '阶段2: AST生成测试 (SlimeParser)',
    description: 'CST → AST 转换 (TS扩展)',
    startFrom: 1,
    stopOnFail: true
    // 使用默认的 SlimeParser 和 SlimeCstToAst
})
