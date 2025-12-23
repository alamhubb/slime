/**
 * JS Stage 2: AST生成测试 (SlimeJavascriptParser + SlimeCstToAst)
 */
import {runTests, testStage2} from "./test-framework.ts";
import { SlimeJavascriptParser, SlimeCstToAst } from "slime-parser";

runTests(testStage2, {
    stageName: '阶段2: AST生成测试 (SlimeJavascriptParser)',
    description: 'CST → AST 转换 (JS基础)',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser,
    CstToAstClass: SlimeCstToAst
})
