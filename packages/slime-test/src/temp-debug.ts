// 临时调试文件
import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import { SlimeGenerator } from 'slime-generator';

const code = `import "foo"
with { type: "json" }
`;
const parser = new SlimeParser(code);
const cst = (parser as any).Program('module');

const cstToAst = new SlimeCstToAst();
const ast = cstToAst.toProgram(cst);

console.log('AST:');
console.log(JSON.stringify(ast, null, 2));

// 生成代码
const generator = new SlimeGenerator();
const output = generator.generate(ast);
console.log('\n生成的代码:');
console.log(output);
