// 调试 import with attributes 问题
import SlimeCstToAstUtil from 'slime-parser';
import SlimeJavascriptParser from '../../slime-parser/src/deprecated/SlimeJavascriptParser.ts';
import SlimeGenerator from '../../slime-generator/src/SlimeGenerator.ts';

const code = `import foo from "foo.json" with { for: "for" }`;

console.log('测试代码:', code);
console.log('---');

// 使用 SlimeJavascriptParser
const parser = new SlimeJavascriptParser(code);
const cst = parser.Program('module');
const tokens = parser.parsedTokens;

console.log('Tokens:', tokens.map(t => t.tokenValue));

const ast = SlimeCstToAstUtil.toProgram(cst);

console.log('\nAST body 数量:', ast.body.length);
for (let i = 0; i < ast.body.length; i++) {
    const stmt = ast.body[i];
    console.log(`Statement ${i}: type=${stmt.type}`);
    if (stmt.type === 'ImportDeclaration') {
        console.log('  source:', (stmt as any).source?.value);
        console.log('  attributes:', JSON.stringify((stmt as any).attributes, null, 2));
    }
}

// 代码生成
const result = SlimeGenerator.generator(ast, tokens);
console.log('\n生成的代码:');
console.log(result.code);
