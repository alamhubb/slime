// 纯 JS 组件测试 - 直接从源文件导入
import SlimeJavascriptParser from '../../../slime-parser/src/deprecated/SlimeJavascriptParser.ts';
import SlimeCstToAstUtil from 'slime-parser';
import { SlimeJavascriptGeneratorUtil } from '../../../slime-generator/src/deprecated/SlimeJavascriptGenerator.ts';

const code = 'import {} from "foo";';
console.log('输入代码:', JSON.stringify(code));

// 使用 JS Parser 解析
const parser = new SlimeJavascriptParser(code);
const cst = parser.Program('module');

// 使用 JS CstToAst 转换
const ast = SlimeCstToAstUtil.toProgram(cst);
console.log('AST body:', JSON.stringify(ast.body, null, 2));

// 检查 AST 中的关键属性
const importDecl = ast.body[0] as any;
console.log('specifiers:', JSON.stringify(importDecl.specifiers));
console.log('lBraceToken:', importDecl.lBraceToken);
console.log('rBraceToken:', importDecl.rBraceToken);

// 使用 JS Generator 生成代码
const jsGenerator = new SlimeJavascriptGeneratorUtil();
const jsResult = jsGenerator.generator(ast, parser.parsedTokens);
console.log('JS Generator 生成的代码:', JSON.stringify(jsResult.code));
