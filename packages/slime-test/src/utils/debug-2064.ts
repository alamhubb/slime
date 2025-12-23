import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import { SlimeGenerator } from 'slime-generator';

const code = `import foo from "foo.json" with { for: "for" }
export { foo } from "foo.json" with { for: "for" }`;

console.log('输入代码:', code);
console.log('---');

const parser = new SlimeParser(code);
const cst = parser.Program('module');
const converter = new SlimeCstToAst();
const ast = converter.toProgram(cst);

console.log('输入 tokens:', parser.parsedTokens.map(t => t.tokenValue));
console.log('---');

console.log('AST ImportDeclaration:', JSON.stringify(ast.body[0], null, 2));
console.log('---');

const result = SlimeGenerator.generator(ast, parser.parsedTokens);
console.log('生成代码:', result.code);
