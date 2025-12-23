/**
 * TS Stage 3: 代码生成测试 (SlimeParser + SlimeCstToAst + SlimeGenerator - TypeScript扩展)
 */
import {runTests, testStage3} from "./test-framework.ts";

runTests(testStage3, {
    stageName: '阶段3: 代码生成测试 (SlimeParser)',
    description: 'AST → JavaScript代码 (TS扩展)',
    startFrom: 1,
    stopOnFail: true
    // 使用默认的 SlimeParser, SlimeCstToAst, SlimeGenerator
})
