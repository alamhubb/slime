import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import { SlimeJavascriptGeneratorUtil, SlimeGeneratorUtil } from 'slime-generator';

const code = 'import {} from "foo";';
console.log('输入代码:', JSON.stringify(code));

// 使用 TS Parser 解析
const parser = new SlimeParser(code);
const cst = parser.Program('module');

// 使用 TS CstToAst 转换
const converter = new SlimeCstToAst();
const ast = converter.toProgram(cst);
console.log('AST body:', JSON.stringify(ast.body, null, 2));

// 检查 AST 中的关键属性
const importDecl = ast.body[0];
console.log('specifiers:', JSON.stringify(importDecl.specifiers));
console.log('lBraceToken:', importDecl.lBraceToken);
console.log('rBraceToken:', importDecl.rBraceToken);

// 使用 JS Generator 生成代码
const jsGenerator = new SlimeJavascriptGeneratorUtil();
const jsResult = jsGenerator.generator(ast, parser.parsedTokens);
console.log('JS Generator 生成的代码:', JSON.stringify(jsResult.code));

// 使用 TS Generator 生成代码
const tsGenerator = new SlimeGeneratorUtil();
const tsResult = tsGenerator.generator(ast, parser.parsedTokens);
console.log('TS Generator 生成的代码:', JSON.stringify(tsResult.code));
