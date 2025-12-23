/**
 * MethodDefinitionCstToAst - 方法定义转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    type SlimeJavascriptBlockStatement, SlimeJavascriptExpression,
    type SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier, SlimeJavascriptLiteral, SlimeJavascriptMethodDefinition, SlimeJavascriptAstTypeName, SlimeJavascriptPattern, SlimeJavascriptTokenCreateUtils
} from "slime-ast";
import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";

import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptMethodDefinitionCstToAstSingle {

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // 注意：参数顺序是 (staticCst, cst)，与调用保持一�?
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.MethodDefinition?.name);
        const first = cst.children?.[0]

        if (!first) {
            throw new Error('MethodDefinition has no children')
        }

        if (first.name === 'ClassElementName') {
            // MethodDefinition 分支: ClassElementName ( UniqueFormalParameters ) { FunctionBody }
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionClassElementNameAst(staticCst, cst)
        } else if (first.name === 'Get') {
            // MethodDefinition 分支: get ClassElementName ( ) { FunctionBody }
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionGetterMethodAst(staticCst, cst)
        } else if (first.name === 'Set') {
            // MethodDefinition 分支: set ClassElementName ( PropertySetParameterList ) { FunctionBody }
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionSetterMethodAst(staticCst, cst)
        } else if (first.name === SlimeJavascriptParser.prototype.GeneratorMethod?.name || first.name === 'GeneratorMethod') {
            // MethodDefinition 分支: GeneratorMethod
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'AsyncMethod' || first.name === SlimeJavascriptParser.prototype.AsyncMethod?.name) {
            // MethodDefinition 分支: AsyncMethod
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionAsyncMethodAst(staticCst, first)
        } else if (first.name === 'AsyncGeneratorMethod' || first.name === SlimeJavascriptParser.prototype.AsyncGeneratorMethod?.name) {
            // MethodDefinition 分支: AsyncGeneratorMethod
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'Asterisk') {
            // MethodDefinition 分支: * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
        } else if (first.name === 'Async') {
            // MethodDefinition 分支: async [no LineTerminator here] ClassElementName ( ... ) { ... }
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
        } else if (first.name === 'IdentifierName' || first.name === 'IdentifierName' ||
            first.name === 'PropertyName' || first.name === 'LiteralPropertyName') {
            // 检查是否是 getter/setter
            if (first.value === 'get' && cst.children[1]?.name === 'ClassElementName') {
                // getter方法：get ClassElementName ( ) { FunctionBody }
                return SlimeJavascriptCstToAstUtil.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
            } else if (first.value === 'set' && cst.children[1]?.name === 'ClassElementName') {
                // setter方法：set ClassElementName ( PropertySetParameterList ) { FunctionBody }
                return SlimeJavascriptCstToAstUtil.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
            }
            // MethodDefinition 分支: 直接的标识符作为方法名
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
        } else {
            throw new Error('不支持的类型: ' + first.name)
        }
    }


    /**
     * 内部辅助方法：创建 MethodDefinition AST
     */
    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeJavascriptMethodDefinition {
        // 查找属性名
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeJavascriptParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )

        const key = classElementName ? SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementName) : null

        // 查找参数
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? SlimeJavascriptCstToAstUtil.createFormalParametersAst(formalParams) : []

        // 查找函数�?
        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyNode) : []
        const body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode?.loc)

        const value: SlimeJavascriptFunctionExpression = {
            type: SlimeJavascriptAstTypeName.FunctionExpression,
            id: null,
            params: params as any,
            body: body,
            generator: generator,
            async: async,
            loc: cst.loc
        } as any

        return SlimeJavascriptCreateUtils.createMethodDefinition(key, value, kind, false, false, cst.loc)
    }


    // ==================== 函数/类相关转换方�?====================

    /**
     * GeneratorMethod CST �?AST
     * GeneratorMethod -> * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
     */
    createGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', true, false)
    }


    /**
     * AsyncMethod CST �?AST
     * AsyncMethod -> async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody }
     */
    createAsyncMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', false, true)
    }


    /**
     * AsyncGeneratorMethod CST �?AST
     */
    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', true, true)
    }


    /**
     * [内部方法] getter 方法
     * 处理 ES2025 Parser 的 get ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // children: [GetTok, ClassElementName, LParen, RParen, LBrace, FunctionBody?, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // GetTok
        if (children[i]?.name === 'Get' || children[i]?.value === 'get') {
            getToken = SlimeJavascriptTokenCreateUtils.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'get', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }


    /**
     * [内部方法] setter 方法
     * 处理 ES2025 Parser 的 set ClassElementName ( PropertySetParameterList ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // children: [SetTok, ClassElementName, LParen, PropertySetParameterList, RParen, LBrace, FunctionBody?, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // SetTok
        if (children[i]?.name === 'Set' || children[i]?.value === 'set') {
            setToken = SlimeJavascriptTokenCreateUtils.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList
        let params: SlimeJavascriptPattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeJavascriptParser.prototype.PropertySetParameterList?.name) {
            params = SlimeJavascriptCstToAstUtil.createPropertySetParameterListAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'set', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }

    // ==================== ES2025 内部辅助方法 ====================
    // 以下方法是处�?ES2025 Parser CST 结构的内部辅助方法，不直接对�?CST 规则�?
    // 存在必要性：ES2025 Parser �?CST 结构�?ES6 有差异，需要专门的处理逻辑�?

    /**
     * [内部方法] 从直接的标识符创建方法定�?
     * 处理 ES2025 Parser �?IdentifierNameTok ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // 第一个子节点是方法名（可能是 IdentifierNameTok, IdentifierName, PropertyName, LiteralPropertyName�?
        const firstChild = children[i++]
        let key: SlimeJavascriptIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression

        if (firstChild.name === 'IdentifierName') {
            // 直接�?token
            key = SlimeJavascriptCreateUtils.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'IdentifierName') {
            // IdentifierName 规则节点
            const tokenCst = firstChild.children[0]
            key = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = SlimeJavascriptCstToAstUtil.createPropertyNameAst(firstChild)
        } else {
            key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(firstChild)
        }

        // LParen
        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeJavascriptFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, children[i].loc, lBraceToken, rBraceToken)
            i++
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // RBrace
        if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
            rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
        }

        // 创建函数表达�?
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && (key as SlimeJavascriptIdentifier).name === "constructor" &&
            !SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)

        return methodDef
    }


    /**
     * [内部方法] 普通方法定�?
     * 处理 ES2025 Parser �?ClassElementName ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // children: [ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, FunctionBody?, RBrace]
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // ClassElementName
        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeJavascriptFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace - 在 FunctionBody 之后
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            // RBrace - 可能直接在这里
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是计算属性
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)

        return methodDef
    }


    /**
     * [内部方法] getter 方法 (以 IdentifierNameTok="get" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="get" ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="get"
        if (children[i]?.value === 'get') {
            getToken = SlimeJavascriptTokenCreateUtils.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'get', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }


    /**
     * [内部方法] setter 方法 (以 IdentifierNameTok="set" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="set" ClassElementName ( ... ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="set"
        if (children[i]?.value === 'set') {
            setToken = SlimeJavascriptTokenCreateUtils.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList 或直接的 BindingIdentifier
        let params: SlimeJavascriptPattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeJavascriptParser.prototype.PropertySetParameterList?.name) {
            params = SlimeJavascriptCstToAstUtil.createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            // 直接的参数标识符
            params = [SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(children[i])]
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeJavascriptBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'set', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }


    /**
     * [内部方法] generator 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }


    /**
     * [内部方法] async 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // 检查是否是 AsyncGeneratorMethod (async * ...)
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return SlimeJavascriptCstToAstUtil.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
        }
        return SlimeJavascriptCstToAstUtil.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }


    /**
     * 处理 PropertySetParameterList
     */
    createPropertySetParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeJavascriptParser.prototype.FormalParameter?.name) {
            return [SlimeJavascriptCstToAstUtil.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeJavascriptParser.prototype.BindingElement?.name) {
            return [SlimeJavascriptCstToAstUtil.createBindingElementAst(first)]
        }
        return []
    }


    /** 返回包装类型的版�?*/
    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeJavascriptParser.prototype.FormalParameter?.name) {
            return [SlimeJavascriptCreateUtils.createFunctionParam(SlimeJavascriptCstToAstUtil.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeJavascriptParser.prototype.BindingElement?.name) {
            return [SlimeJavascriptCreateUtils.createFunctionParam(SlimeJavascriptCstToAstUtil.createBindingElementAst(first), undefined)]
        }
        return []
    }


    /**
     * [内部方法] generator 方法
     * 处理 ES2025 Parser 的 * ClassElementName ( UniqueFormalParameters ) { GeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // GeneratorMethod children: [Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, GeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimeJavascriptPattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // GeneratorBody 或 FunctionBody
        let body: SlimeJavascriptBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeJavascriptParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)

        return methodDef
    }


    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser 的 async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // AsyncMethod children: [AsyncTok, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimeJavascriptPattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncFunctionBody 或 FunctionBody
        let body: SlimeJavascriptBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeJavascriptParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)

        return methodDef
    }


    /**
     * [内部方法] async generator 方法
     * 处理 ES2025 Parser 的 async * ClassElementName ( ... ) { AsyncGeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        // AsyncGeneratorMethod children: [AsyncTok, Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(children[i].loc)
            i++
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimeJavascriptPattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeJavascriptParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncGeneratorBody 或 FunctionBody
        let body: SlimeJavascriptBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeJavascriptParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)

        return methodDef
    }


}

export const SlimeJavascriptMethodDefinitionCstToAst = new SlimeJavascriptMethodDefinitionCstToAstSingle()
