/**
 * MethodDefinitionCstToAst - 方法定义转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    type SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    type SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier,
    SlimeJavascriptLiteral,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptAstTypeName,
    SlimeJavascriptPattern,
    SlimeJavascriptTokenCreateUtils,
    SlimeMethodDefinition, SlimeTokenCreateUtils, SlimeFunctionParam, SlimeBlockStatement, SlimeAstCreateUtils,
    SlimeFunctionExpression, SlimeAstTypeName
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptMethodDefinitionCstToAstSingle {

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 注意：参数顺序是 (staticCst, cst)，与调用保持一�?
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.MethodDefinition?.name);
        const first = cst.children?.[0]

        if (!first) {
            throw new Error('MethodDefinition has no children')
        }

        if (first.name === 'ClassElementName') {
            // MethodDefinition 分支: ClassElementName ( UniqueFormalParameters ) { FunctionBody }
            return SlimeCstToAstUtil.createMethodDefinitionClassElementNameAst(staticCst, cst)
        } else if (first.name === 'Get') {
            // MethodDefinition 分支: get ClassElementName ( ) { FunctionBody }
            return SlimeCstToAstUtil.createMethodDefinitionGetterMethodAst(staticCst, cst)
        } else if (first.name === 'Set') {
            // MethodDefinition 分支: set ClassElementName ( PropertySetParameterList ) { FunctionBody }
            return SlimeCstToAstUtil.createMethodDefinitionSetterMethodAst(staticCst, cst)
        } else if (first.name === SlimeParser.prototype.GeneratorMethod?.name || first.name === 'GeneratorMethod') {
            // MethodDefinition 分支: GeneratorMethod
            return SlimeCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'AsyncMethod' || first.name === SlimeParser.prototype.AsyncMethod?.name) {
            // MethodDefinition 分支: AsyncMethod
            return SlimeCstToAstUtil.createMethodDefinitionAsyncMethodAst(staticCst, first)
        } else if (first.name === 'AsyncGeneratorMethod' || first.name === SlimeParser.prototype.AsyncGeneratorMethod?.name) {
            // MethodDefinition 分支: AsyncGeneratorMethod
            return SlimeCstToAstUtil.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'Asterisk') {
            // MethodDefinition 分支: * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
            return SlimeCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
        } else if (first.name === 'Async') {
            // MethodDefinition 分支: async [no LineTerminator here] ClassElementName ( ... ) { ... }
            return SlimeCstToAstUtil.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
        } else if (first.name === 'IdentifierName' || first.name === 'IdentifierName' ||
            first.name === 'PropertyName' || first.name === 'LiteralPropertyName') {
            // 检查是否是 getter/setter
            if (first.value === 'get' && cst.children[1]?.name === 'ClassElementName') {
                // getter方法：get ClassElementName ( ) { FunctionBody }
                return SlimeCstToAstUtil.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
            } else if (first.value === 'set' && cst.children[1]?.name === 'ClassElementName') {
                // setter方法：set ClassElementName ( PropertySetParameterList ) { FunctionBody }
                return SlimeCstToAstUtil.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
            }
            // MethodDefinition 分支: 直接的标识符作为方法�?
            return SlimeCstToAstUtil.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
        } else {
            throw new Error('不支持的类型: ' + first.name)
        }
    }


    /**
     * 内部辅助方法：创�?MethodDefinition AST
     */
    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        // 查找属性名
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )

        const key = classElementName ? SlimeCstToAstUtil.createClassElementNameAst(classElementName) : null

        // 查找参数
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? SlimeCstToAstUtil.createFormalParametersAst(formalParams) : []

        // 查找函数�?
        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? SlimeCstToAstUtil.createFunctionBodyAst(bodyNode) : []
        const body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode?.loc)

        const value: SlimeFunctionExpression = {
            type: SlimeAstTypeName.FunctionExpression,
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
    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', true, false)
    }


    /**
     * AsyncMethod CST �?AST
     * AsyncMethod -> async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody }
     */
    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', false, true)
    }


    /**
     * AsyncGeneratorMethod CST �?AST
     */
    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeCstToAstUtil.createMethodDefinitionAstInternal(cst, 'method', true, true)
    }


    /**
     * [内部方法] getter 方法
     * 处理 ES2025 Parser �?get ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // GetTok
        if (children[i]?.name === 'Get' || children[i]?.value === 'get') {
            getToken = SlimeJavascriptTokenCreateUtils.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'get', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }


    /**
     * [内部方法] setter 方法
     * 处理 ES2025 Parser �?set ClassElementName ( PropertySetParameterList ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // SetTok
        if (children[i]?.name === 'Set' || children[i]?.value === 'set') {
            setToken = SlimeJavascriptTokenCreateUtils.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = SlimeCstToAstUtil.createPropertySetParameterListAst(children[i])
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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'set', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

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
    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
        let key: SlimeIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression

        if (firstChild.name === 'IdentifierName') {
            // 直接�?token
            key = SlimeJavascriptCreateUtils.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'IdentifierName') {
            // IdentifierName 规则节点
            const tokenCst = firstChild.children[0]
            key = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = SlimeCstToAstUtil.createPropertyNameAst(firstChild)
        } else {
            key = SlimeCstToAstUtil.createClassElementNameAst(firstChild)
        }

        // LParen
        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = SlimeCstToAstUtil.createFormalParametersAstWrapped(children[i])
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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
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
            !SlimeCstToAstUtil.isStaticModifier(staticCst)

        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)

        return methodDef
    }


    /**
     * [内部方法] 普通方法定�?
     * 处理 ES2025 Parser �?ClassElementName ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, FunctionBody?, RBrace]
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

        // ClassElementName
        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = SlimeCstToAstUtil.createFormalParametersAstWrapped(children[i])
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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
            i++
            // RBrace - �?FunctionBody 之后
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            // RBrace - 可能直接在这�?
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(children[i].loc)
            }
            body = SlimeJavascriptCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是计算属�?
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !SlimeCstToAstUtil.isStaticModifier(staticCst)

        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)

        return methodDef
    }


    /**
     * [内部方法] getter 方法 (�?IdentifierNameTok="get" 开�?
     * 处理 ES2025 Parser �?IdentifierNameTok="get" ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="get"
        if (children[i]?.value === 'get') {
            getToken = SlimeJavascriptTokenCreateUtils.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'get', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }


    /**
     * [内部方法] setter 方法 (�?IdentifierNameTok="set" 开�?
     * 处理 ES2025 Parser �?IdentifierNameTok="set" ClassElementName ( ... ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="set"
        if (children[i]?.value === 'set') {
            setToken = SlimeJavascriptTokenCreateUtils.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList 或直接的 BindingIdentifier
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = SlimeCstToAstUtil.createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            // 直接的参数标识符
            params = [SlimeCstToAstUtil.createBindingIdentifierAst(children[i])]
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
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(children[i])
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'set', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }


    /**
     * [内部方法] generator 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeCstToAstUtil.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }


    /**
     * [内部方法] async 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 检查是否是 AsyncGeneratorMethod (async * ...)
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return SlimeCstToAstUtil.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
        }
        return SlimeCstToAstUtil.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }


    /**
     * 处理 PropertySetParameterList
     */
    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeCstToAstUtil.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeCstToAstUtil.createBindingElementAst(first)]
        }
        return []
    }


    /** 返回包装类型的版�?*/
    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeJavascriptCreateUtils.createFunctionParam(SlimeCstToAstUtil.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeJavascriptCreateUtils.createFunctionParam(SlimeCstToAstUtil.createBindingElementAst(first), undefined)]
        }
        return []
    }


    /**
     * [内部方法] generator 方法
     * 处理 ES2025 Parser �?* ClassElementName ( UniqueFormalParameters ) { GeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
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

        // GeneratorBody �?FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)

        return methodDef
    }


    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser �?async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

        // 检�?token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeJavascriptTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
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

        // AsyncFunctionBody �?FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)

        return methodDef
    }


    /**
     * [内部方法] async generator 方法
     * 处理 ES2025 Parser �?async * ClassElementName ( ... ) { AsyncGeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

        // 检�?token
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
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
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

        // AsyncGeneratorBody �?FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
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

        // 创建函数表达式，传�?token 信息
        const functionExpression = SlimeJavascriptCreateUtils.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeJavascriptCreateUtils.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)

        return methodDef
    }


    /**
     * [TypeScript] 重写 createMethodDefinitionClassElementNameAst
     * 支持返回类型注解
     *
     * MethodDefinition: ClassElementName ( UniqueFormalParameters ) TSTypeAnnotation_opt { FunctionBody }
     */
    override createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // 遍历子节点提取各部分
        let classElementNameCst: SubhutiCst | null = null
        let paramsCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'UniqueFormalParameters' || name === SlimeParser.prototype.UniqueFormalParameters?.name ||
                name === 'FormalParameters' || name === SlimeParser.prototype.FormalParameters?.name) {
                paramsCst = child
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                // [TypeScript] 返回类型注解
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('MethodDefinition missing ClassElementName')
        }

        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // 解析参数
        let params: SlimeFunctionParam[] = []
        if (paramsCst) {
            if (paramsCst.name === 'UniqueFormalParameters' || paramsCst.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                params = SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(paramsCst)
            } else {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(paramsCst)
            }
        }

        // 解析函数�?
        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达�?
        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        // [TypeScript] 添加返回类型
        if (returnType) {
            functionExpression.returnType = returnType
        }

        // 检查属�?
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isConstructor = (key as any).type === "Identifier" && (key as any).name === "constructor" &&
            !SlimeCstToAstUtil.isStaticModifier(staticCst)
        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }

    /**
     * [TypeScript] 重写 createMethodDefinitionGetterMethodAst
     * 支持返回类型注解
     */
    override createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        let classElementNameCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'Get' || child.value === 'get') {
                getToken = SlimeTokenCreateUtils.createGetToken(child.loc)
            } else if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('Getter missing ClassElementName')
        }

        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)

        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        if (returnType) {
            functionExpression.returnType = returnType
        }

        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)

        const methodDef = SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, 'get', isComputed, isStatic, cst.loc, staticToken)
        ;(methodDef as any).getToken = getToken

        return methodDef
    }
}

export const SlimeJavascriptMethodDefinitionCstToAst = new SlimeJavascriptMethodDefinitionCstToAstSingle()
