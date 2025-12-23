import { SlimeParser } from "slime-parser"

// 测试泛型实例化 - 多类型参数
const tests = [
    // 简单赋值
    ['simple assign', `const m = foo()`],
    ['simple new assign', `const m = new Foo()`],
    // 泛型赋值
    ['generic 1', `const m = foo<A>()`],
    ['generic 2', `const m = foo<A, B>()`],
    ['new generic 1', `const m = new Foo<A>()`],
    ['new generic 2', `const m = new Foo<A, B>()`],
]

for (const [name, code] of tests) {
    const parser = new SlimeParser(code)
    try {
        const cst = parser.Program('module')
        console.log(`${name}: ${cst ? '✅' : '❌'}`)
    } catch (e) {
        console.log(`${name}: ❌ ${e.message}`)
    }
}
