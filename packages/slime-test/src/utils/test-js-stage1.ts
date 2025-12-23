/**
 * JS Stage 1: CST生成测试 (SlimeJavascriptParser)
 */
import {runTests, testStage1} from './test-framework.ts'
import { SlimeJavascriptParser } from "slime-parser";

runTests(testStage1, {
    stageName: '阶段1: CST生成测试 (SlimeJavascriptParser)',
    description: '词法分析 → 语法分析 (JS基础)',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser
})
