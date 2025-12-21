import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement,
    type SlimeMethodDefinition, SlimeNodeType,
    SlimeTokenCreate,
    type SlimeFunctionParam
} from "slime-ast";
import SlimeParser from "../SlimeParser.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setAccessorMethodCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for AccessorMethodCstToAst');
    }
    return _slimeCstToAstUtil;
}

// 延迟导入以避免循环依赖
let _ClassCstToAst: any = null;
function getClassCstToAst() {
    if (!_ClassCstToAst) {
        _ClassCstToAst = require('./ClassCstToAst.ts').ClassCstToAst;
    }
    return _ClassCstToAst;
}

let _MethodDefinitionCstToAst: any = null;
function getMethodDefinitionCstToAst() {
    if (!_MethodDefinitionCstToAst) {
        _MethodDefinitionCstToAst = require('./MethodDefinitionCstToAst.ts').MethodDefinitionCstToAst;
    }
    return _MethodDefinitionCstToAst;
}

/**
 * Accessor 方法（getter/setter）相关的 CST to AST 转换
 */
export class AccessorMethodCstToAst {

    /**
     * Getter 方法
     */
    static createGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 1 // 跳过 'get'

        let staticToken: any = undefined
        let getToken: any = SlimeTokenCreate.createGetToken(children[0].loc)
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getClassCstToAst().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
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
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = getMethodDefinitionCstToAst().isComputedPropertyName(classElementNameCst)
        const isStatic = getMethodDefinitionCstToAst().isStaticModifier(staticCst)

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, isStatic, cst.loc, staticToken, getToken)
    }

    /**
     * Getter 方法（从 IdentifierName 开头）
     */
    static createGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return AccessorMethodCstToAst.createGetterMethodAst(staticCst, cst)
    }

    /**
     * Setter 方法
     */
    static createSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 1 // 跳过 'set'

        let staticToken: any = undefined
        let setToken: any = SlimeTokenCreate.createSetToken(children[0].loc)
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = getClassCstToAst().createClassElementNameAst(classElementNameCst)

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = getUtil().createPropertySetParameterListAstWrapped(children[i])
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
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = getMethodDefinitionCstToAst().isComputedPropertyName(classElementNameCst)
        const isStatic = getMethodDefinitionCstToAst().isStaticModifier(staticCst)

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, isStatic, cst.loc, staticToken, undefined, setToken)
    }

    /**
     * Setter 方法（从 IdentifierName 开头）
     */
    static createSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return AccessorMethodCstToAst.createSetterMethodAst(staticCst, cst)
    }

    /**
     * 内部辅助方法：创建 MethodDefinition AST
     */
    static createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )
        if (!classElementName) {
            throw new Error('MethodDefinition missing ClassElementName/PropertyName')
        }

        const key = getClassCstToAst().createClassElementNameAst(classElementName)
        const isComputed = getMethodDefinitionCstToAst().isComputedPropertyName(classElementName)

        let params: SlimeFunctionParam[] = []
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        if (formalParams) {
            params = getUtil().createFormalParametersAstWrapped(formalParams)
        }

        let body: SlimeBlockStatement
        const funcBody = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FunctionBody?.name ||
            ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'GeneratorBody' ||
            ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'AsyncFunctionBody' ||
            ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'AsyncGeneratorBody'
        )
        if (funcBody) {
            const bodyStatements = getUtil().createFunctionBodyAst(funcBody)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, funcBody.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, generator, async, cst.loc
        )

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, false, cst.loc)
    }
}
