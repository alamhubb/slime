/**
 * ES2025 Parser - 完全符合 ECMAScript® 2025 规范的 Parser
 * 规范：https://tc39.es/ecma262/2025/#sec-grammar-summary
 *
 * 设计原则：
 * 1. 完全按照规范语法实现，一对一映射
 * 2. 每个规则都是独立的方法，使用 @SubhutiRule 装饰器
 * 3. 使用 Es2025TokenConsumer 提供类型安全的 token 消费
 * 4. 支持所有参数化规则 [Yield, Await, In, Return, Default, Tagged]
 *
 * @version 1.0.0
 */
import {
    Subhuti,
    SubhutiRule,
    type SubhutiCst,
    type SubhutiParserOptions,
    type SubhutiTokenConsumerConstructor,
} from "subhuti"
import SlimeTokenConsumer from "./SlimeTokenConsumer.ts"
import SlimeJavascriptParser, { type ExpressionParams, type DeclarationParams } from "./deprecated/SlimeJavascriptParser.ts";
import { slimeJavascriptTokens } from "./deprecated/SlimeJavascriptTokens.ts";

// ============================================
// 保留字集合（用于 Identifier 验证）
// ============================================

/**
 * ES2025 保留字集合
 * 来源：ECMAScript® 2025 规范 12.7.2 Keywords and Reserved Words
 *
 * 分类说明：
 * 1. 硬关键字（永久保留，在此集合中）：
 *    break, case, catch, class, const, continue, debugger, default,
 *    delete, do, else, enum, export, extends, false, finally, for, function,
 *    if, import, in, instanceof, new, null, return, super, switch, this,
 *    throw, true, try, typeof, var, void, while, with, await, yield
 *    实现方式：createKeywordToken + 独立 Token
 *
 * 2. 软关键字（不在此集合中，可作标识符）：
 *    async, let, static, as, get, set, of, from, target, meta
 *    - async: 可作变量名，如 `let async = 1`
 *    - let, static: 非严格模式下可作标识符
 *    - 其他: 仅在特定语法位置是关键字
 *    实现方式：识别为 IdentifierName + consumeIdentifierValue()
 *
 * 用途：在 Parser 中验证标识符是否为保留字
 * 实现：自动从所有 isKeyword=true 的 token 中提取（仅包含硬关键字）
 */

// ============================================
// Es2025Parser 主类
// ============================================

@Subhuti
export default class SlimeParser<T extends SlimeTokenConsumer = SlimeTokenConsumer> extends SlimeJavascriptParser<T> {

    /**
     * 构造函数
     * @param sourceCode 原始源码
     * @param options 可选配置
     */
    constructor(sourceCode: string = '', options?: SubhutiParserOptions<T>) {
        const defaultTokenConsumer = SlimeTokenConsumer as unknown as SubhutiTokenConsumerConstructor<T>
        super(sourceCode, {
            tokenConsumer: options?.tokenConsumer ?? defaultTokenConsumer,
            tokenDefinitions: options?.tokenDefinitions ?? slimeJavascriptTokens
        })
    }

    // ============================================
    // TypeScript 扩展: 类型注解
    // ============================================

    /**
     * [TypeScript] 重写 BindingIdentifier 以支持可选的类型注解
     *
     * BindingIdentifier[Yield, Await] :
     *     Identifier
     *     yield
     *     await
     *
     * [TypeScript 扩展]:
     *     BindingIdentifier TSTypeAnnotation_opt
     */
    @SubhutiRule
    override BindingIdentifier(params: ExpressionParams = {}) {
        // 首先解析基础的 BindingIdentifier
        this.Or([
            { alt: () => this.Identifier() },
            { alt: () => this.tokenConsumer.Yield() },
            { alt: () => this.tokenConsumer.Await() }
        ])
        // [TypeScript] 可选的类型注解
        this.Option(() => this.TSTypeAnnotation())
    }

    // ============================================
    // TypeScript: 类型注解
    // ============================================

    /**
     * [TypeScript] 类型注解
     *
     * TSTypeAnnotation :
     *     : TSType
     */
    @SubhutiRule
    TSTypeAnnotation() {
        this.tokenConsumer.Colon()
        this.TSType()
    }

    // ============================================
    // TypeScript: 类型 (Phase 2 - 复合类型)
    // ============================================

    /**
     * [TypeScript] 类型
     *
     * TSType :
     *     TSFunctionType
     *     TSConstructorType
     *     TSConditionalType
     *
     * 优先级（从低到高）：
     * 1. 函数类型 (params) => ReturnType
     * 2. 构造函数类型 new (params) => ReturnType
     * 3. 条件类型 T extends U ? X : Y
     * 4. 联合类型 |
     * 5. 交叉类型 &
     * 6. 类型操作符 (typeof, keyof, readonly, unique, infer)
     * 7. 基础类型（带可选数组后缀）
     */
    @SubhutiRule
    TSType() {
        this.Or([
            // 函数类型: (x: T) => U 或 <T>(x: T) => U
            { alt: () => this.TSFunctionType() },
            // 构造函数类型: new (x: T) => U
            { alt: () => this.TSConstructorType() },
            // 条件类型（包含联合/交叉类型）
            { alt: () => this.TSConditionalType() },
        ])
    }

    /**
     * [TypeScript] 条件类型
     *
     * TSConditionalType :
     *     TSUnionOrIntersectionType (extends TSUnionOrIntersectionType ? TSType : TSType)?
     *
     * 条件类型优先级低于联合/交叉类型
     */
    @SubhutiRule
    TSConditionalType() {
        // 解析 checkType
        this.TSUnionOrIntersectionType()
        // 可选的条件部分
        this.Option(() => {
            this.tokenConsumer.Extends()
            // 解析 extendsType
            this.TSUnionOrIntersectionType()
            this.tokenConsumer.Question()
            // 解析 trueType
            this.TSType()
            this.tokenConsumer.Colon()
            // 解析 falseType
            this.TSType()
        })
    }

    /**
     * [TypeScript] 联合或交叉类型
     *
     * TSUnionOrIntersectionType :
     *     TSIntersectionType (| TSIntersectionType)*
     *
     * 联合类型优先级最低，所以先解析交叉类型
     */
    @SubhutiRule
    TSUnionOrIntersectionType() {
        // 解析第一个交叉类型
        this.TSIntersectionType()
        // 可选的更多联合成员
        this.Many(() => {
            this.tokenConsumer.BitwiseOr()
            this.TSIntersectionType()
        })
    }

    /**
     * [TypeScript] 交叉类型
     *
     * TSIntersectionType :
     *     TSTypeOperand (& TSTypeOperand)*
     */
    @SubhutiRule
    TSIntersectionType() {
        // 解析第一个类型操作数
        this.TSTypeOperand()
        // 可选的更多交叉成员
        this.Many(() => {
            this.tokenConsumer.BitwiseAnd()
            this.TSTypeOperand()
        })
    }

    /**
     * [TypeScript] 类型操作数（带可选数组后缀）
     *
     * TSTypeOperand :
     *     TSPrimaryType ([] | [number])*
     *
     * 处理数组类型后缀 T[] 和索引访问类型 T[K]
     */
    @SubhutiRule
    TSTypeOperand() {
        // 解析前缀类型操作符或基础类型
        this.TSPrefixTypeOrPrimary()
        // 可选的数组后缀 [] 或索引访问 [K]
        this.Many(() => {
            this.tokenConsumer.LBracket()
            // 空括号 [] 表示数组类型，否则是索引访问类型
            this.Option(() => this.TSType())
            this.tokenConsumer.RBracket()
        })
    }

    /**
     * [TypeScript] 前缀类型操作符或基础类型
     *
     * TSPrefixTypeOrPrimary :
     *     TSTypeQuery
     *     TSTypeOperator
     *     TSInferType
     *     TSPrimaryType
     */
    @SubhutiRule
    TSPrefixTypeOrPrimary() {
        this.Or([
            // typeof x (类型查询)
            { alt: () => this.TSTypeQuery() },
            // keyof T, readonly T, unique symbol (类型操作符)
            { alt: () => this.TSTypeOperator() },
            // infer R (推断类型，用于条件类型)
            { alt: () => this.TSInferType() },
            // 基础类型
            { alt: () => this.TSPrimaryType() },
        ])
    }

    /**
     * [TypeScript] 基础类型
     *
     * TSPrimaryType :
     *     TSKeywordType
     *     TSLiteralType
     *     TSTypeReference
     *     TSParenthesizedType
     *     TSTypeLiteral
     *     TSTupleType
     *     TSMappedType
     */
    @SubhutiRule
    TSPrimaryType() {
        this.Or([
            // 映射类型 { [K in keyof T]: T[K] }
            { alt: () => this.TSMappedType() },
            // 对象类型字面量 { name: string }
            { alt: () => this.TSTypeLiteral() },
            // 元组类型 [T, U]
            { alt: () => this.TSTupleType() },
            // 基础类型关键字
            { alt: () => this.TSKeywordType() },
            // 字面量类型
            { alt: () => this.TSLiteralType() },
            // 类型引用 (MyType, Array<T>)
            { alt: () => this.TSTypeReference() },
            // 括号类型 (T) - 注意：需要与函数类型区分
            { alt: () => this.TSParenthesizedType() },
        ])
    }

    /**
     * [TypeScript] 关键字类型
     *
     * TSKeywordType :
     *     TSNumberKeyword | TSStringKeyword | TSBooleanKeyword | ...
     */
    @SubhutiRule
    TSKeywordType() {
        this.Or([
            { alt: () => this.TSNumberKeyword() },
            { alt: () => this.TSStringKeyword() },
            { alt: () => this.TSBooleanKeyword() },
            { alt: () => this.TSAnyKeyword() },
            { alt: () => this.TSUnknownKeyword() },
            { alt: () => this.TSVoidKeyword() },
            { alt: () => this.TSNeverKeyword() },
            { alt: () => this.TSNullKeyword() },
            { alt: () => this.TSUndefinedKeyword() },
            { alt: () => this.TSObjectKeyword() },
            { alt: () => this.TSSymbolKeyword() },
            { alt: () => this.TSBigIntKeyword() },
        ])
    }

    // ============================================
    // TypeScript: 基础类型关键字 (Phase 1)
    // ============================================

    /**
     * [TypeScript] number 类型关键字
     */
    @SubhutiRule
    TSNumberKeyword() {
        this.tokenConsumer.TSNumber()
    }

    /**
     * [TypeScript] string 类型关键字
     */
    @SubhutiRule
    TSStringKeyword() {
        this.tokenConsumer.TSString()
    }

    /**
     * [TypeScript] boolean 类型关键字
     */
    @SubhutiRule
    TSBooleanKeyword() {
        this.tokenConsumer.TSBoolean()
    }

    /**
     * [TypeScript] any 类型关键字
     */
    @SubhutiRule
    TSAnyKeyword() {
        this.tokenConsumer.TSAny()
    }

    /**
     * [TypeScript] unknown 类型关键字
     */
    @SubhutiRule
    TSUnknownKeyword() {
        this.tokenConsumer.TSUnknown()
    }

    /**
     * [TypeScript] void 类型关键字
     * 注意：void 在表达式位置是硬关键字，在类型位置是软关键字
     */
    @SubhutiRule
    TSVoidKeyword() {
        // 尝试作为硬关键字消费（表达式位置的 void）
        // 如果失败，尝试作为软关键字消费
        this.Or([
            { alt: () => this.tokenConsumer.Void() },
        ])
    }

    /**
     * [TypeScript] never 类型关键字
     */
    @SubhutiRule
    TSNeverKeyword() {
        this.tokenConsumer.TSNever()
    }

    /**
     * [TypeScript] null 类型关键字
     * 注意：null 是硬关键字
     */
    @SubhutiRule
    TSNullKeyword() {
        this.tokenConsumer.NullLiteral()
    }

    /**
     * [TypeScript] undefined 类型关键字
     */
    @SubhutiRule
    TSUndefinedKeyword() {
        this.tokenConsumer.TSUndefined()
    }

    /**
     * [TypeScript] object 类型关键字
     */
    @SubhutiRule
    TSObjectKeyword() {
        this.tokenConsumer.TSObject()
    }

    /**
     * [TypeScript] symbol 类型关键字
     */
    @SubhutiRule
    TSSymbolKeyword() {
        this.tokenConsumer.TSSymbol()
    }

    /**
     * [TypeScript] bigint 类型关键字
     */
    @SubhutiRule
    TSBigIntKeyword() {
        this.tokenConsumer.TSBigint()
    }

    // ============================================
    // TypeScript: 字面量类型 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 字面量类型
     *
     * TSLiteralType :
     *     StringLiteral
     *     NumericLiteral
     *     BooleanLiteral
     */
    @SubhutiRule
    TSLiteralType() {
        this.Or([
            { alt: () => this.tokenConsumer.StringLiteral() },
            { alt: () => this.tokenConsumer.NumericLiteral() },
            { alt: () => this.tokenConsumer.True() },
            { alt: () => this.tokenConsumer.False() },
        ])
    }

    // ============================================
    // TypeScript: 类型引用 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 类型引用
     *
     * TSTypeReference :
     *     TSTypeName TSTypeArguments_opt
     *
     * TSTypeName :
     *     Identifier
     *     TSQualifiedName
     */
    @SubhutiRule
    TSTypeReference() {
        // 解析类型名称（可能是限定名称 Namespace.Type）
        this.TSTypeName()
        // 可选的类型参数 <T, U>
        this.Option(() => this.TSTypeParameterInstantiation())
        return undefined
    }

    /**
     * [TypeScript] 类型名称
     *
     * TSTypeName :
     *     Identifier
     *     TSQualifiedName
     *
     * TSQualifiedName :
     *     TSTypeName . Identifier
     */
    @SubhutiRule
    TSTypeName() {
        // 首先解析标识符
        this.Identifier()
        // 然后解析可能的限定名称 (.Identifier)*
        this.Many(() => {
            this.tokenConsumer.Dot()
            this.Identifier()
        })
        return undefined
    }

    /**
     * [TypeScript] 类型参数实例化
     *
     * TSTypeParameterInstantiation :
     *     < TSTypeList >
     *
     * TSTypeList :
     *     TSType
     *     TSTypeList , TSType
     */
    @SubhutiRule
    TSTypeParameterInstantiation() {
        this.tokenConsumer.Less()
        // 至少一个类型参数
        this.TSType()
        // 可选的更多类型参数
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSType()
        })
        this.tokenConsumer.Greater()
        return undefined
    }

    // ============================================
    // TypeScript: 括号类型 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 括号类型
     *
     * TSParenthesizedType :
     *     ( TSType )
     */
    @SubhutiRule
    TSParenthesizedType() {
        this.tokenConsumer.LParen()
        this.TSType()
        this.tokenConsumer.RParen()
        return undefined
    }

    // ============================================
    // TypeScript: 元组类型 (Phase 2)
    // ============================================

    /**
     * [TypeScript] 元组类型
     *
     * TSTupleType :
     *     [ TSTupleElementTypes_opt ]
     *
     * TSTupleElementTypes :
     *     TSTupleElementType
     *     TSTupleElementTypes , TSTupleElementType
     */
    @SubhutiRule
    TSTupleType() {
        this.tokenConsumer.LBracket()
        // 可选的元组元素列表
        this.Option(() => {
            this.TSTupleElementType()
            this.Many(() => {
                this.tokenConsumer.Comma()
                this.TSTupleElementType()
            })
        })
        this.tokenConsumer.RBracket()
    }

    /**
     * [TypeScript] 元组元素类型
     *
     * TSTupleElementType :
     *     TSType
     *     TSNamedTupleMember
     *     TSRestType
     *     TSOptionalType
     *
     * TSNamedTupleMember :
     *     Identifier : TSType
     *     Identifier ? : TSType
     *
     * TSRestType :
     *     ... TSType
     *
     * TSOptionalType :
     *     TSType ?
     */
    @SubhutiRule
    TSTupleElementType() {
        this.Or([
            // 剩余元素 ...T
            { alt: () => this.TSRestType() },
            // 命名元组成员 name: T 或 name?: T
            { alt: () => this.TSNamedTupleMember() },
            // 普通类型（可能带可选标记 ?）
            { alt: () => {
                this.TSType()
                // 可选的 ? 标记
                this.Option(() => this.tokenConsumer.Question())
            }},
        ])
    }

    /**
     * [TypeScript] 命名元组成员
     *
     * TSNamedTupleMember :
     *     Identifier ?_opt : TSType
     */
    @SubhutiRule
    TSNamedTupleMember() {
        this.Identifier()
        // 可选标记
        this.Option(() => this.tokenConsumer.Question())
        this.tokenConsumer.Colon()
        this.TSType()
    }

    /**
     * [TypeScript] 剩余类型
     *
     * TSRestType :
     *     ... TSType
     */
    @SubhutiRule
    TSRestType() {
        this.tokenConsumer.Ellipsis()
        this.TSType()
    }

    // ============================================
    // TypeScript: 类型操作符 (Phase 6)
    // ============================================

    /**
     * [TypeScript] 类型查询 (typeof x)
     *
     * TSTypeQuery :
     *     typeof TSEntityName TSTypeParameterInstantiation_opt
     *
     * TSEntityName :
     *     Identifier
     *     TSQualifiedName
     */
    @SubhutiRule
    TSTypeQuery() {
        this.tokenConsumer.Typeof()
        // 解析实体名称（可能是限定名称）
        this.TSTypeName()
        // 可选的类型参数
        this.Option(() => this.TSTypeParameterInstantiation())
    }

    /**
     * [TypeScript] 类型操作符 (keyof, readonly, unique)
     *
     * TSTypeOperator :
     *     keyof TSTypeOperand
     *     readonly TSTypeOperand
     *     unique symbol
     */
    @SubhutiRule
    TSTypeOperator() {
        this.Or([
            // keyof T
            { alt: () => {
                this.tokenConsumer.TSKeyof()
                this.TSTypeOperand()
            }},
            // readonly T
            { alt: () => {
                this.tokenConsumer.TSReadonly()
                this.TSTypeOperand()
            }},
            // unique symbol
            { alt: () => {
                this.tokenConsumer.TSUnique()
                this.TSSymbolKeyword()
            }},
        ])
    }

    /**
     * [TypeScript] 推断类型 (infer R)
     *
     * TSInferType :
     *     infer Identifier (extends TSType)?
     */
    @SubhutiRule
    TSInferType() {
        this.tokenConsumer.TSInfer()
        this.Identifier()
        // 可选的约束
        this.Option(() => {
            this.tokenConsumer.Extends()
            this.TSType()
        })
    }

    /**
     * [TypeScript] 映射类型
     *
     * TSMappedType :
     *     { readonly_modifier_opt [ Identifier in TSType as_clause_opt ] ?_opt : TSType ;_opt }
     *
     * readonly_modifier :
     *     readonly | +readonly | -readonly
     *
     * as_clause :
     *     as TSType
     */
    @SubhutiRule
    TSMappedType() {
        this.tokenConsumer.LBrace()
        // 可选的 readonly 修饰符 (+readonly, -readonly, readonly)
        this.Option(() => {
            this.Or([
                { alt: () => {
                    this.tokenConsumer.Plus()
                    this.tokenConsumer.TSReadonly()
                }},
                { alt: () => {
                    this.tokenConsumer.Minus()
                    this.tokenConsumer.TSReadonly()
                }},
                { alt: () => this.tokenConsumer.TSReadonly() },
            ])
        })
        // 类型参数 [K in keyof T]
        this.tokenConsumer.LBracket()
        this.Identifier()
        this.tokenConsumer.In()
        this.TSType()
        // 可选的 as 子句 (用于键重映射)
        this.Option(() => {
            this.tokenConsumer.As()
            this.TSType()
        })
        this.tokenConsumer.RBracket()
        // 可选的 ? 修饰符 (+?, -?, ?)
        this.Option(() => {
            this.Or([
                { alt: () => {
                    this.tokenConsumer.Plus()
                    this.tokenConsumer.Question()
                }},
                { alt: () => {
                    this.tokenConsumer.Minus()
                    this.tokenConsumer.Question()
                }},
                { alt: () => this.tokenConsumer.Question() },
            ])
        })
        // 冒号和值类型
        this.tokenConsumer.Colon()
        this.TSType()
        // 可选的分号
        this.Option(() => this.tokenConsumer.Semicolon())
        this.tokenConsumer.RBrace()
    }

    // ============================================
    // TypeScript: 对象类型字面量 (Phase 2)
    // ============================================

    /**
     * [TypeScript] 对象类型字面量
     *
     * TSTypeLiteral :
     *     { TSTypeMembers_opt }
     *
     * TSTypeMembers :
     *     TSTypeMember
     *     TSTypeMembers (;|,) TSTypeMember
     */
    @SubhutiRule
    TSTypeLiteral() {
        this.tokenConsumer.LBrace()
        // 可选的类型成员列表
        this.Option(() => {
            this.TSTypeMember()
            this.Many(() => {
                // 成员分隔符：分号或逗号
                this.Or([
                    { alt: () => this.tokenConsumer.Semicolon() },
                    { alt: () => this.tokenConsumer.Comma() },
                ])
                // 可选的下一个成员（允许尾随分隔符）
                this.Option(() => this.TSTypeMember())
            })
        })
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 类型成员
     *
     * TSTypeMember :
     *     TSPropertySignature
     *     TSMethodSignature
     *     TSIndexSignature
     *     TSCallSignatureDeclaration
     *     TSConstructSignatureDeclaration
     */
    @SubhutiRule
    TSTypeMember() {
        this.Or([
            // 索引签名 [key: string]: T
            { alt: () => this.TSIndexSignature() },
            // 调用签名 (x: T): U
            { alt: () => this.TSCallSignatureDeclaration() },
            // 构造签名 new (x: T): U
            { alt: () => this.TSConstructSignatureDeclaration() },
            // 属性签名或方法签名
            { alt: () => this.TSPropertyOrMethodSignature() },
        ])
    }

    /**
     * [TypeScript] 属性或方法签名
     *
     * 由于属性和方法签名的前缀相同（readonly? name ?），
     * 需要在解析完名称后根据后续 token 决定是属性还是方法
     *
     * TSPropertySignature :
     *     readonly_opt PropertyName ?_opt : TSType
     *
     * TSMethodSignature :
     *     readonly_opt PropertyName ?_opt TSTypeParameterDeclaration_opt ( TSParameterList ) : TSType
     */
    @SubhutiRule
    TSPropertyOrMethodSignature() {
        // 可选的 readonly 修饰符
        this.Option(() => this.tokenConsumer.TSReadonly())
        // 属性名
        this.PropertyName()
        // 可选标记
        this.Option(() => this.tokenConsumer.Question())
        // 根据下一个 token 决定是属性还是方法
        this.Or([
            // 方法签名: 有类型参数或参数列表
            { alt: () => {
                // 可选的类型参数
                this.Option(() => this.TSTypeParameterDeclaration())
                // 参数列表
                this.tokenConsumer.LParen()
                this.Option(() => this.TSParameterList())
                this.tokenConsumer.RParen()
                // 可选的返回类型
                this.Option(() => this.TSTypeAnnotation())
            }},
            // 属性签名: 只有类型注解
            { alt: () => {
                this.Option(() => this.TSTypeAnnotation())
            }},
        ])
    }

    /**
     * [TypeScript] 索引签名
     *
     * TSIndexSignature :
     *     readonly_opt [ Identifier : TSType ] : TSType
     */
    @SubhutiRule
    TSIndexSignature() {
        // 可选的 readonly 修饰符
        this.Option(() => this.tokenConsumer.TSReadonly())
        this.tokenConsumer.LBracket()
        this.Identifier()
        this.tokenConsumer.Colon()
        this.TSType()
        this.tokenConsumer.RBracket()
        this.tokenConsumer.Colon()
        this.TSType()
    }

    /**
     * [TypeScript] 调用签名声明
     *
     * TSCallSignatureDeclaration :
     *     TSTypeParameterDeclaration_opt ( TSParameterList_opt ) : TSType
     */
    @SubhutiRule
    TSCallSignatureDeclaration() {
        // 可选的类型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.Option(() => this.TSParameterList())
        this.tokenConsumer.RParen()
        // 可选的返回类型
        this.Option(() => this.TSTypeAnnotation())
    }

    /**
     * [TypeScript] 构造签名声明
     *
     * TSConstructSignatureDeclaration :
     *     new TSTypeParameterDeclaration_opt ( TSParameterList_opt ) : TSType
     */
    @SubhutiRule
    TSConstructSignatureDeclaration() {
        this.tokenConsumer.New()
        // 可选的类型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.Option(() => this.TSParameterList())
        this.tokenConsumer.RParen()
        // 可选的返回类型
        this.Option(() => this.TSTypeAnnotation())
    }

    // ============================================
    // TypeScript: 函数类型 (Phase 2)
    // ============================================

    /**
     * [TypeScript] 函数类型
     *
     * TSFunctionType :
     *     TSTypeParameterDeclaration_opt ( TSParameterList_opt ) => TSType
     *
     * 注意：需要与括号类型 (T) 区分
     * - 函数类型: (x: T) => U, () => T, <T>() => T
     * - 括号类型: (T)
     */
    @SubhutiRule
    TSFunctionType() {
        // 可选的类型参数 <T>
        this.Option(() => this.TSTypeParameterDeclaration())
        // 参数列表
        this.tokenConsumer.LParen()
        this.Option(() => this.TSParameterList())
        this.tokenConsumer.RParen()
        // 箭头和返回类型
        this.tokenConsumer.Arrow()
        this.TSType()
    }

    /**
     * [TypeScript] 构造函数类型
     *
     * TSConstructorType :
     *     new TSTypeParameterDeclaration_opt ( TSParameterList_opt ) => TSType
     */
    @SubhutiRule
    TSConstructorType() {
        this.tokenConsumer.New()
        // 可选的类型参数 <T>
        this.Option(() => this.TSTypeParameterDeclaration())
        // 参数列表
        this.tokenConsumer.LParen()
        this.Option(() => this.TSParameterList())
        this.tokenConsumer.RParen()
        // 箭头和返回类型
        this.tokenConsumer.Arrow()
        this.TSType()
    }

    /**
     * [TypeScript] 参数列表
     *
     * TSParameterList :
     *     TSParameter
     *     TSParameterList , TSParameter
     */
    @SubhutiRule
    TSParameterList() {
        this.TSParameter()
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSParameter()
        })
    }

    /**
     * [TypeScript] 参数
     *
     * TSParameter :
     *     Identifier ?_opt : TSType
     *     ... Identifier : TSType
     */
    @SubhutiRule
    TSParameter() {
        this.Or([
            // 剩余参数 ...args: T[]
            { alt: () => {
                this.tokenConsumer.Ellipsis()
                this.Identifier()
                this.Option(() => this.TSTypeAnnotation())
            }},
            // 普通参数 name?: T
            { alt: () => {
                this.Identifier()
                // 可选标记
                this.Option(() => this.tokenConsumer.Question())
                // 可选的类型注解
                this.Option(() => this.TSTypeAnnotation())
            }},
        ])
    }

    // ============================================
    // TypeScript: 类型参数声明 (Phase 2 - 基础版本)
    // ============================================

    /**
     * [TypeScript] 类型参数声明
     *
     * TSTypeParameterDeclaration :
     *     < TSTypeParameterList >
     *
     * TSTypeParameterList :
     *     TSTypeParameter
     *     TSTypeParameterList , TSTypeParameter
     */
    @SubhutiRule
    TSTypeParameterDeclaration() {
        this.tokenConsumer.Less()
        // 至少一个类型参数
        this.TSTypeParameter()
        // 可选的更多类型参数
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSTypeParameter()
        })
        this.tokenConsumer.Greater()
    }

    /**
     * [TypeScript] 类型参数
     *
     * TSTypeParameter :
     *     Identifier (extends TSType)_opt (= TSType)_opt
     */
    @SubhutiRule
    TSTypeParameter() {
        this.Identifier()
        // 可选的约束 extends T
        this.Option(() => {
            this.tokenConsumer.Extends()
            this.TSType()
        })
        // 可选的默认值 = T
        this.Option(() => {
            this.tokenConsumer.Assign()
            this.TSType()
        })
    }

    // ============================================
    // TypeScript: Phase 3 - 类型注解位置
    // ============================================

    /**
     * [TypeScript] 重写 ArrowFunction 以支持返回类型注解
     *
     * ArrowFunction[In, Yield, Await] :
     *     ArrowParameters[?Yield, ?Await] TSTypeAnnotation_opt [no LineTerminator here] => ConciseBody[?In]
     */
    @SubhutiRule
    override ArrowFunction(params: ExpressionParams = {}) {
        this.ArrowParameters(params)
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.assertNoLineBreak()  // [no LineTerminator here]
        this.tokenConsumer.Arrow()
        this.ConciseBody(params)
    }

    /**
     * [TypeScript] 重写 AsyncArrowFunction 以支持返回类型注解
     *
     * AsyncArrowFunction[In, Yield, Await] :
     *     async [no LineTerminator here] AsyncArrowBindingIdentifier[?Yield] TSTypeAnnotation_opt [no LineTerminator here] => AsyncConciseBody[?In]
     *     CoverCallExpressionAndAsyncArrowHead[?Yield, ?Await] TSTypeAnnotation_opt [no LineTerminator here] => AsyncConciseBody[?In]
     */
    @SubhutiRule
    override AsyncArrowFunction(params: ExpressionParams = {}) {
        this.Or([
            // async [no LineTerminator here] AsyncArrowBindingIdentifier TSTypeAnnotation_opt [no LineTerminator here] => AsyncConciseBody
            {
                alt: () => {
                    this.tokenConsumer.Async()
                    this.assertNoLineBreak()
                    this.AsyncArrowBindingIdentifier(params)
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.assertNoLineBreak()
                    this.tokenConsumer.Arrow()
                    this.AsyncConciseBody(params)
                }
            },
            // CoverCallExpressionAndAsyncArrowHead TSTypeAnnotation_opt [no LineTerminator here] => AsyncConciseBody
            {
                alt: () => {
                    this.CoverCallExpressionAndAsyncArrowHead(params)
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.assertNoLineBreak()
                    this.tokenConsumer.Arrow()
                    this.AsyncConciseBody(params)
                }
            }
        ])
    }

    /**
     * [TypeScript] 重写 MethodDefinition 以支持返回类型注解
     *
     * MethodDefinition[Yield, Await] :
     *     ClassElementName[?Yield, ?Await] ( UniqueFormalParameters[~Yield, ~Await] ) TSTypeAnnotation_opt { FunctionBody[~Yield, ~Await] }
     *     GeneratorMethod[?Yield, ?Await]
     *     AsyncMethod[?Yield, ?Await]
     *     AsyncGeneratorMethod[?Yield, ?Await]
     *     get ClassElementName[?Yield, ?Await] ( ) TSTypeAnnotation_opt { FunctionBody[~Yield, ~Await] }
     *     set ClassElementName[?Yield, ?Await] ( PropertySetParameterList ) { FunctionBody[~Yield, ~Await] }
     */
    @SubhutiRule
    override MethodDefinition(params: ExpressionParams = {}) {
        this.Or([
            // AsyncGeneratorMethod (最具体，必须先匹配)
            { alt: () => this.AsyncGeneratorMethod(params) },
            // AsyncMethod
            { alt: () => this.AsyncMethod(params) },
            // GeneratorMethod
            { alt: () => this.GeneratorMethod(params) },
            // get ClassElementName ( ) TSTypeAnnotation_opt { FunctionBody }
            {
                alt: () => {
                    this.tokenConsumer.Get()
                    this.ClassElementName(params)
                    this.tokenConsumer.LParen()
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.FunctionBody({ Yield: false, Await: false })
                    this.tokenConsumer.RBrace()
                }
            },
            // set ClassElementName ( PropertySetParameterList ) { FunctionBody }
            {
                alt: () => {
                    this.tokenConsumer.Set()
                    this.ClassElementName(params)
                    this.tokenConsumer.LParen()
                    this.PropertySetParameterList()
                    this.tokenConsumer.RParen()
                    this.tokenConsumer.LBrace()
                    this.FunctionBody({ Yield: false, Await: false })
                    this.tokenConsumer.RBrace()
                }
            },
            // ClassElementName ( UniqueFormalParameters ) TSTypeAnnotation_opt { FunctionBody }
            {
                alt: () => {
                    this.ClassElementName(params)
                    this.tokenConsumer.LParen()
                    this.UniqueFormalParameters({ Yield: false, Await: false })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.FunctionBody({ Yield: false, Await: false })
                    this.tokenConsumer.RBrace()
                }
            }
        ])
    }

    /**
     * [TypeScript] 重写 GeneratorMethod 以支持返回类型注解
     *
     * GeneratorMethod[Yield, Await] :
     *     * ClassElementName[?Yield, ?Await] ( UniqueFormalParameters[+Yield, ~Await] ) TSTypeAnnotation_opt { GeneratorBody }
     */
    @SubhutiRule
    override GeneratorMethod(params: ExpressionParams = {}) {
        this.tokenConsumer.Asterisk()
        this.ClassElementName(params)
        this.tokenConsumer.LParen()
        this.UniqueFormalParameters({ Yield: true, Await: false })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.GeneratorBody()
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 AsyncMethod 以支持返回类型注解
     *
     * AsyncMethod[Yield, Await] :
     *     async [no LineTerminator here] ClassElementName[?Yield, ?Await] ( UniqueFormalParameters[~Yield, +Await] ) TSTypeAnnotation_opt { AsyncFunctionBody }
     */
    @SubhutiRule
    override AsyncMethod(params: ExpressionParams = {}) {
        this.tokenConsumer.Async()
        this.assertNoLineBreak()
        this.ClassElementName(params)
        this.tokenConsumer.LParen()
        this.UniqueFormalParameters({ Yield: false, Await: true })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.AsyncFunctionBody()
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 AsyncGeneratorMethod 以支持返回类型注解
     *
     * AsyncGeneratorMethod[Yield, Await] :
     *     async [no LineTerminator here] * ClassElementName[?Yield, ?Await] ( UniqueFormalParameters[+Yield, +Await] ) TSTypeAnnotation_opt { AsyncGeneratorBody }
     */
    @SubhutiRule
    override AsyncGeneratorMethod(params: ExpressionParams = {}) {
        this.tokenConsumer.Async()
        this.assertNoLineBreak()
        this.tokenConsumer.Asterisk()
        this.ClassElementName(params)
        this.tokenConsumer.LParen()
        this.UniqueFormalParameters({ Yield: true, Await: true })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.AsyncGeneratorBody()
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 ClassElement 以支持可见性修饰符
     *
     * ClassElement[Yield, Await] :
     *     TSAccessibilityModifier_opt MethodDefinition[?Yield, ?Await]
     *     TSAccessibilityModifier_opt static MethodDefinition[?Yield, ?Await]
     *     TSAccessibilityModifier_opt FieldDefinition[?Yield, ?Await] ;
     *     TSAccessibilityModifier_opt static FieldDefinition[?Yield, ?Await] ;
     *     ClassStaticBlock
     *     ;
     *
     * TSAccessibilityModifier :
     *     public | private | protected | readonly
     */
    @SubhutiRule
    override ClassElement(params: ExpressionParams = {}) {
        this.Or([
            // MethodDefinition (可能带修饰符)
            {
                alt: () => {
                    // [TypeScript] 可选的可见性修饰符
                    this.Many(() => this.TSAccessibilityModifier())
                    this.MethodDefinition(params)
                }
            },
            // static MethodDefinition (可能带修饰符)
            {
                alt: () => {
                    // [TypeScript] 可选的可见性修饰符
                    this.Many(() => this.TSAccessibilityModifier())
                    this.tokenConsumer.Static()
                    this.MethodDefinition(params)
                }
            },
            // FieldDefinition ; (可能带修饰符)
            {
                alt: () => {
                    // [TypeScript] 可选的可见性修饰符
                    this.Many(() => this.TSAccessibilityModifier())
                    this.FieldDefinition(params)
                    this.SemicolonASI()
                }
            },
            // static FieldDefinition ; (可能带修饰符)
            {
                alt: () => {
                    // [TypeScript] 可选的可见性修饰符
                    this.Many(() => this.TSAccessibilityModifier())
                    this.tokenConsumer.Static()
                    this.FieldDefinition(params)
                    this.SemicolonASI()
                }
            },
            // ClassStaticBlock
            { alt: () => this.ClassStaticBlock() },
            // ;
            { alt: () => this.tokenConsumer.Semicolon() }
        ])
    }

    /**
     * [TypeScript] 可见性修饰符
     *
     * TSAccessibilityModifier :
     *     public | private | protected | readonly
     */
    @SubhutiRule
    TSAccessibilityModifier() {
        this.Or([
            { alt: () => this.tokenConsumer.TSPublic() },
            { alt: () => this.tokenConsumer.TSPrivate() },
            { alt: () => this.tokenConsumer.TSProtected() },
            { alt: () => this.tokenConsumer.TSReadonly() },
        ])
    }

    /**
     * [TypeScript] 重写 FieldDefinition 以支持类型注解
     *
     * FieldDefinition[Yield, Await] :
     *     ClassElementName[?Yield, ?Await] TSTypeAnnotation_opt Initializer[+In, ?Yield, ?Await]_opt
     */
    @SubhutiRule
    override FieldDefinition(params: ExpressionParams = {}) {
        this.ClassElementName(params)
        // [TypeScript] 可选的类型注解
        this.Option(() => this.TSTypeAnnotation())
        // Initializer 中的 await/yield 不能作为表达式使用，只能作为标识符
        this.Option(() => this.Initializer({ ...params, In: true, Yield: false, Await: false }))
    }

    // ============================================
    // TypeScript: Phase 4 - 类型声明
    // ============================================

    /**
     * [TypeScript] 重写 Declaration 以支持 TypeScript 声明
     *
     * Declaration[Yield, Await] :
     *     HoistableDeclaration[?Yield, ?Await, ~Default]
     *     ClassDeclaration[?Yield, ?Await, ~Default]
     *     LexicalDeclaration[+In, ?Yield, ?Await]
     *     [TypeScript] TSInterfaceDeclaration
     *     [TypeScript] TSTypeAliasDeclaration
     *     [TypeScript] TSEnumDeclaration
     *     [TypeScript] TSModuleDeclaration
     *     [TypeScript] TSDeclareStatement
     */
    @SubhutiRule
    override Declaration(params: DeclarationParams = {}) {
        this.Or([
            // TypeScript 声明（必须在 JavaScript 声明之前，因为 interface/type/enum 是软关键字）
            { alt: () => this.TSDeclareStatement() },
            { alt: () => this.TSModuleDeclaration() },
            { alt: () => this.TSInterfaceDeclaration() },
            { alt: () => this.TSTypeAliasDeclaration() },
            { alt: () => this.TSEnumDeclaration() },
            // JavaScript 声明
            { alt: () => this.HoistableDeclaration({ ...params, Default: false }) },
            { alt: () => this.ClassDeclaration({ ...params, Default: false }) },
            { alt: () => this.LexicalDeclaration({ ...params, In: true }) }
        ])
    }

    /**
     * [TypeScript] 接口声明
     *
     * TSInterfaceDeclaration :
     *     interface Identifier TSTypeParameterDeclaration_opt TSInterfaceExtends_opt TSInterfaceBody
     *
     * TSInterfaceExtends :
     *     extends TSExpressionWithTypeArguments (, TSExpressionWithTypeArguments)*
     *
     * TSInterfaceBody :
     *     { TSTypeMembers_opt }
     */
    @SubhutiRule
    TSInterfaceDeclaration() {
        this.tokenConsumer.TSInterface()
        this.Identifier()
        // 可选的类型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        // 可选的 extends 子句
        this.Option(() => this.TSInterfaceExtends())
        // 接口体
        this.TSInterfaceBody()
    }

    /**
     * [TypeScript] 接口继承子句
     *
     * TSInterfaceExtends :
     *     extends TSExpressionWithTypeArguments (, TSExpressionWithTypeArguments)*
     */
    @SubhutiRule
    TSInterfaceExtends() {
        this.tokenConsumer.Extends()
        // 至少一个父接口
        this.TSExpressionWithTypeArguments()
        // 可选的更多父接口
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSExpressionWithTypeArguments()
        })
    }

    /**
     * [TypeScript] 带类型参数的表达式
     *
     * TSExpressionWithTypeArguments :
     *     TSTypeName TSTypeParameterInstantiation_opt
     */
    @SubhutiRule
    TSExpressionWithTypeArguments() {
        this.TSTypeName()
        this.Option(() => this.TSTypeParameterInstantiation())
    }

    /**
     * [TypeScript] 接口体
     *
     * TSInterfaceBody :
     *     { TSTypeMembers_opt }
     */
    @SubhutiRule
    TSInterfaceBody() {
        this.tokenConsumer.LBrace()
        // 可选的类型成员列表（复用 TSTypeLiteral 的成员解析逻辑）
        this.Option(() => {
            this.TSTypeMember()
            this.Many(() => {
                // 成员分隔符：分号或逗号
                this.Or([
                    { alt: () => this.tokenConsumer.Semicolon() },
                    { alt: () => this.tokenConsumer.Comma() },
                ])
                // 可选的下一个成员（允许尾随分隔符）
                this.Option(() => this.TSTypeMember())
            })
        })
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 类型别名声明
     *
     * TSTypeAliasDeclaration :
     *     type Identifier TSTypeParameterDeclaration_opt = TSType ;_opt
     */
    @SubhutiRule
    TSTypeAliasDeclaration() {
        this.tokenConsumer.TSType()
        this.Identifier()
        // 可选的类型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.Assign()
        this.TSType()
        // 可选的分号
        this.Option(() => this.tokenConsumer.Semicolon())
    }

    /**
     * [TypeScript] 枚举声明
     *
     * TSEnumDeclaration :
     *     const_opt enum Identifier { TSEnumMembers_opt }
     *
     * TSEnumMembers :
     *     TSEnumMember
     *     TSEnumMembers , TSEnumMember
     *     TSEnumMembers ,
     */
    @SubhutiRule
    TSEnumDeclaration() {
        // 可选的 const 修饰符
        this.Option(() => this.tokenConsumer.Const())
        this.tokenConsumer.Enum()
        this.Identifier()
        this.tokenConsumer.LBrace()
        // 可选的枚举成员列表
        this.Option(() => {
            this.TSEnumMember()
            this.Many(() => {
                this.tokenConsumer.Comma()
                // 可选的下一个成员（允许尾随逗号）
                this.Option(() => this.TSEnumMember())
            })
        })
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 枚举成员
     *
     * TSEnumMember :
     *     PropertyName (= AssignmentExpression)?
     */
    @SubhutiRule
    TSEnumMember() {
        // 枚举成员名（可以是标识符或字符串字面量）
        this.Or([
            { alt: () => this.Identifier() },
            { alt: () => this.tokenConsumer.StringLiteral() },
        ])
        // 可选的初始化器
        this.Option(() => {
            this.tokenConsumer.Assign()
            this.AssignmentExpression({ In: true, Yield: false, Await: false })
        })
    }

    // ============================================
    // TypeScript: Phase 5 - 泛型支持
    // ============================================

    /**
     * [TypeScript] 重写 FunctionDeclaration 以支持泛型参数
     *
     * FunctionDeclaration[Yield, Await, Default] :
     *     function BindingIdentifier[?Yield, ?Await] TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, ~Await] ) TSTypeAnnotation_opt { FunctionBody[~Yield, ~Await] }
     *     [+Default] function TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, ~Await] ) TSTypeAnnotation_opt { FunctionBody[~Yield, ~Await] }
     */
    @SubhutiRule
    override FunctionDeclaration(params: DeclarationParams = {}) {
        const { Default = false } = params

        this.Or([
            // function BindingIdentifier<T>( FormalParameters ) TSTypeAnnotation_opt { FunctionBody }
            {
                alt: () => {
                    this.tokenConsumer.Function()
                    this.BindingIdentifier(params)
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: false, Await: false })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.FunctionBody({ Yield: false, Await: false })
                    this.tokenConsumer.RBrace()
                }
            },
            // [+Default] function<T>( FormalParameters ) TSTypeAnnotation_opt { FunctionBody }
            ...(Default ? [{
                alt: () => {
                    this.tokenConsumer.Function()
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: false, Await: false })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.FunctionBody({ Yield: false, Await: false })
                    this.tokenConsumer.RBrace()
                }
            }] : [])
        ])
    }

    /**
     * [TypeScript] 重写 FunctionExpression 以支持泛型参数
     *
     * FunctionExpression :
     *     function BindingIdentifier[~Yield, ~Await]_opt TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, ~Await] ) TSTypeAnnotation_opt { FunctionBody[~Yield, ~Await] }
     */
    @SubhutiRule
    override FunctionExpression() {
        this.tokenConsumer.Function()
        this.Option(() => this.BindingIdentifier({ Yield: false, Await: false }))
        // [TypeScript] 可选的泛型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.FormalParameters({ Yield: false, Await: false })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.FunctionBody({ Yield: false, Await: false })
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 ClassDeclaration 以支持泛型参数和 implements
     *
     * ClassDeclaration[Yield, Await, Default] :
     *     class BindingIdentifier[?Yield, ?Await] TSTypeParameterDeclaration_opt ClassTail[?Yield, ?Await]
     *     [+Default] class TSTypeParameterDeclaration_opt ClassTail[?Yield, ?Await]
     */
    @SubhutiRule
    override ClassDeclaration(params: DeclarationParams = {}) {
        const { Default = false } = params

        this.Or([
            // class BindingIdentifier<T> ClassTail
            {
                alt: () => {
                    this.tokenConsumer.Class()
                    this.BindingIdentifier(params)
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.ClassTail(params)
                }
            },
            // [+Default] class<T> ClassTail
            ...(Default ? [{
                alt: () => {
                    this.tokenConsumer.Class()
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.ClassTail(params)
                }
            }] : [])
        ])
    }

    /**
     * [TypeScript] 重写 ClassExpression 以支持泛型参数
     *
     * ClassExpression[Yield, Await] :
     *     class BindingIdentifier[?Yield, ?Await]_opt TSTypeParameterDeclaration_opt ClassTail[?Yield, ?Await]
     */
    @SubhutiRule
    override ClassExpression(params: ExpressionParams = {}) {
        this.tokenConsumer.Class()
        this.Option(() => this.BindingIdentifier(params))
        // [TypeScript] 可选的泛型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.ClassTail(params)
    }

    /**
     * [TypeScript] 重写 ClassTail 以支持 implements
     *
     * ClassTail[Yield, Await] :
     *     ClassHeritage_opt TSClassImplements_opt { ClassBody[?Yield, ?Await]_opt }
     */
    @SubhutiRule
    override ClassTail(params: ExpressionParams = {}) {
        // 可选的 extends 子句（使用重写的 ClassHeritage）
        this.Option(() => this.ClassHeritage(params))
        // [TypeScript] 可选的 implements 子句
        this.Option(() => this.TSClassImplements())
        this.tokenConsumer.LBrace()
        this.Option(() => this.ClassBody(params))
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 ClassHeritage 以支持类型参数
     *
     * ClassHeritage[Yield, Await] :
     *     extends LeftHandSideExpression[?Yield, ?Await] TSTypeParameterInstantiation_opt
     */
    @SubhutiRule
    override ClassHeritage(params: ExpressionParams = {}) {
        this.tokenConsumer.Extends()
        this.LeftHandSideExpression(params)
        // [TypeScript] 可选的类型参数
        this.Option(() => this.TSTypeParameterInstantiation())
    }

    /**
     * [TypeScript] 类实现子句
     *
     * TSClassImplements :
     *     implements TSExpressionWithTypeArguments (, TSExpressionWithTypeArguments)*
     * 
     * 注意：这是 TypeScript 特有的语法，JavaScript 没有 implements，
     * 所以这里使用新规则而不是 override
     */
    @SubhutiRule
    TSClassImplements() {
        this.tokenConsumer.TSImplements()
        // 至少一个接口
        this.TSExpressionWithTypeArguments()
        // 可选的更多接口
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSExpressionWithTypeArguments()
        })
    }

    /**
     * [TypeScript] 重写 GeneratorDeclaration 以支持泛型参数
     *
     * GeneratorDeclaration[Yield, Await, Default] :
     *     function * BindingIdentifier[?Yield, ?Await] TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, ~Await] ) TSTypeAnnotation_opt { GeneratorBody }
     *     [+Default] function * TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, ~Await] ) TSTypeAnnotation_opt { GeneratorBody }
     */
    @SubhutiRule
    override GeneratorDeclaration(params: DeclarationParams = {}) {
        const { Default = false } = params

        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.Function()
                    this.tokenConsumer.Asterisk()
                    this.BindingIdentifier(params)
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: true, Await: false })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.GeneratorBody()
                    this.tokenConsumer.RBrace()
                }
            },
            ...(Default ? [{
                alt: () => {
                    this.tokenConsumer.Function()
                    this.tokenConsumer.Asterisk()
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: true, Await: false })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.GeneratorBody()
                    this.tokenConsumer.RBrace()
                }
            }] : [])
        ])
    }

    /**
     * [TypeScript] 重写 GeneratorExpression 以支持泛型参数
     *
     * GeneratorExpression :
     *     function * BindingIdentifier[+Yield, ~Await]_opt TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, ~Await] ) TSTypeAnnotation_opt { GeneratorBody }
     */
    @SubhutiRule
    override GeneratorExpression() {
        this.tokenConsumer.Function()
        this.tokenConsumer.Asterisk()
        this.Option(() => this.BindingIdentifier({ Yield: true, Await: false }))
        // [TypeScript] 可选的泛型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.FormalParameters({ Yield: true, Await: false })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.GeneratorBody()
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 AsyncFunctionDeclaration 以支持泛型参数
     *
     * AsyncFunctionDeclaration[Yield, Await, Default] :
     *     async [no LineTerminator here] function BindingIdentifier[?Yield, ?Await] TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, +Await] ) TSTypeAnnotation_opt { AsyncFunctionBody }
     *     [+Default] async [no LineTerminator here] function TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, +Await] ) TSTypeAnnotation_opt { AsyncFunctionBody }
     */
    @SubhutiRule
    override AsyncFunctionDeclaration(params: DeclarationParams = {}) {
        const { Default = false } = params

        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.Async()
                    this.assertNoLineBreak()
                    this.tokenConsumer.Function()
                    this.BindingIdentifier(params)
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: false, Await: true })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.AsyncFunctionBody()
                    this.tokenConsumer.RBrace()
                }
            },
            ...(Default ? [{
                alt: () => {
                    this.tokenConsumer.Async()
                    this.assertNoLineBreak()
                    this.tokenConsumer.Function()
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: false, Await: true })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.AsyncFunctionBody()
                    this.tokenConsumer.RBrace()
                }
            }] : [])
        ])
    }

    /**
     * [TypeScript] 重写 AsyncFunctionExpression 以支持泛型参数
     *
     * AsyncFunctionExpression :
     *     async [no LineTerminator here] function BindingIdentifier[~Yield, +Await]_opt TSTypeParameterDeclaration_opt ( FormalParameters[~Yield, +Await] ) TSTypeAnnotation_opt { AsyncFunctionBody }
     */
    @SubhutiRule
    override AsyncFunctionExpression() {
        this.tokenConsumer.Async()
        this.assertNoLineBreak()  // [no LineTerminator here]
        this.tokenConsumer.Function()
        this.Option(() => this.BindingIdentifier({ Yield: false, Await: true }))
        // [TypeScript] 可选的泛型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.FormalParameters({ Yield: false, Await: true })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.AsyncFunctionBody()
        this.tokenConsumer.RBrace()
    }

    /**
     * [TypeScript] 重写 AsyncGeneratorDeclaration 以支持泛型参数
     *
     * AsyncGeneratorDeclaration[Yield, Await, Default] :
     *     async [no LineTerminator here] function * BindingIdentifier[?Yield, ?Await] TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, +Await] ) TSTypeAnnotation_opt { AsyncGeneratorBody }
     *     [+Default] async [no LineTerminator here] function * TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, +Await] ) TSTypeAnnotation_opt { AsyncGeneratorBody }
     */
    @SubhutiRule
    override AsyncGeneratorDeclaration(params: DeclarationParams = {}) {
        const { Default = false } = params

        this.Or([
            {
                alt: () => {
                    this.tokenConsumer.Async()
                    this.assertNoLineBreak()
                    this.tokenConsumer.Function()
                    this.tokenConsumer.Asterisk()
                    this.BindingIdentifier(params)
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: true, Await: true })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.AsyncGeneratorBody()
                    this.tokenConsumer.RBrace()
                }
            },
            ...(Default ? [{
                alt: () => {
                    this.tokenConsumer.Async()
                    this.assertNoLineBreak()
                    this.tokenConsumer.Function()
                    this.tokenConsumer.Asterisk()
                    // [TypeScript] 可选的泛型参数
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: true, Await: true })
                    this.tokenConsumer.RParen()
                    // [TypeScript] 可选的返回类型注解
                    this.Option(() => this.TSTypeAnnotation())
                    this.tokenConsumer.LBrace()
                    this.AsyncGeneratorBody()
                    this.tokenConsumer.RBrace()
                }
            }] : [])
        ])
    }

    /**
     * [TypeScript] 重写 AsyncGeneratorExpression 以支持泛型参数
     *
     * AsyncGeneratorExpression :
     *     async [no LineTerminator here] function * BindingIdentifier[+Yield, +Await]_opt TSTypeParameterDeclaration_opt ( FormalParameters[+Yield, +Await] ) TSTypeAnnotation_opt { AsyncGeneratorBody }
     */
    @SubhutiRule
    override AsyncGeneratorExpression() {
        this.tokenConsumer.Async()
        this.assertNoLineBreak()
        this.tokenConsumer.Function()
        this.tokenConsumer.Asterisk()
        this.Option(() => this.BindingIdentifier({ Yield: true, Await: true }))
        // [TypeScript] 可选的泛型参数
        this.Option(() => this.TSTypeParameterDeclaration())
        this.tokenConsumer.LParen()
        this.FormalParameters({ Yield: true, Await: true })
        this.tokenConsumer.RParen()
        // [TypeScript] 可选的返回类型注解
        this.Option(() => this.TSTypeAnnotation())
        this.tokenConsumer.LBrace()
        this.AsyncGeneratorBody()
        this.tokenConsumer.RBrace()
    }

    // ============================================
    // TypeScript: Phase 2 - 类型断言和表达式扩展
    // ============================================

    /**
     * [TypeScript] 重写 UpdateExpression 以支持 as/satisfies/非空断言
     *
     * UpdateExpression[Yield, Await] :
     *     LeftHandSideExpression[?Yield, ?Await]
     *     LeftHandSideExpression[?Yield, ?Await] [no LineTerminator here] ++
     *     LeftHandSideExpression[?Yield, ?Await] [no LineTerminator here] --
     *     ++ UnaryExpression[?Yield, ?Await]
     *     -- UnaryExpression[?Yield, ?Await]
     *
     * [TypeScript 扩展]:
     *     UpdateExpression as TSType
     *     UpdateExpression satisfies TSType
     *     UpdateExpression !
     */
    @SubhutiRule
    override UpdateExpression(params: ExpressionParams = {}) {
        this.Or([
            // LeftHandSideExpression [no LineTerminator here] ++
            {
                alt: () => {
                    this.LeftHandSideExpression(params)
                    this.assertNoLineBreak()
                    this.tokenConsumer.Increment()
                }
            },
            // LeftHandSideExpression [no LineTerminator here] --
            {
                alt: () => {
                    this.LeftHandSideExpression(params)
                    this.assertNoLineBreak()
                    this.tokenConsumer.Decrement()
                }
            },
            // ++ UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Increment()
                    this.UnaryExpression(params)
                }
            },
            // -- UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Decrement()
                    this.UnaryExpression(params)
                }
            },
            // [TypeScript] LeftHandSideExpression as TSType
            {
                alt: () => {
                    this.LeftHandSideExpression(params)
                    this.TSAsExpressionTail()
                }
            },
            // [TypeScript] LeftHandSideExpression satisfies TSType
            {
                alt: () => {
                    this.LeftHandSideExpression(params)
                    this.TSSatisfiesExpressionTail()
                }
            },
            // [TypeScript] LeftHandSideExpression !
            {
                alt: () => {
                    this.LeftHandSideExpression(params)
                    this.TSNonNullExpressionTail()
                }
            },
            // LeftHandSideExpression (基础情况)
            { alt: () => this.LeftHandSideExpression(params) }
        ])
    }

    /**
     * [TypeScript] as 表达式尾部
     * TSAsExpressionTail : as TSType
     */
    @SubhutiRule
    TSAsExpressionTail() {
        this.tokenConsumer.As()
        this.TSType()
    }

    /**
     * [TypeScript] satisfies 表达式尾部
     * TSSatisfiesExpressionTail : satisfies TSType
     */
    @SubhutiRule
    TSSatisfiesExpressionTail() {
        this.tokenConsumer.TSSatisfies()
        this.TSType()
    }

    /**
     * [TypeScript] 非空断言尾部
     * TSNonNullExpressionTail : !
     */
    @SubhutiRule
    TSNonNullExpressionTail() {
        this.tokenConsumer.LogicalNot()
    }

    /**
     * [TypeScript] 重写 UnaryExpression 以支持尖括号类型断言
     *
     * UnaryExpression[Yield, Await] :
     *     UpdateExpression[?Yield, ?Await]
     *     delete UnaryExpression[?Yield, ?Await]
     *     void UnaryExpression[?Yield, ?Await]
     *     typeof UnaryExpression[?Yield, ?Await]
     *     + UnaryExpression[?Yield, ?Await]
     *     - UnaryExpression[?Yield, ?Await]
     *     ~ UnaryExpression[?Yield, ?Await]
     *     ! UnaryExpression[?Yield, ?Await]
     *     [+Await] AwaitExpression[?Yield]
     *
     * [TypeScript 扩展]:
     *     < TSType > UnaryExpression  (尖括号类型断言)
     */
    @SubhutiRule
    override UnaryExpression(params: ExpressionParams = {}) {
        const { Await = false } = params

        this.Or([
            // [TypeScript] 尖括号类型断言 <Type>expr
            { alt: () => this.TSTypeAssertion(params) },
            // UpdateExpression (基础情况，必须在前面)
            { alt: () => this.UpdateExpression(params) },
            // delete UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Delete()
                    this.UnaryExpression(params)
                }
            },
            // void UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Void()
                    this.UnaryExpression(params)
                }
            },
            // typeof UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Typeof()
                    this.UnaryExpression(params)
                }
            },
            // + UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Plus()
                    this.UnaryExpression(params)
                }
            },
            // - UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.Minus()
                    this.UnaryExpression(params)
                }
            },
            // ~ UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.BitwiseNot()
                    this.UnaryExpression(params)
                }
            },
            // ! UnaryExpression
            {
                alt: () => {
                    this.tokenConsumer.LogicalNot()
                    this.UnaryExpression(params)
                }
            },
            // [+Await] AwaitExpression
            ...(Await ? [{ alt: () => this.AwaitExpression(params) }] : []),
        ])
    }

    /**
     * [TypeScript] 尖括号类型断言 <Type>expression
     * 
     * TSTypeAssertion :
     *     < TSType > UnaryExpression
     * 
     * 注意：这与泛型调用 foo<T>() 有歧义，需要在 PrimaryExpression 中处理
     */
    @SubhutiRule
    TSTypeAssertion(params: ExpressionParams = {}) {
        this.tokenConsumer.Less()
        this.TSType()
        this.tokenConsumer.Greater()
        this.UnaryExpression(params)
    }

    /**
     * [TypeScript] 类型谓词（用于函数返回类型）
     *
     * TSTypePredicate :
     *     Identifier is TSType
     *     this is TSType
     *     asserts Identifier
     *     asserts Identifier is TSType
     *     asserts this
     *     asserts this is TSType
     */
    @SubhutiRule
    TSTypePredicate() {
        this.Or([
            // asserts Identifier is TSType
            // asserts Identifier
            // asserts this is TSType
            // asserts this
            {
                alt: () => {
                    this.tokenConsumer.TSAsserts()
                    this.Or([
                        { alt: () => this.tokenConsumer.This() },
                        { alt: () => this.Identifier() }
                    ])
                    // 可选的 is TSType
                    this.Option(() => {
                        this.tokenConsumer.TSIs()
                        this.TSType()
                    })
                }
            },
            // Identifier is TSType
            // this is TSType
            {
                alt: () => {
                    this.Or([
                        { alt: () => this.tokenConsumer.This() },
                        { alt: () => this.Identifier() }
                    ])
                    this.tokenConsumer.TSIs()
                    this.TSType()
                }
            }
        ])
    }

    // ============================================
    // TypeScript: Phase 7 - 模块和命名空间
    // ============================================

    /**
     * [TypeScript] 重写 ImportDeclaration 以支持 import type
     *
     * ImportDeclaration :
     *     import ImportClause FromClause WithClause_opt ;
     *     import ModuleSpecifier WithClause_opt ;
     *     [TypeScript] import type ImportClause FromClause ;
     *     [TypeScript] import type * as Identifier FromClause ;
     */
    @SubhutiRule
    override ImportDeclaration() {
        this.Or([
            // [TypeScript] import type ImportClause FromClause ;
            {
                alt: () => {
                    this.tokenConsumer.Import()
                    this.tokenConsumer.TSType()
                    this.ImportClause()
                    this.FromClause()
                    this.SemicolonASI()
                }
            },
            // import ImportClause FromClause WithClause_opt ;
            {
                alt: () => {
                    this.tokenConsumer.Import()
                    this.ImportClause()
                    this.FromClause()
                    this.Option(() => this.WithClause())
                    this.SemicolonASI()
                }
            },
            // import ModuleSpecifier WithClause_opt ;
            {
                alt: () => {
                    this.tokenConsumer.Import()
                    this.ModuleSpecifier()
                    this.Option(() => this.WithClause())
                    this.SemicolonASI()
                }
            }
        ])
    }

    /**
     * [TypeScript] 重写 ImportSpecifier 以支持内联类型导入
     *
     * ImportSpecifier :
     *     ImportedBinding
     *     ModuleExportName as ImportedBinding
     *     [TypeScript] type ImportedBinding
     *     [TypeScript] type ModuleExportName as ImportedBinding
     */
    @SubhutiRule
    override ImportSpecifier() {
        this.Or([
            // [TypeScript] type ModuleExportName as ImportedBinding
            {
                alt: () => {
                    this.tokenConsumer.TSType()
                    this.ModuleExportName()
                    this.tokenConsumer.As()
                    this.ImportedBinding()
                }
            },
            // [TypeScript] type ImportedBinding
            {
                alt: () => {
                    this.tokenConsumer.TSType()
                    this.ImportedBinding()
                }
            },
            // ModuleExportName as ImportedBinding
            {
                alt: () => {
                    this.ModuleExportName()
                    this.tokenConsumer.As()
                    this.ImportedBinding()
                }
            },
            // ImportedBinding
            { alt: () => this.ImportedBinding() }
        ])
    }

    /**
     * [TypeScript] 重写 ExportDeclaration 以支持 export type
     *
     * ExportDeclaration :
     *     export ExportFromClause FromClause WithClause_opt ;
     *     export NamedExports ;
     *     export VariableStatement[~Yield, +Await]
     *     export Declaration[~Yield, +Await]
     *     export default HoistableDeclaration[~Yield, +Await, +Default]
     *     export default ClassDeclaration[~Yield, +Await, +Default]
     *     export default AssignmentExpression[+In, ~Yield, +Await] ;
     *     [TypeScript] export type NamedExports ;
     *     [TypeScript] export type NamedExports FromClause ;
     */
    @SubhutiRule
    override ExportDeclaration() {
        this.Or([
            // [TypeScript] export type NamedExports FromClause ;
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.tokenConsumer.TSType()
                    this.NamedExports()
                    this.FromClause()
                    this.SemicolonASI()
                }
            },
            // [TypeScript] export type NamedExports ;
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.tokenConsumer.TSType()
                    this.NamedExports()
                    this.SemicolonASI()
                }
            },
            // export ExportFromClause FromClause WithClause_opt ;
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.ExportFromClause()
                    this.FromClause()
                    this.Option(() => this.WithClause())
                    this.SemicolonASI()
                }
            },
            // export NamedExports ;
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.NamedExports()
                    this.SemicolonASI()
                }
            },
            // export VariableStatement[~Yield, +Await]
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.VariableStatement({ Yield: false, Await: true })
                }
            },
            // export Declaration[~Yield, +Await]
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.Declaration({ Yield: false, Await: true })
                }
            },
            // export default HoistableDeclaration[~Yield, +Await, +Default]
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.tokenConsumer.Default()
                    this.HoistableDeclaration({ Yield: false, Await: true, Default: true })
                }
            },
            // export default ClassDeclaration[~Yield, +Await, +Default]
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.tokenConsumer.Default()
                    this.ClassDeclaration({ Yield: false, Await: true, Default: true })
                }
            },
            // export default AssignmentExpression[+In, ~Yield, +Await] ;
            {
                alt: () => {
                    this.tokenConsumer.Export()
                    this.tokenConsumer.Default()
                    this.AssignmentExpression({ In: true, Yield: false, Await: true })
                    this.SemicolonASI()
                }
            }
        ])
    }

    /**
     * [TypeScript] 命名空间声明
     *
     * TSModuleDeclaration :
     *     namespace TSModuleIdentifier { TSModuleBlock }
     *     module TSModuleIdentifier { TSModuleBlock }
     *     module StringLiteral { TSModuleBlock }
     *
     * TSModuleIdentifier :
     *     Identifier
     *     Identifier . TSModuleIdentifier
     */
    @SubhutiRule
    TSModuleDeclaration() {
        this.Or([
            // namespace Identifier.Identifier... { }
            {
                alt: () => {
                    this.tokenConsumer.TSNamespace()
                    this.TSModuleIdentifier()
                    this.tokenConsumer.LBrace()
                    this.Option(() => this.TSModuleBlock())
                    this.tokenConsumer.RBrace()
                }
            },
            // module Identifier.Identifier... { }
            {
                alt: () => {
                    this.tokenConsumer.TSModule()
                    this.TSModuleIdentifier()
                    this.tokenConsumer.LBrace()
                    this.Option(() => this.TSModuleBlock())
                    this.tokenConsumer.RBrace()
                }
            },
            // module "string" { }
            {
                alt: () => {
                    this.tokenConsumer.TSModule()
                    this.tokenConsumer.StringLiteral()
                    this.tokenConsumer.LBrace()
                    this.Option(() => this.TSModuleBlock())
                    this.tokenConsumer.RBrace()
                }
            }
        ])
    }

    /**
     * [TypeScript] 模块标识符（支持点分隔的嵌套命名空间）
     *
     * TSModuleIdentifier :
     *     Identifier
     *     Identifier . TSModuleIdentifier
     */
    @SubhutiRule
    TSModuleIdentifier() {
        this.Identifier()
        this.Many(() => {
            this.tokenConsumer.Dot()
            this.Identifier()
        })
    }

    /**
     * [TypeScript] 模块块（命名空间体）
     *
     * TSModuleBlock :
     *     ModuleItem*
     */
    @SubhutiRule
    TSModuleBlock() {
        this.Many(() => this.ModuleItem())
    }

    /**
     * [TypeScript] declare 语句
     *
     * TSDeclareStatement :
     *     declare const BindingIdentifier TSTypeAnnotation ;
     *     declare let BindingIdentifier TSTypeAnnotation ;
     *     declare var BindingIdentifier TSTypeAnnotation ;
     *     declare function Identifier ( ) TSTypeAnnotation_opt ;
     *     declare class Identifier { }
     *     declare TSModuleDeclaration
     *     declare global { }
     */
    @SubhutiRule
    TSDeclareStatement() {
        this.tokenConsumer.TSDeclare()
        this.Or([
            // declare const/let/var BindingIdentifier TSTypeAnnotation ;
            {
                alt: () => {
                    this.Or([
                        { alt: () => this.tokenConsumer.Const() },
                        { alt: () => this.tokenConsumer.Let() },
                        { alt: () => this.tokenConsumer.Var() }
                    ])
                    this.BindingIdentifier({ Yield: false, Await: false })
                    this.Option(() => this.TSTypeAnnotation())
                    this.SemicolonASI()
                }
            },
            // declare function Identifier TSTypeParameterDeclaration_opt ( FormalParameters ) TSTypeAnnotation_opt ;
            {
                alt: () => {
                    this.tokenConsumer.Function()
                    this.Identifier()
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.tokenConsumer.LParen()
                    this.FormalParameters({ Yield: false, Await: false })
                    this.tokenConsumer.RParen()
                    this.Option(() => this.TSTypeAnnotation())
                    this.SemicolonASI()
                }
            },
            // declare class Identifier TSTypeParameterDeclaration_opt ClassTail
            {
                alt: () => {
                    this.tokenConsumer.Class()
                    this.Identifier()
                    this.Option(() => this.TSTypeParameterDeclaration())
                    this.ClassTail({ Yield: false, Await: false })
                }
            },
            // declare namespace/module
            { alt: () => this.TSModuleDeclaration() },
            // declare global { }
            {
                alt: () => {
                    this.tokenConsumer.TSGlobal()
                    this.tokenConsumer.LBrace()
                    this.Option(() => this.TSModuleBlock())
                    this.tokenConsumer.RBrace()
                }
            }
        ])
    }
}
