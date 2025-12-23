// Phase 2: 数组类型和元组类型
// 测试 T[] 和 [T, U] 语法

// 5.1 数组类型
let numbers: number[]
let strings: string[]
let objects: object[]

// 5.2 多维数组
let matrix: number[][]
let cube: string[][][]

// 5.3 基础元组
let pair: [string, number]
let triple: [boolean, string, number]

// 5.4 命名元组
let point: [x: number, y: number]
let person: [name: string, age: number, active: boolean]

// 5.5 可选元组元素
let optional: [string, number?]
let moreOptional: [string, number?, boolean?]

// 5.6 剩余元素
let rest: [string, ...number[]]
let mixed: [boolean, ...string[], number]
