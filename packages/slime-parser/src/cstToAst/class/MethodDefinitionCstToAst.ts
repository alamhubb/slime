import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement,
    type SlimeExpression, SlimeIdentifier,
    type SlimeLiteral,
    type SlimeMethodDefinition, SlimeNodeType,
    SlimeTokenCreate,
    type SlimeFunctionParam
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import { AccessorMethodCstToAst } from "./AccessorMethodCstToAst";
import { ClassElementNameCstToAst } from "./ClassElementNameCstToAst";

// 直接使用 ObjectLiteralCstToAst.createClassElementNameAst

/**
 * 方法定义相关的 CST to AST 转换
 * 核心方法保留在此文件，getter/setter 方法已拆分到 AccessorMethodCstToAst
 */
export class MethodDefinitionCstToAst {

    // ==================== 委托到 AccessorMethodCstToAst ====================
    static createGetterMethodAst = AccessorMethodCstToAst.createGetterMethodAst;
    static createGetterMethodFromIdentifier = AccessorMethodCstToAst.createGetterMethodFromIdentifier;
    static createSetterMethodAst = AccessorMethodCstToAst.createSetterMethodAst;
    static createSetterMethodFromIdentifier = AccessorMethodCstToAst.createSetterMethodFromIdentifier;
    static createMethodDefinitionAstInternal = AccessorMethodCstToAst.createMethodDefinitionAstInternal;

    // ==================== 核心方法 ====================

    static isStaticModifier(cst: SubhutiCst | null): boolean {
        return ClassElementNameCstToAst.isStaticModifier(cst)
    }

    static isComputedPropertyName(cst: SubhutiCst): boolean {
        return ClassElementNameCstToAst.isComputedPropertyName(cst)
    }

    /**
     * MethodDefinition CST 到 AST
     */
    static createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children || []
        if (children.length === 0) {
            throw new Error('MethodDefinition has no children')
        }

        const firstChild = children[0]
        const firstName = firstChild.name
        const firstValue = firstChild.value

        // GeneratorMethod: * ClassElementName ...
        if (firstName === 'Asterisk' || firstValue === '*') {
            return MethodDefinitionCstToAst.createGeneratorMethodAst(staticCst, cst)
        }

        // AsyncMethod 或 AsyncGeneratorMethod: async ...
        if (firstName === 'Async' || firstValue === 'async') {
            return MethodDefinitionCstToAst.createAsyncMethodFromChildren(staticCst, cst)
        }

        // getter: get ClassElementName ...
        if (firstName === 'Get' || firstValue === 'get') {
            const secondChild = children[1]
            if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                return MethodDefinitionCstToAst.createGetterMethodAst(staticCst, cst)
            }
        }

        // setter: set ClassElementName ...
        if (firstName === 'Set' || firstValue === 'set') {
            const secondChild = children[1]
            if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                return MethodDefinitionCstToAst.createSetterMethodAst(staticCst, cst)
            }
        }

        // IdentifierNameTok 开头（ES2025 Parser 特有结构）
        if (firstName === 'IdentifierName') {
            if (firstValue === 'get') {
                const secondChild = children[1]
                if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                    return MethodDefinitionCstToAst.createGetterMethodFromIdentifier(staticCst, cst)
                }
            }
            if (firstValue === 'set') {
                const secondChild = children[1]
                if (secondChild && secondChild.name !== 'LParen' && secondChild.value !== '(') {
                    return MethodDefinitionCstToAst.createSetterMethodFromIdentifier(staticCst, cst)
                }
            }
            return MethodDefinitionCstToAst.createMethodFromIdentifier(staticCst, cst)
        }

        // ClassElementName 开头（普通方法）
        if (firstName === SlimeParser.prototype.ClassElementName?.name ||
            firstName === 'ClassElementName' ||
            firstName === SlimeParser.prototype.PropertyName?.name ||
            firstName === 'PropertyName' ||
            firstName === 'LiteralPropertyName') {
            return MethodDefinitionCstToAst.createMethodFromClassElementName(staticCst, cst)
        }

        // 默认处理
        return MethodDefinitionCstToAst.createMethodFromClassElementName(staticCst, cst)
    }

    static createAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children || []
        if (children[1]?.name === 'Asterisk' || children[1]?.value === '*') {
            return MethodDefinitionCstToAst.createAsyncGeneratorMethodAst(staticCst, cst)
        }
        return MethodDefinitionCstToAst.createAsyncMethodAst(staticCst, cst)
    }

    static createMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const firstChild = children[i++]
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression

        if (firstChild.name === 'IdentifierName') {
            key = SlimeAstUtil.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = getUtil().createPropertyNameAst(firstChild)
        } else {
            key = getUtil().createClassElementNameAst(firstChild)
        }

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = getUtil().createFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            body = SlimeAstUtil.createBlockStatement(bodyStatements, children[i].loc, lBraceToken, rBraceToken)
            i++
        } else {
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
            rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isConstructor = key.type === "Identifier" && (key as SlimeIdentifier).name === "constructor" &&
            !MethodDefinitionCstToAst.isStaticModifier(staticCst)

        const isStatic = MethodDefinitionCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)
    }

    /**
     * 从 ClassElementName 创建方法定义
     */
    static createMethodFromClassElementName(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getUtil().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = getUtil().createFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = MethodDefinitionCstToAst.isComputedPropertyName(classElementNameCst)
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !MethodDefinitionCstToAst.isStaticModifier(staticCst)

        const isStatic = MethodDefinitionCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }

    /**
     * Generator 方法
     */
    static createGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 1

        let staticToken: any = undefined
        let asteriskToken: any = SlimeTokenCreate.createAsteriskToken(children[0].loc)
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getUtil().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyName = children[i]?.name
        if (bodyName === 'GeneratorBody' || bodyName === 'FunctionBody' ||
            bodyName === SlimeParser.prototype.GeneratorBody?.name ||
            bodyName === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = MethodDefinitionCstToAst.isComputedPropertyName(classElementNameCst)
        const isStatic = MethodDefinitionCstToAst.isStaticModifier(staticCst)

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, isStatic, cst.loc, staticToken, undefined, undefined, asteriskToken)
    }

    /**
     * Async 方法
     */
    static createAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 1

        let staticToken: any = undefined
        let asyncToken: any = SlimeTokenCreate.createAsyncToken(children[0].loc)
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getUtil().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyName = children[i]?.name
        if (bodyName === 'AsyncFunctionBody' || bodyName === 'FunctionBody' ||
            bodyName === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyName === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = MethodDefinitionCstToAst.isComputedPropertyName(classElementNameCst)
        const isStatic = MethodDefinitionCstToAst.isStaticModifier(staticCst)

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, isStatic, cst.loc, staticToken, undefined, undefined, undefined, asyncToken)
    }

    /**
     * Async Generator 方法
     */
    static createAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 2

        let staticToken: any = undefined
        let asyncToken: any = SlimeTokenCreate.createAsyncToken(children[0].loc)
        let asteriskToken: any = SlimeTokenCreate.createAsteriskToken(children[1].loc)
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getUtil().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = getUtil().createUniqueFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyName = children[i]?.name
        if (bodyName === 'AsyncGeneratorBody' || bodyName === 'FunctionBody' ||
            bodyName === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyName === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = getUtil().createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = MethodDefinitionCstToAst.isComputedPropertyName(classElementNameCst)
        const isStatic = MethodDefinitionCstToAst.isStaticModifier(staticCst)

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, isStatic, cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)
    }
}
