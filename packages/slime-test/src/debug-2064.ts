/**
 * 调试测试 2064: import foo from "foo.json" with { for: "for" }
 */
import SlimeJavascriptParser from "../../slime-parser/src/deprecated/SlimeJavascriptParser.ts";
import { SlimeJavascriptCstToAst } from "slime-parser";
import { SlimeGenerator } from "slime-generator";

const code = `import foo from "foo.json" with { for: "for" }
export { foo } from "foo.json" with { for: "for" }`;

console.log("=== 输入代码 ===");
console.log(code);
console.log();

// 解析
const parser = new SlimeJavascriptParser(code);
const cst = parser.Program('module');
const inputTokens = parser.parsedTokens;

console.log("=== 输入 Tokens ===");
inputTokens.forEach((t, i) => console.log(`[${i}] ${t.tokenValue}`));
console.log();

// CST -> AST
const converter = new SlimeJavascriptCstToAst();
const ast = converter.toProgram(cst);

console.log("=== AST ===");
console.log(JSON.stringify(ast, null, 2));
console.log();

// AST -> 代码
const result = SlimeGenerator.generator(ast, inputTokens);
console.log("=== 生成代码 ===");
console.log(result.code);
console.log();

// 重新解析生成的代码
const parser2 = new SlimeJavascriptParser(result.code);
const cst2 = parser2.Program('module');
const outputTokens = parser2.parsedTokens;

console.log("=== 输出 Tokens ===");
outputTokens.forEach((t, i) => console.log(`[${i}] ${t.tokenValue}`));
console.log();

// 比较
console.log("=== 比较 ===");
console.log(`输入 tokens: ${inputTokens.length}`);
console.log(`输出 tokens: ${outputTokens.length}`);

const inputValues = inputTokens.map(t => t.tokenValue).filter(v => v !== ';');
const outputValues = outputTokens.map(t => t.tokenValue).filter(v => v !== ';');

console.log(`输入 (过滤分号): ${inputValues.length}`);
console.log(`输出 (过滤分号): ${outputValues.length}`);

console.log("\n输入:", inputValues.join(' '));
console.log("输出:", outputValues.join(' '));
