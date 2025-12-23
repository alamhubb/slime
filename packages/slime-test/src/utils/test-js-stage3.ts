/**
 * JS Stage 3: 代码生成测试 (SlimeJavascriptParser + SlimeJavascriptCstToAst + SlimeJavascriptGenerator)
 */
import {runTests, testStage3} from "./test-framework.ts";
import SlimeJavascriptParser from "../../../slime-parser/src/deprecated/SlimeJavascriptParser.ts";
import { SlimeJavascriptCstToAst } from "slime-parser";
import SlimeJavascriptGenerator from "../../../slime-generator/src/deprecated/SlimeJavascriptGenerator.ts";

runTests(testStage3, {
    stageName: '阶段3: 代码生成测试 (SlimeJavascriptParser)',
    description: 'AST → JavaScript代码 (JS基础)',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser,
    CstToAstClass: SlimeJavascriptCstToAst,
    Generator: SlimeJavascriptGenerator
})
