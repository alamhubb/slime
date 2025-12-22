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
import SlimeJavascriptParser, { type ExpressionParams } from "./deprecated/SlimeJavascriptParser.ts";
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
     *     TSUnionOrIntersectionType
     *
     * 优先级（从低到高）：
     * 1. 函数类型 (params) => ReturnType
     * 2. 构造函数类型 new (params) => ReturnType
     * 3. 联合类型 |
     * 4. 交叉类型 &
     * 5. 基础类型（带可选数组后缀）
     */
    @SubhutiRule
    TSType() {
        this.Or([
            // 函数类型: (x: T) => U 或 <T>(x: T) => U
            { alt: () => this.TSFunctionType() },
            // 构造函数类型: new (x: T) => U
            { alt: () => this.TSConstructorType() },
            // 联合/交叉类型（包含基础类型）
            { alt: () => this.TSUnionOrIntersectionType() },
        ])
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
        // 解析基础类型
        this.TSPrimaryType()
        // 可选的数组后缀 [] 或索引访问 [K]
        this.Many(() => {
            this.tokenConsumer.LBracket()
            // 空括号 [] 表示数组类型，否则是索引访问类型
            this.Option(() => this.TSType())
            this.tokenConsumer.RBracket()
        })
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
     */
    @SubhutiRule
    TSPrimaryType() {
        this.Or([
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
}
