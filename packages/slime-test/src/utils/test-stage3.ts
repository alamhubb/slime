/**
 * 阶段3: 代码生成测试
 * 测试范围: AST → JavaScript代码
 * 验证方式: 比较输入代码和输出代码的 token 序列是否一致
 * 前提: 阶段1、2已通过（CST和AST可以正常生成）
 *
 * 用法:
 *   npx tsx slime/packages/slime-test/src/utils/test-stage3.ts              # 从头开始测试
 *   npx tsx slime/packages/slime-test/src/utils/test-stage3.ts 100          # 从第100个开始
 *   npx tsx slime/packages/slime-test/src/utils/test-stage3.ts 100 -s       # 从第100个开始，遇错停止
 */
import { runTests, testStage3 } from "./test-framework.ts";
import SlimeJavascriptParser from "../../../slime-parser/src/deprecated/SlimeJavascriptParser.ts";
import { SlimeCstToAst } from "../../../slime-parser/src/SlimeCstToAstUtil.ts";
import SlimeJavascriptGenerator from "../../../slime-generator/src/deprecated/SlimeJavascriptGenerator.ts";

// 运行测试 - 使用 SlimeJavascriptParser + SlimeJavascriptGenerator (deprecated stack)
runTests(testStage3, {
    stageName: '阶段3: 代码生成测试 (SlimeJavascriptParser)',
    description: 'AST → JavaScript代码，比较输入/输出的 token 序列',
    startFrom: 1,
    stopOnFail: true,
    ParserClass: SlimeJavascriptParser,
    CstToAstClass: SlimeCstToAst,
    Generator: SlimeJavascriptGenerator
})
