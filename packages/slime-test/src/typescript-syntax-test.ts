/**
 * TypeScript 语法支持测试
 *
 * 测试 SlimeCstToAst 对 TypeScript 语法的支持
 * 验证方式：解析源代码记录 token 数量，生成代码后再次解析，比较两次 token 数量是否一致
 */

// 直接使用源码路径
import SlimeParser from '../../slime-parser/src/SlimeParser.ts'
import {SlimeCstToAst} from "slime-parser";
import {SlimeGenerator} from "slime-generator";

interface TestCase {
    name: string
    code: string
    expectedType?: string
    skip?: boolean
}

// 50个 TypeScript 语法测试用例（带分号以匹配生成器输出）
const testCases: TestCase[] = [
    // ==================== 1-10: 基础类型注解 ====================
    {
        name: '1. 变量类型注解 - string',
        code: `let name: string = "hello";`
    },
    {
        name: '2. 变量类型注解 - number',
        code: `const count: number = 42;`
    },
    {
        name: '3. 变量类型注解 - boolean',
        code: `let flag: boolean = true;`
    },
    {
        name: '4. 变量类型注解 - any',
        code: `let value: any = null;`
    },
    {
        name: '5. 变量类型注解 - unknown',
        code: `let data: unknown = getData();`
    },
    {
        name: '6. 变量类型注解 - void',
        code: `let nothing: void = undefined;`
    },
    {
        name: '7. 变量类型注解 - null',
        code: `let empty: null = null;`
    },
    {
        name: '8. 变量类型注解 - undefined',
        code: `let undef: undefined = undefined;`
    },
    {
        name: '9. 变量类型注解 - never',
        code: `function fail(): never { throw new Error(); }`
    },
    {
        name: '10. 变量类型注解 - object',
        code: `let obj: object = {};`
    },

    // ==================== 11-15: 数组类型 ====================
    {
        name: '11. 数组类型 - number[]',
        code: `let numbers: number[] = [1, 2, 3];`
    },
    {
        name: '12. 数组类型 - string[]',
        code: `let names: string[] = ["a", "b"];`
    },
    {
        name: '13. 二维数组类型',
        code: `let matrix: number[][] = [[1, 2], [3, 4]];`
    },
    {
        name: '14. 对象数组类型',
        code: `let users: User[] = [];`
    },
    {
        name: '15. 空数组初始化',
        code: `const result: SubhutiCst[] = [];`
    },

    // ==================== 16-20: 联合类型 ====================
    {
        name: '16. 联合类型 - string | number',
        code: `let id: string | number = "abc";`
    },
    {
        name: '17. 联合类型 - 包含 null',
        code: `let value: string | null = null;`
    },
    {
        name: '18. 联合类型 - 包含 undefined',
        code: `let opt: number | undefined = undefined;`
    },
    {
        name: '19. 多联合类型',
        code: `let mixed: string | number | boolean = true;`
    },
    {
        name: '20. 联合类型数组',
        code: `let items: (string | number)[] = [1, "a"];`
    },

    // ==================== 21-25: 函数类型注解 ====================
    {
        name: '21. 函数参数类型',
        code: `function greet(name: string) { return name; }`
    },
    {
        name: '22. 函数返回类型',
        code: `function add(a: number, b: number): number { return a + b; }`
    },
    {
        name: '23. 可选参数',
        code: `function log(msg: string, level?: number) {}`
    },
    {
        name: '24. 默认参数带类型',
        code: `function greet(name: string = "World"): string { return name; }`
    },
    {
        name: '25. 剩余参数类型',
        code: `function sum(...nums: number[]): number { return 0; }`
    },

    // ==================== 26-30: 类类型注解 ====================
    {
        name: '26. 类字段类型',
        code: `class User { name: string; }`
    },
    {
        name: '27. 类字段带初始值',
        code: `class Counter { count: number = 0; }`
    },
    {
        name: '28. 类方法返回类型',
        code: `class Calculator { add(a: number, b: number): number { return a + b; } }`
    },
    {
        name: '29. 私有字段类型',
        code: `class Secret { #value: string = ""; }`
    },
    {
        name: '30. 静态字段类型',
        code: `class Config { static version: string = "1.0"; }`
    },

    // ==================== 31-35: 接口 ====================
    {
        name: '31. 简单接口',
        code: `interface User { name: string }`
    },
    {
        name: '32. 接口可选属性',
        code: `interface Config { debug?: boolean }`
    },
    {
        name: '33. 接口方法签名',
        code: `interface Greeter { greet(name: string): void }`
    },
    {
        name: '34. 接口继承',
        code: `interface Animal { name: string } interface Dog extends Animal { bark(): void }`
    },
    {
        name: '35. 导出接口',
        code: `export interface Point { x: number; y: number }`
    },

    // ==================== 36-40: 类型别名 ====================
    {
        name: '36. 简单类型别名',
        code: `type ID = string;`
    },
    {
        name: '37. 联合类型别名',
        code: `type StringOrNumber = string | number;`
    },
    {
        name: '38. 对象类型别名',
        code: `type Point = { x: number; y: number };`
    },
    {
        name: '39. 函数类型别名',
        code: `type Callback = (value: string) => void;`
    },
    {
        name: '40. 导出类型别名',
        code: `export type Result<T> = T | Error;`
    },

    // ==================== 41-45: 泛型 ====================
    {
        name: '41. 泛型函数',
        code: `function identity<T>(value: T): T { return value; }`
    },
    {
        name: '42. 泛型类',
        code: `class Container<T> { value: T; }`
    },
    {
        name: '43. 泛型接口',
        code: `interface List<T> { items: T[]; add(item: T): void }`
    },
    {
        name: '44. 泛型约束',
        code: `function getLength<T extends { length: number }>(obj: T): number { return obj.length; }`
    },
    {
        name: '45. 多泛型参数',
        code: `function pair<K, V>(key: K, value: V): [K, V] { return [key, value]; }`
    },

    // ==================== 46-50: 高级特性 ====================
    {
        name: '46. 类型引用带泛型',
        code: `let map: Map<string, number> = new Map();`
    },
    {
        name: '47. 元组类型',
        code: `let point: [number, number] = [0, 0];`
    },
    {
        name: '48. 交叉类型',
        code: `type Combined = TypeA & TypeB;`
    },
    {
        name: '49. 类型导入',
        code: `import type { User } from './types';`
    },
    {
        name: '50. 类型导出',
        code: `export type { User, Config };`
    },
]

// 运行测试
function runTests() {
    console.log('=== TypeScript 语法支持测试 (Token 数量验证) ===\n')

    let passed = 0
    let failed = 0
    let skipped = 0
    const failures: {
        name: string
        error: string
        original: string
        generated: string
        originalTokenCount: number
        generatedTokenCount: number
    }[] = []

    for (const testCase of testCases) {
        if (testCase.skip) {
            console.log(`⏭️  ${testCase.name} - SKIPPED`)
            skipped++
            continue
        }

        let generatedCode = ''
        let originalTokenCount = 0
        let generatedTokenCount = 0

        try {
            // 1. 第一次解析源代码，记录 token 数量
            const parser1 = new SlimeParser(testCase.code)
            const cst1 = parser1.Program()

            if (!cst1) {
                throw new Error('第一次 CST 解析失败')
            }

            originalTokenCount = parser1.parsedTokens.length

            // 2. CST -> AST
            const converter = new SlimeCstToAst()
            const ast = converter.toProgram(cst1)

            if (!ast) {
                throw new Error('AST 转换失败')
            }

            // 3. AST -> 代码
            const result = SlimeGenerator.generator(ast, parser1.parsedTokens)
            generatedCode = result.code

            // 4. 第二次解析生成的代码，记录 token 数量
            const parser2 = new SlimeParser(generatedCode)
            const cst2 = parser2.Program()

            if (!cst2) {
                throw new Error('第二次 CST 解析失败')
            }

            generatedTokenCount = parser2.parsedTokens.length

            // 5. 比较 token 数量
            if (originalTokenCount !== generatedTokenCount) {
                throw new Error(
                    `Token 数量不匹配: 原始 ${originalTokenCount}, 生成 ${generatedTokenCount}`
                )
            }

            console.log(`✅ ${testCase.name} (tokens: ${originalTokenCount})`)
            passed++
        } catch (error: any) {
            console.log(`❌ ${testCase.name}`)
            console.log(`   错误: ${error.message}`)
            failed++

            failures.push({
                name: testCase.name,
                error: error.message,
                original: testCase.code,
                generated: generatedCode,
                originalTokenCount,
                generatedTokenCount
            })
        }
    }

    console.log('\n=== 测试结果 ===')
    console.log(`通过: ${passed}`)
    console.log(`失败: ${failed}`)
    console.log(`跳过: ${skipped}`)
    console.log(`总计: ${testCases.length}`)

    if (failures.length > 0) {
        console.log('\n=== 失败详情 ===')
        for (const f of failures) {
            console.log(`\n- ${f.name}:`)
            console.log(`  错误: ${f.error}`)
            console.log(`  原始代码: ${f.original}`)
            console.log(`  原始 token 数: ${f.originalTokenCount}`)
            console.log(`  生成代码: ${f.generated}`)
            console.log(`  生成 token 数: ${f.generatedTokenCount}`)
        }
    }

    return { passed, failed, skipped, total: testCases.length }
}

// 执行测试
runTests()
