// Phase 2: 类型断言测试

// ============================================
// 1. TSTypeAssertion (<Type>x) - 尖括号类型断言
// ============================================

const value1: unknown = 123;
const num1 = <number>value1;

const arr1 = <string[]>[];

// ============================================
// 2. TSAsExpression (x as Type) - as 类型断言
// ============================================

const value2: unknown = "hello";
const str2 = value2 as string;

const arr2 = [] as number[];

// ============================================
// 3. TSNonNullExpression (x!) - 非空断言
// ============================================

const maybeNull: string | null = "hello";
const definitelyString = maybeNull!;

// ============================================
// 4. TSSatisfiesExpression (x satisfies Type)
// ============================================

const palette = {
    red: [255, 0, 0],
} satisfies Record<string, number[]>;

