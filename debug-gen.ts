import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import SlimeGenerator from 'slime-generator';

const code = 'let person: { name: string }';
console.log('Input:', code);

try {
    const parser = new SlimeParser(code);
    const cst = parser.Program('module');
    console.log('CST parsed successfully');
    
    const converter = new SlimeCstToAst();
    const ast = converter.toProgram(cst);
    console.log('AST:', JSON.stringify(ast, null, 2));
    
    const result = SlimeGenerator.generator(ast);
    console.log('Generated:', result.code);
} catch (e) {
    console.error('Error:', e);
}
