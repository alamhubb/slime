import { SlimeParser, SlimeCstToAst } from 'slime-parser';
import { SlimeGeneratorUtil } from 'slime-generator';

const code = `function getNumber(): number {
    return 42
}`;
console.log('Input:', code);

try {
    const parser = new SlimeParser(code);
    const cst = parser.Program('module');
    console.log('CST parsed successfully');
    
    const converter = new SlimeCstToAst();
    const ast = converter.toProgram(cst);
    console.log('AST converted successfully');
    
    // 检查函数声明的结构
    const funcDecl = ast.body[0];
    console.log('Has returnType:', 'returnType' in funcDecl);
    if ((funcDecl as any).returnType) {
        console.log('ReturnType:', JSON.stringify((funcDecl as any).returnType, null, 2));
    }
    
    const generator = new SlimeGeneratorUtil();
    const result = generator.generator(ast);
    console.log('Generated:', result.code);
} catch (e) {
    console.error('Error:', e);
}
