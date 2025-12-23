// Phase 6: 类型操作符测试

// ============================================
// 1. TSTypeQuery (typeof x)
// ============================================

const obj1 = { name: "test", age: 30 };
type ObjType = typeof obj1;

// ============================================
// 2. TSTypeOperator (keyof, readonly)
// ============================================

// keyof
interface Person {
    name: string;
    age: number;
}
type PersonKeys = keyof Person;

// readonly
type ReadonlyArray1 = readonly number[];

// ============================================
// 3. TSIndexedAccessType (T[K])
// ============================================

type NameType = Person["name"];
type AllTypes = Person[keyof Person];

// ============================================
// 4. TSConditionalType (T extends U ? X : Y)
// ============================================

type IsString<T> = T extends string ? true : false;

// ============================================
// 5. TSMappedType
// ============================================

type Readonly1<T> = { readonly [K in keyof T]: T[K] };
type Partial1<T> = { [K in keyof T]?: T[K] };
