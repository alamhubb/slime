/**
 * JS Stage 2: AST生成测试 (SlimeJavascriptParser + SlimeJavascriptCstToAst)
 */
import {runTests, testStage2} from "./test-framework.ts";
import SlimeJavascriptParser from "../../../slime-parser/src/deprecated/SlimeJavascriptParser.ts";
import { SlimeJavascriptCstToAst } from "slime-parser";

runTests(testStage2, {
    stageName: '阶段2: AST生成测试 (SlimeJavascriptParser)',
    description: 'CST → AST 转换 (JS基础)',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser,
    CstToAstClass: SlimeJavascriptCstToAst
})
