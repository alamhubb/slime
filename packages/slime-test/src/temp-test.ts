// 临时测试文件 - 测试栈溢出问题（完整流程）
import { SlimeCstToAst } from '../../slime-parser/src/SlimeCstToAstUtil.ts';
import SlimeParser from '../../slime-parser/src/SlimeParser.ts';
import SlimeGenerator from '../../slime-generator/src/SlimeGenerator.ts';

// 测试用例 8 的完整内容
const code = `// Phase 3: 变量类型注解
// 测试 let x: Type 语法

// 8.1 let 声明
let num: number
let str: string
let flag: boolean

// 8.2 const 声明
const PI: number = 3.14
const NAME: string = "app"
`;

console.log('测试代码:', code);

const parser = new SlimeParser(code);
const cst = parser.Program('module');
console.log('CST 生成成功');
const tokens = parser.parsedTokens;

const cstToAst = new SlimeCstToAst();
console.log('CstToAst 实例化成功');

try {
    const ast = cstToAst.toProgram(cst);
    console.log('AST 生成成功');
    
    // 代码生成
    const result = SlimeGenerator.generator(ast, tokens);
    console.log('代码生成成功:', result.code);
    
    // 重新解析生成的代码
    console.log('开始重新解析...');
    const parser2 = new SlimeParser(result.code);
    const cst2 = parser2.Program('module');
    console.log('重新解析 CST 成功');
    
    const cstToAst2 = new SlimeCstToAst();
    const ast2 = cstToAst2.toProgram(cst2);
    console.log('重新解析 AST 成功');
} catch (e) {
    console.error('失败:', e);
}
