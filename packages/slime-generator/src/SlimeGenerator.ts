import {
    type SlimeJavascriptArrayExpression,
    type SlimeJavascriptArrayPattern,
    type SlimeJavascriptAssignmentPattern,
    type SlimeJavascriptBaseNode,
    type SlimeJavascriptBlockStatement,
    type SlimeJavascriptCallExpression,
    type SlimeJavascriptChainExpression,
    type SlimeJavascriptClassDeclaration,
    type SlimeJavascriptClassExpression,
    type SlimeJavascriptClassBody,
    type SlimeJavascriptDeclaration,
    type SlimeJavascriptExportNamedDeclaration,
    type SlimeJavascriptExpression,
    type SlimeJavascriptExpressionStatement,
    type SlimeJavascriptFunctionDeclaration,
    type SlimeJavascriptFunctionExpression,
    type SlimeJavascriptIdentifier,
    type SlimeJavascriptImportDeclaration,
    type SlimeJavascriptImportDefaultSpecifier,
    type SlimeJavascriptImportExpression,
    type SlimeJavascriptImportNamespaceSpecifier,
    type SlimeJavascriptImportSpecifier,
    type SlimeJavascriptLiteral,
    type SlimeJavascriptMemberExpression,
    type SlimeJavascriptModuleDeclaration,
    type SlimeJavascriptNumericLiteral,
    type SlimeJavascriptObjectExpression,
    type SlimeJavascriptObjectPattern,
    type SlimeJavascriptPattern,
    type SlimeJavascriptPrivateIdentifier,
    type SlimeJavascriptProgram,
    SlimeJavascriptProgramSourceType,
    type SlimeJavascriptProperty,
    type SlimeJavascriptRestElement,
    type SlimeJavascriptSpreadElement,
    type SlimeJavascriptReturnStatement,
    type SlimeJavascriptStatement,
    type SlimeJavascriptStaticBlock,
    type SlimeJavascriptStringLiteral,
    type SlimeJavascriptVariableDeclaration,
    type SlimeJavascriptVariableDeclarator,
    type SlimeJavascriptFunctionParam,
    SlimeJavascriptAstTypeName
} from "slime-ast";
import SlimeCodeMapping, { SlimeCodeLocation, type SlimeGeneratorResult } from "./SlimeCodeMapping.ts";
import type { SubhutiSourceLocation } from "subhuti";
import { SubhutiCreateToken } from "subhuti";
import { SubhutiMatchToken } from "subhuti";
import { SlimeJavascriptTokensObj } from "slime-parser";
import { SlimeJavascriptTokenType } from "slime-token";

// 兼容别名
const Es6TokenName = SlimeJavascriptTokenType;

// 创建软关键字的 token 对象（用于代码生成）
const createSoftKeywordToken = (name: string, value: string): SubhutiCreateToken => ({
    name,
    type: name,
    value,
} as SubhutiCreateToken);

// 扩展 es2025TokensObj，添加软关键字和别名
const SlimeJavascriptGeneratorTokensObj = {
    ...SlimeJavascriptTokensObj,
    // 软关键字（在 ES2025 中作为 IdentifierName 处理）
    OfTok: createSoftKeywordToken('OfTok', 'of'),
    AsyncTok: createSoftKeywordToken('AsyncTok', 'async'),
    StaticTok: createSoftKeywordToken('StaticTok', 'static'),
    AsTok: createSoftKeywordToken('AsTok', 'as'),
    GetTok: createSoftKeywordToken('GetTok', 'get'),
    SetTok: createSoftKeywordToken('SetTok', 'set'),
    FromTok: createSoftKeywordToken('FromTok', 'from'),
    // 别名（ES2025 使用不同的名称）
    Eq: SlimeJavascriptTokensObj.Assign,  // = 等号
};

const letTok = createSoftKeywordToken('Let', 'let')

// 关键字到 Token 的映射（用于 VariableDeclaration 的 kind）
// 注意：'let' 是软关键字，需要手动创建 token
const SlimeJavascriptGeneratorTokenMapObj: Record<string, SubhutiCreateToken> = {
    [SlimeJavascriptTokensObj.ConstTok.value]: SlimeJavascriptTokensObj.ConstTok,
    [letTok.value]: letTok,
    [SlimeJavascriptTokensObj.VarTok.value]: SlimeJavascriptTokensObj.VarTok,
};

export default class SlimeJavascriptGenerator {
    static mappings: SlimeCodeMapping[] = null
    static lastSourcePosition: SlimeCodeLocation = null
    static generatePosition: SlimeCodeLocation = null
    static sourceCodeIndex: number = null
    private static generateCode = ''
    private static generateLine = 0
    private static generateColumn = 0
    private static generateIndex = 0
    private static tokens: SubhutiMatchToken[] = null
    private static indent = 0  // 阶段2：缩进层级

    private static findNextTokenLocByTypeAndIndex(tokenType: string, index: number): SubhutiSourceLocation {
        const popToken = this.tokens.find(item => ((item.tokenName === tokenType) && (item.index > index)))
        let loc: SubhutiSourceLocation = null
        if (popToken) {
            loc = {
                // index: popToken.index,
                value: popToken.tokenValue,
                type: popToken.tokenName,
                start: {
                    index: popToken.index,
                    line: popToken.rowNum,
                    column: popToken.columnStartNum,
                },
                end: {
                    index: popToken.index + popToken.tokenValue.length,
                    line: popToken.rowNum,
                    column: popToken.columnEndNum
                }
            }
        }
        return loc
    }

    static generator(node: SlimeJavascriptBaseNode, tokens: SubhutiMatchToken[]): SlimeGeneratorResult {
        this.mappings = []
        this.tokens = tokens
        this.lastSourcePosition = new SlimeCodeLocation()
        this.generatePosition = new SlimeCodeLocation()
        this.sourceCodeIndex = 0
        this.generateLine = 0
        this.generateColumn = 0
        this.generateIndex = 0
        this.generateCode = ''
        this.indent = 0  // 阶段2：重置缩进
        this.generatorNode(node)
        return {
            mapping: this.mappings,
            code: this.generateCode
        }
    }

    private static generatorProgram(node: SlimeJavascriptProgram) {
        this.generatorNodes(node.body)
    }

    private static generatorModuleDeclarations(node: Array<SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration>) {
        for (const nodeElement of node) {
            this.generatorNode(nodeElement)
            // this.addSemicolonAndNewLine()
        }
    }

    private static generatorImportDeclaration(node: SlimeJavascriptImportDeclaration) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ImportTok, node.loc)
        this.addSpacing()

        const hasSpecifiers = node.specifiers && node.specifiers.length > 0
        // 检查是否有空命名导入 {} （通过 brace tokens 判断）
        const hasEmptyNamedImport = !hasSpecifiers && node.lBraceToken && node.rBraceToken

        if (hasSpecifiers) {
            // 辅助函数：获取 specifier 的实际类型（处理包装和非包装两种情况）
            const getSpecType = (s: any) => s.specifier?.type || s.type
            const getSpec = (s: any) => s.specifier || s

            const hasDefault = node.specifiers.some((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportDefaultSpecifier)
            const hasNamed = node.specifiers.some((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportSpecifier)
            const hasNamespace = node.specifiers.some((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportNamespaceSpecifier)

            if (hasDefault) {
                const defaultItem = node.specifiers.find((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportDefaultSpecifier)
                this.generatorNode(getSpec(defaultItem))
                if (hasNamed || hasNamespace) {
                    this.addComma()
                    this.addSpacing()
                }
            }

            if (hasNamespace) {
                const nsItem = node.specifiers.find((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportNamespaceSpecifier)
                this.generatorNode(getSpec(nsItem))
            } else if (hasNamed) {
                // import {name, greet}
                const namedItems = node.specifiers.filter((s: any) => getSpecType(s) === SlimeJavascriptAstTypeName.ImportSpecifier)
                this.addLBrace()
                namedItems.forEach((item: any, index) => {
                    if (index > 0) this.addComma()
                    this.generatorNode(getSpec(item))
                })
                this.addRBrace()
            }

            // 有 specifiers 时才需要 from
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.loc)
            this.addSpacing()
        } else if (hasEmptyNamedImport) {
            // 空命名导入: import {} from "foo"
            this.addLBrace()
            this.addRBrace()
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.loc)
            this.addSpacing()
        }

        // source 总是需要
        this.generatorNode(node.source)

        // ES2025 Import Attributes: with { type: "json" }
        this.generatorAttributes(node)

        // 添加分号
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()  // 阶段1：分号后换行
        // 注意：addIndent() 由 generatorNodes 根据是否是最后一个节点来决定
    }

    /** 生成 ES2025 Import Attributes: with { type: "json" } 或 with {} */
    private static generatorAttributes(node: any) {
        const attrs = node?.attributes
        // 如果 attrs 是 undefined，不输出任何内容
        // 如果 attrs 是空数组，输出 with {}
        if (attrs === undefined) return

        this.addSpacing()
        this.addCodeAndMappings({ type: 'With', name: 'With', value: 'with' }, node.withToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.addLBrace(node.attributesLBraceToken?.loc) // 使用精确 token 位置
        attrs.forEach((attr: any, index: number) => {
            if (index > 0) {
                this.addComma()
                this.addSpacing()
            }
            // key: Identifier 或 Literal
            if (attr.key.type === SlimeJavascriptAstTypeName.Identifier) {
                this.generatorIdentifier(attr.key)
            } else {
                this.generatorNode(attr.key)
            }
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, attr.colonToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(attr.value)
        })
        this.addRBrace(node.attributesRBraceToken?.loc) // 使用精确 token 位置
    }

    private static generatorImportSpecifier(node: SlimeJavascriptImportSpecifier) {
        // import {name} or import {name as localName}
        // 使用类型断言确保类型安全
        const importedName = (node.imported as SlimeJavascriptIdentifier).name
        const localName = (node.local as SlimeJavascriptIdentifier).name

        if (importedName !== localName) {
            // import {name as localName}
            this.generatorNode(node.imported)
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, node.asToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(node.local)
        } else {
            // import {name}
            this.generatorNode(node.local)
        }
    }

    private static generatorImportDefaultSpecifier(node: SlimeJavascriptImportDefaultSpecifier) {
        this.generatorNode(node.local)
    }


    private static generatorImportNamespaceSpecifier(node: SlimeJavascriptImportNamespaceSpecifier) {
        // import * as name
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, node.asToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.generatorNode(node.local)
    }


    private static generatorExportNamedDeclaration(node: SlimeJavascriptExportNamedDeclaration) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExportTok, node.exportToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        if (node.declaration) {
            // export const name = 'Alice'
            this.generatorNode(node.declaration)
        } else if (node.specifiers) {
            // export {name} 或 export {name as userName} 或 export {}
            this.addLBrace(node.lBraceToken?.loc) // 使用精确 token 位置
            node.specifiers.forEach((item, index) => {
                if (index > 0) {
                    this.addComma()
                    this.addSpacing()
                }
                // specifiers 是包装结构: { specifier: {...}, commaToken?: {...} }
                const spec = item.specifier || item
                this.generatorExportSpecifier(spec)
            })
            this.addRBrace(node.rBraceToken?.loc) // 使用精确 token 位置

            if (node.source) {
                // export {name} from './module.js'
                this.addSpacing()
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.fromToken?.loc) // 使用精确 token 位置
                this.addSpacing()
                this.generatorNode(node.source)
            }

            // ES2025 Import Attributes: with { type: "json" }
            this.generatorAttributes(node)

            // 添加分号和换行
            this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
            this.addNewLine()
        }
    }

    private static generatorExportSpecifier(spec: any) {
        // local: 本地名称, exported: 导出名称
        // ES2022: local 和 exported 可以是 Identifier 或 Literal（字符串字面量）
        this.generatorNode(spec.local)

        // 获取比较值：Identifier 用 name，Literal 用 value
        const localValue = spec.local.type === SlimeJavascriptAstTypeName.Literal
            ? spec.local.value
            : spec.local.name
        const exportedValue = spec.exported.type === SlimeJavascriptAstTypeName.Literal
            ? spec.exported.value
            : spec.exported.name

        // 比较值而不是对象引用
        if (localValue !== exportedValue) {
            // export {name as userName} 或 export {"string" as "alias"}
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, spec.asToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(spec.exported)
        }
        // else: export {name} - 简写形式，只输出一次
    }

    private static generatorExportAllDeclaration(node: any) {
        // export * from './module.js' 或 export * as name from './module.js'
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExportTok, node.exportToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        // 如果有导出名称，添加 as name
        if (node.exported) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsTok, node.asToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(node.exported)
            this.addSpacing()
        }
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FromTok, node.fromToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.generatorNode(node.source)

        // ES2025 Import Attributes: with { type: "json" }
        this.generatorAttributes(node)

        // 添加分号和换行
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }


    private static generatorNodes(nodes: SlimeJavascriptBaseNode[]) {
        nodes.forEach((node, index) => {
            this.generatorNode(node)
            // 阶段2：如果不是最后一个节点，添加下一行的缩进
            if (index < nodes.length - 1) {
                this.addIndent()
            }
            // this.addSemicolonAndNewLine()
        })
    }


    private static generatorExpressionStatement(node: SlimeJavascriptExpressionStatement) {
        this.generatorNode(node.expression)
        // 添加分号
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()  // 阶段1：分号后换行
        // 注意：addIndent() 由 generatorNodes 根据是否是最后一个节点来决定
    }

    private static generatorYieldExpression(node: any) {
        // yield 或 yield* argument
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.YieldTok, node.yieldToken?.loc) // 使用精确 token 位置
        if (node.delegate) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        }
        if (node.argument) {
            this.addSpacing()
            this.generatorNode(node.argument)
        }
    }

    private static generatorAwaitExpression(node: any) {
        // await argument
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AwaitTok, node.awaitToken?.loc) // 使用精确 token 位置
        if (node.argument) {
            this.addSpacing()
            this.generatorNode(node.argument)
        }
    }

    private static generatorTemplateLiteral(node: any) {
        // 生成模板字符串：`part1 ${expr1} part2 ${expr2} part3`
        const quasis = node.quasis || []
        const expressions = node.expressions || []

        // 如果没有插值表达式，且有原始值，直接输出
        if (expressions.length === 0 && quasis.length === 1 && quasis[0].value?.raw) {
            // 简单模板字符串，直接输出原始 token
            this.addString(quasis[0].value.raw)
            return
        }

        // quasis和expressions交替出现，quasis总是比expressions多1个
        for (let i = 0; i < quasis.length; i++) {
            const quasi = quasis[i]
            // 输出模板元素的内容（使用 raw 保持原始格式）
            if (quasi.value) {
                const raw = quasi.value.raw || ''
                this.addString(raw)
            }

            // 如果不是最后一个quasi，输出对应的expression
            if (i < expressions.length) {
                this.generatorNode(expressions[i])
            }
        }
    }

    private static generatorCallExpression(node: SlimeJavascriptCallExpression) {
        // 直接输出 callee（不需要添加额外的括号，因为如果源代码需要括号，它会被解析为 ParenthesizedExpression）
        this.generatorNode(node.callee as SlimeJavascriptExpression)

        // 可选调用：obj?.method() - 需要输出 ?.( 而不是 (
        if ((node as any).optional) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, (node as any).optionalChainingToken?.loc)  // 使用精确 token 位置
        }

        // 直接输出括号与参数（不依赖token定位，兼容合成AST）
        this.addLParen((node as any).lParenToken?.loc) // 使用精确 token 位置
        if (node.arguments.length) {
            node.arguments.forEach((item, index) => {
                if (index !== 0) {
                    this.addComma()
                }
                // 处理包装结构：{ argument: {...}, commaToken?: {...} }
                const argument = (item as any).argument || item
                // 检查是否是SpreadElement
                if (argument.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    this.generatorSpreadElement(argument as SlimeJavascriptSpreadElement)
                } else {
                    this.generatorNode(argument as SlimeJavascriptExpression)
                }
            })
        }
        this.addRParen((node as any).rParenToken?.loc) // 使用精确 token 位置
    }

    private static generatorFunctionExpression(node: SlimeJavascriptFunctionExpression) {
        // 如果是async函数，先输出async关键字
        if (node.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FunctionTok, node.functionToken?.loc) // 使用精确 token 位置

        // 如果是生成器函数，输出*
        if (node.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        }

        if (node.id) {
            this.addSpacing()
            this.generatorNode(node.id)
        }
        // params 是 SlimeJavascriptFunctionParam[] 数组，使用精确 token 位置
        this.generatorFunctionParams(node.params as SlimeJavascriptFunctionParam[], node.lParenToken?.loc, node.rParenToken?.loc)
        // body可能缺失
        if (node.body && node.body.type) {
            this.generatorNode(node.body)
        } else {
            // 空函数体
            this.addLBrace()
            this.addRBrace()
        }
    }

    /**
     * 生成箭头函数表达式
     */
    private static generatorArrowFunctionExpression(node: any) {
        // 如果是async箭头函数，先输出async关键字
        if (node.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 输出参数（处理 { param: Identifier } 包装结构）
        const unwrapParam = (p: any) => p.param !== undefined ? p.param : p
        const firstParam = node.params?.[0] ? unwrapParam(node.params[0]) : null

        // 检查是否需要括号：
        // 1. 如果源代码中有括号（lParenToken 存在），保留括号
        // 2. 如果只有一个简单标识符参数且没有括号 token，可以省略括号
        const hasParenTokens = node.lParenToken || node.rParenToken
        const canOmitParens = node.params && node.params.length === 1 &&
            firstParam?.type === SlimeJavascriptAstTypeName.Identifier &&
            !hasParenTokens

        if (canOmitParens) {
            // 单个标识符参数，且源代码中没有括号
            this.generatorNode(firstParam)
        } else {
            // 需要括号的情况
            this.addLParen()
            if (node.params) {
                node.params.forEach((item: any, index: number) => {
                    if (index !== 0) {
                        this.addComma()
                    }
                    const param = unwrapParam(item)
                    this.generatorNode(param)
                })
            }
            this.addRParen()
        }

        // 输出箭头
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Arrow, node.arrowToken?.loc) // 使用精确 token 位置
        this.addSpacing()

        // 输出函数体
        if (node.expression && node.body.type !== SlimeJavascriptAstTypeName.BlockStatement) {
            // 表达式形式：x => x * 2 或 x => ({ key: value })

            // ✅ 关键修复：如果body是ObjectExpression，需要加括号
            // 因为 { } 会被解析为函数体块，而不是对象字面量
            if (node.body.type === SlimeJavascriptAstTypeName.ObjectExpression) {
                this.addLParen()
                this.generatorNode(node.body)
                this.addRParen()
            } else {
                this.generatorNode(node.body)
            }
        } else {
            // 块语句形式：x => { return x * 2 }
            // 阶段2：箭头函数后不换行（可能后面有逗号或括号），传 false
            this.generatorNode(node.body, false)
        }
    }

    /**
     * 生成二元运算表达式
     */
    private static generatorBinaryExpression(node: any) {
        // 输出左操作数
        this.generatorNode(node.left)

        // 输出运算符
        // 使用 addString() 而不是 addCode()：
        // 1. 运算符是动态内容（+, -, *, / 等），不是预定义 token
        // 2. 运算符不需要 source map 映射（位置由表达式结构决定）
        // 3. 性能更好（避免对象创建和属性访问）
        this.addSpacing()
        this.addString(node.operator)
        this.addSpacing()

        // 输出右操作数
        this.generatorNode(node.right)
    }

    /**
     * 生成函数参数列表
     * @param params SlimeJavascriptFunctionParam[] 参数列表
     * @param lParenLoc 左括号精确位置
     * @param rParenLoc 右括号精确位置
     */
    private static generatorFunctionParams(params: SlimeJavascriptFunctionParam[], lParenLoc?: SubhutiSourceLocation, rParenLoc?: SubhutiSourceLocation) {
        this.addLParen(lParenLoc)
        if (params && params.length > 0) {
            params.forEach((item, index) => {
                if (index !== 0) {
                    this.addComma()
                }
                // 处理包装结构 { param: Pattern, commaToken?: ... }
                const param = item.param || item
                this.generatorNode(param as SlimeJavascriptPattern)
            })
        }
        this.addRParen(rParenLoc)
    }

    /**
     * 判断节点是否"复杂"（需要换行）
     * 复杂的定义：
     * - CallExpression（函数调用）
     * - ObjectExpression（超过1个属性）
     * - ArrayExpression（包含复杂元素）
     */
    private static isComplexNode(node: any): boolean {
        if (!node) return false
        if (node.type === SlimeJavascriptAstTypeName.CallExpression) return true
        if (node.type === SlimeJavascriptAstTypeName.ObjectExpression && node.properties?.length > 1) return true
        if (node.type === SlimeJavascriptAstTypeName.ArrayExpression) {
            return node.elements?.some((item: any) => this.isComplexNode(item?.element))
        }
        return false
    }

    private static generatorArrayExpression(node: SlimeJavascriptArrayExpression) {
        this.addLBracket(node.loc)

        // 判断是否需要多行格式：数组元素中有复杂节点（如函数调用）
        const hasComplexElements = node.elements?.some(item => this.isComplexNode(item?.element))

        if (hasComplexElements && node.elements.length > 0) {
            // 多行格式
            this.addNewLine()
            this.indent++
            this.addIndent()

            node.elements.forEach((item, index) => {
                const element = item.element
                if (element === null || element === undefined) {
                    // 空元素：[1, , 3]
                } else if (element.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    this.generatorSpreadElement(element as SlimeJavascriptSpreadElement)
                } else {
                    this.generatorNode(element as SlimeJavascriptExpression)
                }

                // 添加逗号和换行（除了最后一个元素）
                if (index < node.elements.length - 1) {
                    this.addComma()
                    this.addNewLine()
                    this.addIndent()
                }
            })

            this.addNewLine()
            this.indent--
            this.addIndent()
        } else {
            // 单行格式（简单元素）
            for (const item of node.elements) {
                const element = item.element
                if (element === null || element === undefined) {
                    // 空元素
                } else if (element.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    this.generatorSpreadElement(element as SlimeJavascriptSpreadElement)
                } else {
                    this.generatorNode(element as SlimeJavascriptExpression)
                }
                if (item.commaToken) {
                    this.addComma()
                }
            }
        }

        this.addRBracket(node.loc)
    }

    private static generatorObjectExpression(node: SlimeJavascriptObjectExpression) {
        this.addLBrace()
        node.properties.forEach((item, index) => {
            // properties 是 SlimeJavascriptObjectPropertyItem[] 类型，每个元素是 { property, commaToken }
            const property = item.property
            // ES2018: SpreadElement需要特殊处理
            if (property.type === SlimeJavascriptAstTypeName.SpreadElement) {
                this.generatorSpreadElement(property as SlimeJavascriptSpreadElement)
            } else {
                // Property类型
                this.generatorNode(property)
            }
            // 使用关联的逗号 token，如果有的话
            if (item.commaToken) {
                this.addComma()
            }
        })
        this.addRBrace()
    }

    private static generatorParenthesizedExpression(node: any) {
        // 括号表达式：(expression)
        this.addLParen()
        this.generatorNode(node.expression)
        this.addRParen()
    }

    private static generatorSequenceExpression(node: any) {
        // 逗号表达式：a, b, c
        if (node.expressions && Array.isArray(node.expressions)) {
            for (let i = 0; i < node.expressions.length; i++) {
                if (i > 0) {
                    this.addComma()
                }
                this.generatorNode(node.expressions[i])
            }
        }
    }

    private static generatorPrivateIdentifier(node: SlimeJavascriptPrivateIdentifier) {
        // 使用 addString() 输出私有标识符名称（如 #privateField）
        // 原因：标识符名称是动态的，不需要单独的 source map 映射
        this.addString(node.name)
    }

    private static generatorProperty(node: SlimeJavascriptProperty) {
        // 处理 getter/setter
        if (node.kind === 'get' || node.kind === 'set') {
            // getter: get name() { ... }
            // setter: set name(value) { ... }
            if (node.kind === 'get') {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.GetTok, node.getToken?.loc) // 使用精确 token 位置
            } else {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.SetTok, node.setToken?.loc) // 使用精确 token 位置
            }
            this.addSpacing()

            // 输出属性名
            if (node.computed) {
                this.addLBracket()
                this.generatorNode(node.key as any)
                this.addRBracket()
            } else {
                this.generatorNode(node.key as any)
            }

            // 输出参数和函数体
            const value = node.value as any
            this.generatorFunctionParams(value.params as SlimeJavascriptFunctionParam[], value.lParenToken?.loc, value.rParenToken?.loc)
            if (value.body) {
                this.generatorNode(value.body)
            }
        } else if (node.method) {
            // 方法简写: name() { ... } 或 *name() { ... } 或 async name() { ... }
            const value = node.value as any

            // 处理 async
            if (value.async) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc) // 使用精确 token 位置
                this.addSpacing()
            }

            // 处理 generator
            if (value.generator) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
            }

            // 输出属性名
            if (node.computed) {
                this.addLBracket()
                this.generatorNode(node.key as any)
                this.addRBracket()
            } else {
                this.generatorNode(node.key as any)
            }

            // 输出参数和函数体
            this.generatorFunctionParams(value.params as SlimeJavascriptFunctionParam[], value.lParenToken?.loc, value.rParenToken?.loc)
            if (value.body) {
                this.generatorNode(value.body)
            }
        } else if (node.shorthand) {
            // 简写属性: { name } 等价于 { name: name }
            // 或带默认值: { name = 'default' } 等价于 { name: name = 'default' }
            if (node.value && (node.value as any).type === SlimeJavascriptAstTypeName.AssignmentPattern) {
                // 带默认值的简写属性
                this.generatorNode(node.value as any)
            } else {
                this.generatorNode(node.key as any)
            }
        } else {
            // 常规属性语法: key: value
            if (node.computed) {
                this.addLBracket()
                this.generatorNode(node.key as any)
                this.addRBracket()
            } else {
                this.generatorNode(node.key as any)
            }
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, node.colonToken?.loc) // 使用精确 token 位置
            this.generatorNode(node.value as any)
        }
    }


    private static patternTypes = [
        SlimeJavascriptAstTypeName.Identifier,
        SlimeJavascriptAstTypeName.ObjectPattern,
        SlimeJavascriptAstTypeName.ArrayPattern,
        SlimeJavascriptAstTypeName.RestElement,
        SlimeJavascriptAstTypeName.AssignmentPattern,
        SlimeJavascriptAstTypeName.MemberExpression,
    ]

    private static generatorIdentifier(node: SlimeJavascriptIdentifier) {
        // 创建标识符 token 时需要完整的 SubhutiCreateToken 接口：
        // type: 必需属性，标识 token 类型
        // name: token 名称
        // value: 实际的标识符名称（动态内容）
        // 注意：这里使用 addCodeAndMappings()，需要 source map 映射，所以必须提供完整的 token 对象

        // 优先级：1. node.raw（保留原始转义序列）2. loc.value 3. node.name
        // 这确保 #\u{61} 不会被解码为 #a
        const identifierName = (node as any).raw || (node.loc as any)?.value || node.name || ''
        if (!identifierName) {
            console.error('generatorIdentifier: node.name is undefined', JSON.stringify(node, null, 2))
        }
        const identifier = { type: Es6TokenName.IdentifierNameTok, name: Es6TokenName.IdentifierNameTok, value: identifierName }
        this.addCodeAndMappings(identifier, node.loc)
    }

    private static generatorFunctionDeclaration(node: any) {
        // 如果是async函数，先输出async关键字
        if (node.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 输出 function 关键字
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FunctionTok, node.functionToken?.loc) // 使用精确 token 位置

        // Generator函数：输出 * 号
        if (node.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        }

        // 输出函数名
        if (node.id) {
            this.addSpacing()  // function/function* 和函数名之间需要空格
            this.generatorIdentifier(node.id)
        }

        // 输出参数列表，使用精确 token 位置
        this.generatorFunctionParams(node.params as SlimeJavascriptFunctionParam[], node.lParenToken?.loc, node.rParenToken?.loc)

        // 输出函数体
        if (node.body) {
            // 阶段2：函数声明后需要换行，传 true
            this.generatorBlockStatement(node.body as SlimeJavascriptBlockStatement, true)
        }
    }

    private static generatorClassDeclaration(node: SlimeJavascriptClassDeclaration) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ClassTok, node.classToken?.loc) // 使用精确 token 位置
        if (node.id) {
            this.addSpacing() // 类名与关键字之间添加空格
            this.generatorNode(node.id) // 递归生成类名标识符
        }
        if (node.superClass) {
            this.addSpacing() // class Name 与 extends 之间的空格
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, node.extendsToken?.loc) // 使用精确 token 位置
            this.addSpacing() // extends 与父类表达式之间的空格
            this.generatorNode(node.superClass) // 递归生成父类表达式
        }
        this.generatorClassBody(node.body) // 生成类主体花括号及成员
        this.addNewLine() // 类声明后换行
    }

    private static generatorClassExpression(node: SlimeJavascriptClassExpression) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ClassTok, node.classToken?.loc) // 使用精确 token 位置
        if (node.id) {
            this.addSpacing() // 类名与关键字之间添加空格
            this.generatorNode(node.id) // 递归生成类名标识符
        }
        if (node.superClass) {
            this.addSpacing() // class Name 与 extends 之间的空格
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExtendsTok, node.extendsToken?.loc) // 使用精确 token 位置
            this.addSpacing() // extends 与父类表达式之间的空格
            this.generatorNode(node.superClass) // 递归生成父类表达式
        }
        this.generatorClassBody(node.body) // 生成类主体花括号及成员
    }

    private static generatorClassBody(body: SlimeJavascriptClassBody) {
        this.addLBrace(body.lBraceToken?.loc) // 使用精确 lBraceToken 位置
        if (body?.body?.length) {
            this.addNewLine()  // { 后换行
            this.indent++      // 增加缩进层级
            body.body.forEach((element, index) => {
                this.addIndent()  // 添加缩进
                this.generatorNode(element) // 遍历生成每个类成员
                this.addNewLine()  // 每个成员后换行
            })
            this.indent--      // 减少缩进层级
        }
        this.addRBrace(body.rBraceToken?.loc) // 使用精确 rBraceToken 位置
    }

    private static generatorMethodDefinition(node: any) {
        // 处理 static 关键字
        if (node.static) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, node.staticToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 处理 async 关键字
        if (node.value && node.value.async) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AsyncTok, node.asyncToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 处理 getter/setter关键字
        if (node.kind === 'get') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.GetTok, node.getToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        } else if (node.kind === 'set') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.SetTok, node.setToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 处理 generator 方法（*号）
        if (node.value && node.value.generator) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Asterisk, node.asteriskToken?.loc) // 使用精确 token 位置
        }

        // 处理 key（方法名）
        if (node.key) {
            if (node.computed) {
                this.addLBracket()
                this.generatorNode(node.key)
                this.addRBracket()
            } else {
                this.generatorNode(node.key)
            }
        }

        // 处理 value（函数参数和函数体，但不输出 function 关键字和函数名）
        if (node.value) {
            // 只输出参数和函数体，使用精确 token 位置
            this.generatorFunctionParams(node.value.params as SlimeJavascriptFunctionParam[], node.value.lParenToken?.loc, node.value.rParenToken?.loc)
            if (node.value.body) {
                this.generatorNode(node.value.body)
            }
        }
    }

    private static generatorPropertyDefinition(node: any) {
        // 处理 static 关键字
        if (node.static) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, node.staticToken?.loc) // 使用精确 token 位置
            this.addSpacing()
        }

        // 处理 key（属性名）
        if (node.key) {
            // 对于计算属性，需要用方括号括起来
            if (node.computed) {
                this.addLBracket(node.lBracketToken?.loc) // 使用精确 token 位置
                this.generatorNode(node.key)
                this.addRBracket(node.rBracketToken?.loc) // 使用精确 token 位置
            } else {
                this.generatorNode(node.key)
            }
        }

        // 处理 value（属性值）
        if (node.value) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Eq, node.equalToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(node.value)
        }

        // 添加分号
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
    }

    private static generatorNewExpression(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.NewTok, node.newToken?.loc) // 使用精确 token 位置
        this.addSpacing()

        // 处理 callee（类名）
        if (node.callee) {
            this.generatorNode(node.callee)
        }

        // 只有当有 lParenToken 或有参数时才添加括号
        // 这样可以保留 `new foo` vs `new foo()` 的区别
        if (node.lParenToken || (node.arguments && node.arguments.length > 0)) {
            this.addLParen()
            if (node.arguments && node.arguments.length > 0) {
                node.arguments.forEach((arg: any, index: number) => {
                    if (index > 0) {
                        this.addComma()
                        this.addSpacing()
                    }
                    // 参数可能是 SlimeJavascriptCallArgument（包含 argument 属性）或直接的表达式
                    if (arg && arg.argument) {
                        this.generatorNode(arg.argument)
                    } else {
                        this.generatorNode(arg)
                    }
                })
            }
            this.addRParen()
        }
    }

    /**
     * 生成任意节点
     * @param node AST 节点
     * @param addNewLineAfter 如果节点是 BlockStatement，是否在 } 后换行（默认 false）
     */
    private static generatorNode(node: SlimeJavascriptBaseNode, addNewLineAfter: boolean = false) {
        // 防御性检查：如果node为null或undefined，直接返回
        if (!node) {
            return
        }

        if (node.type === SlimeJavascriptAstTypeName.Program) {
            return this.generatorProgram(node as SlimeJavascriptProgram)
        } else if (node.type === SlimeJavascriptAstTypeName.PrivateIdentifier) {
            this.generatorPrivateIdentifier(node as SlimeJavascriptPrivateIdentifier)
        } else if (node.type === SlimeJavascriptAstTypeName.Identifier) {
            this.generatorIdentifier(node as SlimeJavascriptIdentifier)
        } else if (node.type === SlimeJavascriptAstTypeName.ThisExpression || node.type === 'ThisExpression') {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ThisTok, (node as any).thisToken?.loc) // 使用精确 token 位置
        } else if (node.type === SlimeJavascriptAstTypeName.NumericLiteral) {
            this.generatorNumberLiteral(node as SlimeJavascriptNumericLiteral)
        } else if (node.type === SlimeJavascriptAstTypeName.Literal) {
            // ESTree 标准的 Literal 类型（包含 number, string, boolean, null, RegExp, BigInt）
            this.generatorLiteral(node as SlimeJavascriptLiteral)
        } else if (node.type === SlimeJavascriptAstTypeName.MemberExpression) {
            this.generatorMemberExpression(node as SlimeJavascriptMemberExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.CallExpression) {
            this.generatorCallExpression(node as SlimeJavascriptCallExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.FunctionExpression) {
            this.generatorFunctionExpression(node as SlimeJavascriptFunctionExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.ArrowFunctionExpression) {
            this.generatorArrowFunctionExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.BinaryExpression) {
            this.generatorBinaryExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.LogicalExpression || node.type === 'LogicalExpression') {
            // LogicalExpression 和 BinaryExpression 结构相同，复用同一个生成器
            this.generatorBinaryExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.StringLiteral) {
            this.generatorStringLiteral(node as SlimeJavascriptStringLiteral)
        } else if (node.type === SlimeJavascriptAstTypeName.ArrayExpression) {
            this.generatorArrayExpression(node as SlimeJavascriptArrayExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.ObjectExpression) {
            this.generatorObjectExpression(node as SlimeJavascriptObjectExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.ParenthesizedExpression) {
            this.generatorParenthesizedExpression(node as any)
        } else if (node.type === 'SequenceExpression') {
            this.generatorSequenceExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.Property) {
            this.generatorProperty(node as SlimeJavascriptProperty)

        } else if (node.type === SlimeJavascriptAstTypeName.VariableDeclarator) {
            this.generatorVariableDeclarator(node as SlimeJavascriptVariableDeclarator)

        } else if (node.type === SlimeJavascriptAstTypeName.RestElement) {
            this.generatorRestElement(node as SlimeJavascriptRestElement)

        } else if (node.type === SlimeJavascriptAstTypeName.SpreadElement) {
            this.generatorSpreadElement(node as SlimeJavascriptSpreadElement)

        } else if (node.type === SlimeJavascriptAstTypeName.ObjectPattern) {
            this.generatorObjectPattern(node as SlimeJavascriptObjectPattern)

        } else if (node.type === SlimeJavascriptAstTypeName.ArrayPattern) {
            this.generatorArrayPattern(node as SlimeJavascriptArrayPattern)

        } else if (node.type === SlimeJavascriptAstTypeName.AssignmentPattern) {
            this.generatorAssignmentPattern(node as SlimeJavascriptAssignmentPattern)

        } else if (node.type === SlimeJavascriptAstTypeName.FunctionDeclaration) {
            this.generatorFunctionDeclaration(node as SlimeJavascriptFunctionDeclaration)
        } else if (node.type === SlimeJavascriptAstTypeName.ClassDeclaration) {
            this.generatorClassDeclaration(node as SlimeJavascriptClassDeclaration)
        } else if (node.type === SlimeJavascriptAstTypeName.ClassExpression) {
            this.generatorClassExpression(node as SlimeJavascriptClassExpression) // 新增对 ClassExpression 的处理
        } else if (node.type === SlimeJavascriptAstTypeName.MethodDefinition) {
            this.generatorMethodDefinition(node as any) // 新增对 MethodDefinition 的处理
        } else if (node.type === 'PropertyDefinition') {
            this.generatorPropertyDefinition(node as any) // 新增对 PropertyDefinition 的处理
        } else if (node.type === 'NewExpression') {
            this.generatorNewExpression(node as any) // 新增对 NewExpression 的处理
        } else if (node.type === SlimeJavascriptAstTypeName.VariableDeclaration) {
            this.generatorVariableDeclaration(node as SlimeJavascriptVariableDeclaration)
        } else if (node.type === SlimeJavascriptAstTypeName.ExpressionStatement) {
            this.generatorExpressionStatement(node as SlimeJavascriptExpressionStatement)
        } else if (node.type === SlimeJavascriptAstTypeName.ReturnStatement) {
            this.generatorReturnStatement(node as SlimeJavascriptReturnStatement)
        } else if (node.type === SlimeJavascriptAstTypeName.BlockStatement) {
            // 阶段2：传递 addNewLineAfter 参数给 BlockStatement
            this.generatorBlockStatement(node as SlimeJavascriptBlockStatement, addNewLineAfter)
        } else if (node.type === SlimeJavascriptAstTypeName.IfStatement) {
            this.generatorIfStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ForStatement) {
            this.generatorForStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ForInStatement || node.type === SlimeJavascriptAstTypeName.ForOfStatement) {
            this.generatorForInOfStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.WhileStatement) {
            this.generatorWhileStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.DoWhileStatement) {
            this.generatorDoWhileStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.SwitchStatement) {
            this.generatorSwitchStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.SwitchCase) {
            this.generatorSwitchCase(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.TryStatement) {
            this.generatorTryStatement(node as any)
        } else if (node.type === 'CatchClause') {
            this.generatorCatchClause(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ThrowStatement) {
            this.generatorThrowStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.BreakStatement) {
            this.generatorBreakStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ContinueStatement) {
            this.generatorContinueStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.LabeledStatement) {
            this.generatorLabeledStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.WithStatement) {
            this.generatorWithStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.DebuggerStatement) {
            this.generatorDebuggerStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.EmptyStatement) {
            this.generatorEmptyStatement(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ImportSpecifier) {
            this.generatorImportSpecifier(node as SlimeJavascriptImportSpecifier)
        } else if (node.type === SlimeJavascriptAstTypeName.ImportDefaultSpecifier) {
            this.generatorImportDefaultSpecifier(node as SlimeJavascriptImportDefaultSpecifier)
        } else if (node.type === SlimeJavascriptAstTypeName.ImportNamespaceSpecifier) {
            this.generatorImportNamespaceSpecifier(node as SlimeJavascriptImportNamespaceSpecifier)
        } else if (node.type === SlimeJavascriptAstTypeName.ExportNamedDeclaration) {
            this.generatorExportNamedDeclaration(node as SlimeJavascriptExportNamedDeclaration)
        } else if (node.type === SlimeJavascriptAstTypeName.ExportDefaultDeclaration) {
            this.generatorExportDefaultDeclaration(node as any)
        } else if (node.type === 'ExportAllDeclaration') {
            this.generatorExportAllDeclaration(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.ImportDeclaration) {
            this.generatorImportDeclaration(node as SlimeJavascriptImportDeclaration)
        } else if (node.type === SlimeJavascriptAstTypeName.ImportExpression) {
            this.generatorImportExpression(node as SlimeJavascriptImportExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.ChainExpression) {
            this.generatorChainExpression(node as SlimeJavascriptChainExpression)
        } else if (node.type === SlimeJavascriptAstTypeName.StaticBlock) {
            this.generatorStaticBlock(node as SlimeJavascriptStaticBlock)
        } else if (node.type === 'ConditionalExpression') {
            this.generatorConditionalExpression(node as any)
        } else if (node.type === 'AssignmentExpression') {
            this.generatorAssignmentExpression(node as any)
        } else if (node.type === 'BooleanLiteral') {
            this.addString((node as any).value ? 'true' : 'false')
        } else if (node.type === 'NullLiteral') {
            this.addString('null')
        } else if (node.type === 'UnaryExpression') {
            this.generatorUnaryExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.UpdateExpression) {
            this.generatorUpdateExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.YieldExpression) {
            this.generatorYieldExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.AwaitExpression) {
            this.generatorAwaitExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.TemplateLiteral) {
            this.generatorTemplateLiteral(node as any)
        } else if (node.type === "Super") {
            // Super关键字：直接输出"super"
            this.addString('super')
        } else if (node.type === 'TaggedTemplateExpression') {
            // Tagged Template Literals: tag`template`
            this.generatorNode((node as any).tag)
            this.generatorTemplateLiteral((node as any).quasi)
        } else if (node.type === 'MetaProperty') {
            // new.target or import.meta
            this.generatorNode((node as any).meta)
            this.addDot((node as any).dotToken?.loc) // 使用精确 token 位置
            this.generatorNode((node as any).property)
        } else if (node.type === SlimeJavascriptAstTypeName.OptionalCallExpression) {
            // 可选调用：obj?.method()
            this.generatorOptionalCallExpression(node as any)
        } else if (node.type === SlimeJavascriptAstTypeName.OptionalMemberExpression) {
            // 可选成员访问：obj?.prop 或 obj?.[expr]
            this.generatorOptionalMemberExpression(node as any)
        } else {
            console.error('未知节点:', JSON.stringify(node, null, 2))
            throw new Error('不支持的类型：' + node.type)
        }
        if (node.loc && node.loc.newLine) {
            this.addNewLine() // 根据定位信息决定是否插入换行
        }
    }


    private static generatorUnaryExpression(node: any) {
        // UnaryExpression: operator + argument
        this.addString(node.operator)
        if (node.operator === 'typeof' || node.operator === 'void' || node.operator === 'delete') {
            this.addSpacing()  // 关键字后需要空格
        }
        this.generatorNode(node.argument)
    }

    private static generatorUpdateExpression(node: any) {
        // UpdateExpression: ++/-- expression
        if (node.prefix) {
            // 前缀：++i 或 --i
            this.addString(node.operator)
            this.generatorNode(node.argument)
        } else {
            // 后缀：i++ 或 i--
            this.generatorNode(node.argument)
            this.addString(node.operator)
        }
    }

    private static generatorConditionalExpression(node: any) {
        this.generatorNode(node.test)
        this.addString('?')
        this.generatorNode(node.consequent)
        this.addString(':')
        this.generatorNode(node.alternate)
    }

    private static generatorAssignmentExpression(node: any) {
        this.generatorNode(node.left)
        this.addSpacing()
        this.addString(node.operator || '=')
        this.addSpacing()
        this.generatorNode(node.right)
    }

    private static generatorObjectPattern(node: SlimeJavascriptObjectPattern) {
        // 输出对象解构：{name, age} 或 {name: userName} 或 {name = "default"} 或 {a, ...rest}
        // properties 是 SlimeJavascriptObjectPatternProperty[] 类型，每个元素是 { property, commaToken }
        this.addLBrace()
        node.properties.forEach((item: any, index) => {
            // 处理包装结构
            const prop = item.property !== undefined ? item.property : item
            const commaToken = item.commaToken
            // ES2018: 检查是否是RestElement
            if (prop.type === SlimeJavascriptAstTypeName.RestElement) {
                this.generatorRestElement(prop as SlimeJavascriptRestElement)
            } else if (prop.shorthand) {
                // 简写形式：{name} 或 {name = "default"}
                // 如果value是AssignmentPattern，输出完整的 name = "default"
                // 否则只输出 name
                if (prop.value && prop.value.type === SlimeJavascriptAstTypeName.AssignmentPattern) {
                    this.generatorNode(prop.value)
                } else {
                    this.generatorNode(prop.key)
                }
            } else {
                // 完整形式：{name: userName} 或 {[expr]: userName}
                // 检查是否是计算属性名
                if (prop.computed) {
                    this.addLBracket((prop as any).lBracketToken?.loc) // 使用精确 token 位置
                    this.generatorNode(prop.key)
                    this.addRBracket((prop as any).rBracketToken?.loc) // 使用精确 token 位置
                } else {
                    this.generatorNode(prop.key)
                }
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, (prop as any).colonToken?.loc) // 使用精确 token 位置
                this.addSpacing()
                this.generatorNode(prop.value)
            }
            // 使用 commaToken 决定是否添加逗号，如果没有则回退到位置判断
            if (commaToken) {
                this.addComma()
            } else if (index < node.properties.length - 1) {
                this.addComma()
            }
        })
        this.addRBrace()
    }

    private static generatorArrayPattern(node: SlimeJavascriptArrayPattern) {
        // 输出数组解构：[a, b, c] 或 [a, , c]（跳过元素）或 [a,,]（尾部空位）
        // elements 是 SlimeJavascriptArrayPatternElement[] 类型，每个元素是 { element, commaToken }
        this.addLBracket()
        node.elements.forEach((item, index) => {
            // 处理包装结构
            const wrapped = item as any
            const element = wrapped.element !== undefined ? wrapped.element : item
            const commaToken = wrapped.commaToken

            if (element) {
                this.generatorNode(element)
            }
            // null元素表示跳过（Elision），如 [a, , c]
            // 只输出逗号，不输出内容

            // 添加逗号：使用 commaToken 或者非最后一个元素
            if (commaToken) {
                this.addComma()
            } else if (index < node.elements.length - 1) {
                this.addComma()
            }
        })
        this.addRBracket()
    }

    private static generatorRestElement(node: SlimeJavascriptRestElement) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Ellipsis, node.ellipsisToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.argument)
    }

    private static generatorSpreadElement(node: SlimeJavascriptSpreadElement) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Ellipsis, node.ellipsisToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.argument)
    }

    private static generatorAssignmentPattern(node: SlimeJavascriptAssignmentPattern) {
        // 默认值模式：name = 'Guest'
        this.generatorNode(node.left)
        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Eq, (node as any).equalToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.generatorNode(node.right)
    }

    /**
     * 生成块语句（{...}）
     * @param node BlockStatement 节点
     * @param addNewLineAfter 是否在 } 后换行（默认 false）
     */
    private static generatorBlockStatement(node: SlimeJavascriptBlockStatement, addNewLineAfter: boolean = false) {
        this.addLBrace(node.lBraceToken?.loc) // 使用精确 token 位置
        this.addNewLine()  // 阶段2：{ 后换行
        this.indent++      // 阶段2：增加缩进层级
        this.addIndent()   // 阶段2：添加缩进

        this.generatorNodes(node.body)

        this.indent--      // 阶段2：减少缩进层级
        this.addIndent()   // 阶段2：添加 } 的缩进
        this.addRBrace(node.rBraceToken?.loc) // 使用精确 token 位置

        // 阶段2：根据参数决定是否在 } 后换行
        if (addNewLineAfter) {
            this.addNewLine()
        }
    }

    private static generatorReturnStatement(node: SlimeJavascriptReturnStatement) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ReturnTok, node.returnToken?.loc) // 使用精确 token 位置
        if (node.argument) {
            this.addSpacing()
            this.generatorNode(node.argument)
        }
        // 添加分号和换行
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    private static addSpacing() {
        this.addString(' ')
    }

    private static addDot(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Dot, loc)
    }


    private static addComma(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Comma, loc)
    }

    private static addLParen(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, loc)
    }

    private static addRParen(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, loc)
    }

    private static addLBrace(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LBrace, loc)
    }

    private static addRBrace(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RBrace, loc)
    }

    private static addLBracket(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LBracket, loc)
    }

    private static addRBracket(loc?: SubhutiSourceLocation) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RBracket, loc)
    }

    private static generatorMemberExpression(node: SlimeJavascriptMemberExpression) {
        // object.property 或 object[property] 或 object?.property
        this.generatorNode(node.object as SlimeJavascriptExpression)

        if (node.computed) {
            // object[property] 或 object?.[property]
            if (node.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, node.optionalChainingToken?.loc)  // 使用精确 token 位置
            }
            this.addLBracket((node as any).lBracketToken?.loc) // 使用精确 token 位置
            this.generatorNode(node.property)
            this.addRBracket((node as any).rBracketToken?.loc) // 使用精确 token 位置
        } else {
            // object.property 或 object?.property
            if (node.optional) {
                // 可选链：使用 ?. token
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, node.optionalChainingToken?.loc) // 使用精确 token 位置
            } else {
                this.addDot(node.dotToken?.loc) // 使用精确 token 位置
            }
            if (node.property) {
                this.generatorNode(node.property)
            }
        }
    }

    /**
     * 生成可选调用表达式：obj?.method() 或 obj?.()
     */
    private static generatorOptionalCallExpression(node: any) {
        // 输出 callee
        this.generatorNode(node.callee)

        // 如果是可选调用（optional: true），输出 ?.
        if (node.optional) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, node.optionalChainingToken?.loc)  // 使用精确 token 位置
        }

        // 输出参数列表
        this.addLParen(node.lParenToken?.loc) // 使用精确 token 位置
        if (node.arguments && node.arguments.length > 0) {
            node.arguments.forEach((arg: any, index: number) => {
                if (index > 0) {
                    this.addComma()
                }
                // 处理包装结构：{ argument: {...}, commaToken?: {...} }
                const argument = arg.argument || arg
                if (argument.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    this.generatorSpreadElement(argument as SlimeJavascriptSpreadElement)
                } else {
                    this.generatorNode(argument)
                }
            })
        }
        this.addRParen(node.rParenToken?.loc) // 使用精确 token 位置
    }

    /**
     * 生成可选成员访问表达式：obj?.prop 或 obj?.[expr]
     */
    private static generatorOptionalMemberExpression(node: any) {
        // 输出 object
        this.generatorNode(node.object)

        if (node.computed) {
            // obj?.[expr] - 计算属性访问
            if (node.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, node.optionalChainingToken?.loc)  // 使用精确 token 位置
            }
            this.addLBracket(node.lBracketToken?.loc) // 使用精确 token 位置
            this.generatorNode(node.property)
            this.addRBracket(node.rBracketToken?.loc) // 使用精确 token 位置
        } else {
            // obj?.prop - 普通属性访问
            if (node.optional) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OptionalChaining, node.optionalChainingToken?.loc)  // 使用精确 token 位置
            } else {
                this.addDot(node.dotToken?.loc) // 使用精确 token 位置
            }
            this.generatorNode(node.property)
        }
    }

    /**
     * 生成变量声明（内部辅助方法）
     * @param node VariableDeclaration 节点
     * @param addSemicolonAndNewLine 是否添加分号和换行（默认 true）
     */
    private static generatorVariableDeclarationCore(node: SlimeJavascriptVariableDeclaration, addSemicolonAndNewLine: boolean) {
        // 兼容两种 kind 格式：
        // 1. 对象格式: { value: 'const', loc: ... }
        // 2. 字符串格式: 'const'
        const kindValue = typeof node.kind === 'string' ? node.kind : node.kind?.value?.valueOf()
        const kindLoc = typeof node.kind === 'string' ? undefined : node.kind?.loc
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokenMapObj[kindValue], kindLoc)
        this.addSpacing()
        for (let i = 0; i < node.declarations.length; i++) {
            this.generatorNode(node.declarations[i])
            // 添加逗号分隔符（除了最后一个）
            if (i < node.declarations.length - 1) {
                this.addCode(SlimeJavascriptGeneratorTokensObj.Comma)
                this.addSpacing()
            }
        }
        // 根据参数决定是否添加分号和换行
        if (addSemicolonAndNewLine) {
            this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
            this.addNewLine()  // 阶段1：分号后换行
        }
        // 注意：addIndent() 由 generatorNodes 根据是否是最后一个节点来决定
    }

    private static generatorVariableDeclaration(node: SlimeJavascriptVariableDeclaration) {
        // console.log(989898)
        // console.log(node.kind.loc)
        this.generatorVariableDeclarationCore(node, true)
    }

    static get lastMapping() {
        if (this.mappings.length) {
            return this.mappings[this.mappings.length - 1]
        }
        return null
    }


    private static generatorVariableDeclarator(node: SlimeJavascriptVariableDeclarator) {
        this.generatorNode(node.id)
        // 如果有初始化表达式，生成等号和初始化表达式
        if (node.init) {
            this.addSpacing()
            // 优先使用 node.equal，如果没有则使用默认的等号 token
            if (node.equal) {
                this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Eq, node.equal.loc)
            } else {
                this.addCode(SlimeJavascriptGeneratorTokensObj.Eq)
            }
            this.addSpacing()
            this.generatorNode(node.init)
        }
    }

    private static generatorNumberLiteral(node: SlimeJavascriptNumericLiteral) {
        // 数字字面量需要完整的 SubhutiCreateToken 接口（包含 type 属性）
        // 原因：调用 addCodeAndMappings() 需要创建 source map 映射
        // 这样可以在调试时准确定位到原始代码中的数字字面量位置
        // 注意：优先使用 raw 值保持原始格式（如十六进制 0xFF）
        const numValue = node.raw || String(node.value)
        this.addCodeAndMappings({ type: Es6TokenName.NumericLiteral, name: Es6TokenName.NumericLiteral, value: numValue }, node.loc)
    }

    private static generatorStringLiteral(node: SlimeJavascriptStringLiteral) {
        // 字符串字面量需要完整的 SubhutiCreateToken 接口（包含 type 属性）
        // 原因：调用 addCodeAndMappings() 需要创建 source map 映射
        // 这样可以在调试时准确定位到原始代码中的字符串字面量位置
        // 注意：优先使用 raw 值保持原始格式（保留原始引号类型）
        // 如果没有 raw，使用单引号包裹 value
        const strValue = node.raw || `'${node.value}'`
        this.addCodeAndMappings({ type: Es6TokenName.StringLiteral, name: Es6TokenName.StringLiteral, value: strValue }, node.loc)
    }

    /**
     * 生成 ESTree 标准的 Literal 节点
     * Literal 可以是：number, string, boolean, null, RegExp, BigInt
     */
    private static generatorLiteral(node: SlimeJavascriptLiteral) {
        const value = node.value
        const raw = (node as any).raw

        if (value === null) {
            // null 字面量
            this.addCodeAndMappings({ type: 'NullLiteral', name: 'NullLiteral', value: 'null' }, node.loc)
        } else if (typeof value === 'boolean') {
            // boolean 字面量
            const boolValue = value ? 'true' : 'false'
            this.addCodeAndMappings({ type: 'BooleanLiteral', name: 'BooleanLiteral', value: boolValue }, node.loc)
        } else if (typeof value === 'number') {
            // number 字面量（优先使用 raw 保持原始格式）
            const numValue = raw || String(value)
            this.addCodeAndMappings({ type: Es6TokenName.NumericLiteral, name: Es6TokenName.NumericLiteral, value: numValue }, node.loc)
        } else if (typeof value === 'string') {
            // string 字面量（优先使用 raw 保持原始引号格式）
            const strValue = raw || `'${value}'`
            this.addCodeAndMappings({ type: Es6TokenName.StringLiteral, name: Es6TokenName.StringLiteral, value: strValue }, node.loc)
        } else if (typeof value === 'bigint' || (raw && raw.endsWith('n'))) {
            // BigInt 字面量
            const bigintValue = raw || `${value}n`
            this.addCodeAndMappings({ type: 'BigIntLiteral', name: 'BigIntLiteral', value: bigintValue }, node.loc)
        } else if (value instanceof RegExp || (node as any).regex) {
            // RegExp 字面量
            const regexValue = raw || String(value)
            this.addCodeAndMappings({ type: 'RegularExpressionLiteral', name: 'RegularExpressionLiteral', value: regexValue }, node.loc)
        } else {
            // 未知类型，尝试使用 raw 或 String(value)
            const fallbackValue = raw || String(value)
            this.addString(fallbackValue)
        }
    }

    static cstLocationToSlimeJavascriptLocation(cstLocation: SubhutiSourceLocation) {
        if (cstLocation) {
            // 验证 loc 是否有效
            if (!cstLocation.value ||
                cstLocation.value === null ||
                cstLocation.value === 'null' ||
                cstLocation.value === 'undefined') {
                return null;  // 无效 loc，不创建映射
            }

            const sourcePosition: SlimeCodeLocation = {
                type: cstLocation.type,
                index: cstLocation.start.index,
                value: cstLocation.value,
                // length: sourceLength,
                length: cstLocation.end.index - cstLocation.start.index,
                line: cstLocation.start.line,
                column: cstLocation.start.column,
            }
            return sourcePosition
        }
        return null
    }

    private static addCodeAndMappingsBySourcePosition(token: SubhutiCreateToken, sourcePosition: SlimeCodeLocation) {


        this.addMappings(token, sourcePosition)
        this.addCode(token)
    }

    private static addCodeAndMappingsFindLoc(token: SubhutiCreateToken, tokenType: string, findIndex: number) {
        const cstLocation = this.findNextTokenLocByTypeAndIndex(tokenType, findIndex)
        if (cstLocation) {
            this.addCodeAndMappings(token, cstLocation)
        } else {
            // 当无法在源代码中定位到对应位置时，仍然要输出生成代码，避免欠缺括号等 token
            this.addCodeAndMappings(token)
        }
    }

    /**
     * 添加代码并记录 source map 映射
     *
     * 参数要求：
     * - token 必须符合 SubhutiCreateToken 接口，包含：
     *   - type: token 类型（必需）- 用于标识 token 的种类
     *   - name: token 名称（必需）
     *   - value: token 值（必需）- 实际生成的代码内容
     *
     * 使用场景：
     * - 需要在生成代码和原始代码之间建立映射关系
     * - 用于调试时能够定位到原始代码位置
     *
     * 注意：如果不需要 source map，使用 addString() 更高效
     */
    private static addCodeAndMappings(token: SubhutiCreateToken, cstLocation: SubhutiSourceLocation = null) {
        // 空值检查
        if (!token) {
            console.warn('SlimeJavascriptGenerator.addCodeAndMappings: token is undefined')
            return
        }
        if (cstLocation) {
            const sourcePosition = this.cstLocationToSlimeJavascriptLocation(cstLocation)
            if (sourcePosition) {
                // 有效的sourcePosition，记录映射
                this.addCodeAndMappingsBySourcePosition(token, sourcePosition)
            } else {
                // cstLocation存在但无效（如value=null），只添加代码不记录映射
                this.addCode(token)
            }
        } else {
            this.addCode(token)
        }
    }

    /**
     * 添加代码 token（可能记录 source map 映射）
     *
     * 使用场景：
     * 1. 预定义的 token：关键字（if, function, class）、符号（;, {, }）
     * 2. 需要 source map 映射的内容：标识符、字面量等
     * 3. 配合 addCodeAndMappings() 使用
     *
     * 参数要求：
     * - 必须符合 SubhutiCreateToken 接口（包含 type, name, value 属性）
     *
     * 与 addString() 的区别：
     * - addCode()：需要完整的 token 对象，可能记录 source map
     * - addString()：只需字符串，性能更好，不记录 source map
     */
    private static addCode(code: SubhutiCreateToken) {
        this.generateCode += code.value
        this.generateColumn += code.value.length
        this.generateIndex += code.value.length
    }

    /**
     * 添加字符串代码（不记录 source map 映射）
     *
     * 使用场景：
     * 1. 动态内容：运算符（+, -, *, /）、标识符名称、字面量值
     * 2. 格式化字符：空格、换行等
     * 3. 不需要调试映射的内容
     *
     * 与 addCode() 的区别：
     * - addCode()：需要 SubhutiCreateToken 对象，可能记录 source map
     * - addString()：直接字符串拼接，性能更好，不记录 source map
     *
     * 性能优势：避免对象创建和属性访问，性能提升约 2-3倍
     */
    private static addString(str: string) {
        this.generateCode += str
        this.generateColumn += str.length
        this.generateIndex += str.length
    }

    private static addSemicolonAndNewLine() {
        // this.addSemicolon()
        // this.addNewLine()
    }

    private static addSemicolon() {
        this.addString(';')
    }

    private static addNewLine() {
        this.generateCode += '\n'
        this.generateLine++
        this.generateColumn = 0
        this.generateIndex++
    }

    /**
     * 阶段2：添加当前缩进（2个空格 * indent层级）
     */
    private static addIndent() {
        const indentStr = '  '.repeat(this.indent)
        this.addString(indentStr)
    }

    /**
     * @deprecated 使用 addSpacing() 代替，保持代码风格统一
     *
     * 该方法已不再使用，所有空格处理已统一为 addSpacing()
     * 保留此方法仅为了向后兼容（如果有外部调用）
     */
    private static addCodeSpacing() {
        this.addString(' ')
    }


    private static addMappings(generateToken: SubhutiCreateToken, sourcePosition: SlimeCodeLocation) {
        // 移除自动换行逻辑，让 Prettier 来处理格式化
        // 注释掉的代码会导致在不合适的位置插入换行（如 return 和返回值之间）
        // if (this.mappings.length) {
        //   const lastMapping = this.mappings[this.mappings.length - 1]
        //   if (sourcePosition.line > lastMapping.source.line) {
        //     this.addNewLine()
        //   }
        // }

        let generate: SlimeCodeLocation = {
            type: generateToken.name,
            index: this.generateIndex,
            value: generateToken.value,
            length: generateToken.value.length,
            line: this.generateLine,
            column: this.generateColumn,
        }
        if (!sourcePosition) {
            // console.log(989898)
            // console.log(sourcePosition)
            // console.log(generate)
        }
        this.mappings.push({
            source: sourcePosition,
            generate: generate
        })
    }

    /**
     * 生成 if 语句
     * if (test) consequent [else alternate]
     */
    private static generatorIfStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.IfTok, node.ifToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格：if (
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.test)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置

        // 如果 consequent 不是 BlockStatement，需要添加空格
        if (node.consequent.type !== SlimeJavascriptAstTypeName.BlockStatement) {
            this.addSpacing()
        }
        // 阶段2：if 语句后需要换行，传 true
        this.generatorNode(node.consequent, true)

        if (node.alternate) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ElseTok, node.elseToken?.loc) // 使用精确 token 位置
            // 如果 alternate 不是 BlockStatement，需要在 else 后添加空格
            if (node.alternate.type !== SlimeJavascriptAstTypeName.BlockStatement) {
                this.addSpacing()
            }
            // 阶段2：else 语句后需要换行，传 true
            this.generatorNode(node.alternate, true)
        }
    }

    /**
     * 生成 for 语句
     */
    private static generatorForStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ForTok, node.forToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格：for (
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置

        // init 部分：如果是 VariableDeclaration，直接调用不添加分号
        if (node.init) {
            if (node.init.type === SlimeJavascriptAstTypeName.VariableDeclaration) {
                this.generatorVariableDeclarationCore(node.init, false)
            } else {
                this.generatorNode(node.init)
            }
        }

        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Semicolon, node.semicolon1Token?.loc) // 使用精确 token 位置
        if (node.test) this.generatorNode(node.test)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Semicolon, node.semicolon2Token?.loc) // 使用精确 token 位置
        if (node.update) this.generatorNode(node.update)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置

        // 阶段2：for 语句后需要换行，传 true
        if (node.body) {
            this.generatorNode(node.body, true)
        }
    }

    /**
     * 生成 for...in / for...of 语句
     */
    private static generatorForInOfStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ForTok, node.forToken?.loc) // 使用精确 token 位置

        // 如果是 for await...of，输出 await
        if (node.await) {
            this.addSpacing()
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.AwaitTok, node.awaitToken?.loc) // 使用精确 token 位置
        }

        this.addSpacing()
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置

        // 生成 left (变量声明)，但不添加分号
        // 防护：如果 left 为 null，跳过（解析器问题）
        if (!node.left) {
            // 解析器未能正确解析 left，跳过
        } else if (node.left.type === SlimeJavascriptAstTypeName.VariableDeclaration) {
            this.addCode(SlimeJavascriptGeneratorTokenMapObj[node.left.kind.value.valueOf()])
            this.addSpacing()
            // 生成第一个声明的 id
            if (node.left.declarations && node.left.declarations.length > 0) {
                const decl = node.left.declarations[0]
                this.generatorNode(decl.id)
                // ES5 遗留语法: for (var x = init in expr) - 非严格模式允许
                if (decl.init) {
                    this.addSpacing()
                    this.addCode(SlimeJavascriptGeneratorTokensObj.Assign)
                    this.addSpacing()
                    this.generatorNode(decl.init)
                }
            }
        } else {
            this.generatorNode(node.left)
        }

        // 生成 in 或 of
        this.addSpacing()
        if (node.type === SlimeJavascriptAstTypeName.ForInStatement) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.InTok, node.inToken?.loc) // 使用精确 token 位置
        } else {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.OfTok, node.ofToken?.loc) // 使用精确 token 位置
        }
        this.addSpacing()

        // 生成 right (被迭代的对象)
        this.generatorNode(node.right)

        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置

        // 阶段2：for...in/of 语句后需要换行，传 true
        this.generatorNode(node.body, true)
    }

    /**
     * 生成 while 语句
     */
    private static generatorWhileStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.WhileTok, node.whileToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格：while (
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置
        if (node.test) this.generatorNode(node.test)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置

        // 阶段2：while 语句后需要换行，传 true
        if (node.body) {
            this.generatorNode(node.body, true)
        }
    }

    /**
     * 生成 do...while 语句
     */
    private static generatorDoWhileStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.DoTok, node.doToken?.loc) // 使用精确 token 位置
        // do 后紧跟语句体
        if (node.body?.type === SlimeJavascriptAstTypeName.BlockStatement) {
            // BlockStatement 自己处理大括号
            this.generatorNode(node.body)
        } else {
            // 非块语句需要空格分隔，如 do x++; while (...)
            this.addSpacing()
            // 生成语句但不需要末尾换行（由 ExpressionStatement 负责分号）
            this.generatorNode(node.body)
        }
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.WhileTok, node.whileToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格：while (
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.test)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置
        // do...while 语句结尾需要分号
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * 生成 switch 语句
     */
    private static generatorSwitchStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.SwitchTok, node.switchToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格：switch (
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.discriminant)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LBrace, node.lBraceToken?.loc) // 使用精确 token 位置
        if (node.cases) {
            this.generatorNodes(node.cases)
        }
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RBrace, node.rBraceToken?.loc) // 使用精确 token 位置
    }

    /**
     * 生成 switch case 分支
     */
    private static generatorSwitchCase(node: any) {
        if (node.test) {
            // case 分支
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.CaseTok, node.caseToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            this.generatorNode(node.test)
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, node.colonToken?.loc) // 使用精确 token 位置
        } else {
            // default 分支
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.DefaultTok, node.defaultToken?.loc) // 使用精确 token 位置
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, node.colonToken?.loc) // 使用精确 token 位置
        }

        // 生成 consequent 语句
        if (node.consequent && node.consequent.length > 0) {
            this.generatorNodes(node.consequent)
        }
    }

    /**
     * 生成 try 语句
     */
    private static generatorTryStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.TryTok, node.tryToken?.loc) // 使用精确 token 位置
        this.addSpacing()

        // try block 后不换行（后面紧跟 catch 或 finally），传 false
        this.generatorNode(node.block, false)

        if (node.handler) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.CatchTok, node.handler.catchToken?.loc) // 使用精确 token 位置
            // ES2019 允许无参数的 catch：catch { ... }
            if (node.handler.param) {
                this.addSpacing()
                this.addLParen(node.handler.lParenToken?.loc) // 使用精确 token 位置
                this.generatorNode(node.handler.param)
                this.addRParen(node.handler.rParenToken?.loc) // 使用精确 token 位置
            }

            // catch block 后：如果没有 finally，需要换行；否则不换行
            const hasFinalizer = !!node.finalizer
            this.generatorNode(node.handler.body, !hasFinalizer)
        }

        if (node.finalizer) {
            this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.FinallyTok, node.finallyToken?.loc) // 使用精确 token 位置
            this.addSpacing()
            // finally block 后需要换行，传 true
            this.generatorNode(node.finalizer, true)
        }
    }

    /**
     * 生成 catch 子句
     *
     * 注意：虽然大多数情况下 catch 会在 TryStatement 中直接处理，
     * 但某些情况下可能需要单独生成 CatchClause 节点，因此保留此方法。
     */
    private static generatorCatchClause(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.CatchTok, node.catchToken?.loc) // 使用精确 token 位置
        // ES2019 允许无参数的 catch：catch { ... }
        if (node.param) {
            this.addSpacing()
            this.addLParen(node.lParenToken?.loc) // 使用精确 token 位置
            this.generatorNode(node.param)
            this.addRParen(node.rParenToken?.loc) // 使用精确 token 位置
        }
        if (node.body) {
            this.generatorNode(node.body)
        }
    }

    /**
     * 生成 throw 语句
     */
    private static generatorThrowStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ThrowTok, node.throwToken?.loc) // 使用精确 token 位置
        if (node.argument) {
            this.addSpacing()  // throw 和 argument 之间需要空格
            this.generatorNode(node.argument)
        }
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * 生成 break 语句
     */
    private static generatorBreakStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.BreakTok, node.breakToken?.loc) // 使用精确 token 位置
        if (node.label) {
            this.addSpacing()  // break 和 label 之间需要空格
            this.generatorNode(node.label)
        }
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * 生成 continue 语句
     */
    private static generatorContinueStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ContinueTok, node.continueToken?.loc) // 使用精确 token 位置
        if (node.label) {
            this.addSpacing()  // continue 和 label 之间需要空格
            this.generatorNode(node.label)
        }
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * 生成标签语句
     */
    private static generatorLabeledStatement(node: any) {
        this.generatorNode(node.label)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Colon, node.colonToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.body)
    }

    /**
     * 生成 with 语句
     */
    private static generatorWithStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.WithTok, node.withToken?.loc) // 使用精确 token 位置
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.LParen, node.lParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.object)
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.RParen, node.rParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.body)
    }

    /**
     * 生成 debugger 语句
     */
    private static generatorDebuggerStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.DebuggerTok, node.debuggerToken?.loc) // 使用精确 token 位置
        this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
        this.addNewLine()
    }

    /**
     * 生成空语句
     */
    private static generatorEmptyStatement(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.Semicolon, node.semicolonToken?.loc) // 使用精确 token 位置
    }

    /**
     * 生成 export default 声明
     * export default expression
     */
    private static generatorExportDefaultDeclaration(node: any) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ExportTok, node.exportToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.DefaultTok, node.defaultToken?.loc) // 使用精确 token 位置
        this.addSpacing()  // 添加空格
        this.generatorNode(node.declaration)

        // 如果 declaration 不是 FunctionDeclaration 或 ClassDeclaration，则需要分号和换行
        // FunctionDeclaration 和 ClassDeclaration 自己会添加换行
        const declarationType = node.declaration?.type
        if (declarationType !== SlimeJavascriptAstTypeName.FunctionDeclaration &&
            declarationType !== SlimeJavascriptAstTypeName.ClassDeclaration) {
            this.addCode(SlimeJavascriptGeneratorTokensObj.Semicolon)
            this.addNewLine()
        }
    }

    /**
     * 生成 ChainExpression（可选链表达式）
     * 例如: obj?.prop 或 obj?.method()
     */
    private static generatorChainExpression(node: SlimeJavascriptChainExpression) {
        // ChainExpression 只是包装器，直接生成内部表达式
        this.generatorNode(node.expression as SlimeJavascriptExpression)
    }

    /**
     * 生成 ImportExpression（动态导入）
     * 例如: import('./module.js')
     */
    private static generatorImportExpression(node: SlimeJavascriptImportExpression) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.ImportTok, node.importToken?.loc) // 使用精确 token 位置
        this.addLParen(node.lParenToken?.loc) // 使用精确 token 位置
        this.generatorNode(node.source)
        this.addRParen(node.rParenToken?.loc) // 使用精确 token 位置
    }

    /**
     * 生成 StaticBlock（类的静态初始化块）
     * 例如: static { console.log('init') }
     */
    private static generatorStaticBlock(node: SlimeJavascriptStaticBlock) {
        this.addCodeAndMappings(SlimeJavascriptGeneratorTokensObj.StaticTok, (node as any).staticToken?.loc) // 使用精确 token 位置
        this.addSpacing()
        this.addLBrace((node as any).lBraceToken?.loc) // 使用精确 token 位置
        this.addNewLine()
        this.indent++
        this.addIndent()
        this.generatorNodes(node.body)
        this.indent--
        this.addIndent()
        this.addRBrace((node as any).rBraceToken?.loc) // 使用精确 token 位置
        this.addNewLine()
    }
}
