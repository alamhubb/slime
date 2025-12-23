/**
 * JS Stage 3: 代码生成测试 (SlimeJavascriptParser + SlimeJavascriptCstToAst + SlimeJavascriptGenerator)
 */
import {runTests, testStage3} from "./test-framework.ts";
import { SlimeJavascriptParser, SlimeCstToAst } from "slime-parser";
import { SlimeJavascriptGenerator } from "slime-generator";

runTests(testStage3, {
    stageName: '阶段3: 代码生成测试 (SlimeJavascriptParser)',
    description: 'AST → JavaScript代码 (JS基础)',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser,
    CstToAstClass: SlimeCstToAst,
    Generator: SlimeJavascriptGenerator
})
