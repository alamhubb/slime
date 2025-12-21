import {
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeIdentifier,
    type SlimeBlockStatement, type SlimeFunctionParam,
    type SlimeFunctionDeclaration, type SlimeDeclaration
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";

// 导入拆分出去的类
import { VariableDeclarationCstToAst, setVariableDeclarationCstToAstUtil } from "./VariableDeclarationCstToAst";

// Re-export 拆分出去的类，保持向后兼容
export { VariableDeclarationCstToAst } from "./VariableDeclarationCstToAst";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setDeclarationCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
    // 同时设置拆分出去的类的 util
    setVariableDeclarationCstToAstUtil(util);
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for DeclarationCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 声明相关的 CST to AST 转换
 * 核心方法保留在此文件，变量声明相关方法已拆分到 VariableDeclarationCstToAst
 */
export class DeclarationCstToAst {

    // ==================== 委托到 VariableDeclarationCstToAst ====================
    static createVariableDeclarationFromList = VariableDeclarationCstToAst.createVariableDeclarationFromList;
    static createVariableDeclaratorFromVarDeclaration = VariableDeclarationCstToAst.createVariableDeclaratorFromVarDeclaration;
    static createInitializerAst = VariableDeclarationCstToAst.createInitializerAst;
    static createVariableDeclarationAst = VariableDeclarationCstToAst.createVariableDeclarationAst;
    static createVariableDeclarationListAst = VariableDeclarationCstToAst.createVariableDeclarationListAst;
    static createVariableDeclaratorAst = VariableDeclarationCstToAst.createVariableDeclaratorAst;
    static createLexicalDeclarationAst = VariableDeclarationCstToAst.createLexicalDeclarationAst;
    static createLexicalBindingAst = VariableDeclarationCstToAst.createLexicalBindingAst;

    // ==================== 核心方法 ====================

    static createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const astName = checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return DeclarationCstToAst.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            return DeclarationCstToAst.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            return DeclarationCstToAst.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            return DeclarationCstToAst.createAsyncGeneratorDeclarationAst(first)
        } else {
            throw new Error(`Unsupported HoistableDeclaration type: ${first.name}`)
        }
    }

    static createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

    static createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListAstWrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }

    static createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

    /**
     * LabelledItem CST 到 AST（透传）
     */
    static createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return getUtil().createAstFromCst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }

    /**
     * ForDeclaration CST 到 AST
     */
    static createForDeclarationAst(cst: SubhutiCst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? DeclarationCstToAst.createForBindingAst(forBinding) : null

        return {
            type: SlimeNodeType.VariableDeclaration,
            declarations: [{
                type: SlimeNodeType.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: { type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc },
            loc: cst.loc
        }
    }

    /**
     * ForBinding CST 到 AST
     */
    static createForBindingAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return getUtil().createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return getUtil().createBindingPatternAst(firstChild)
        }
        return null
    }

    /**
     * 创建函数声明 AST
     */
    static createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null
        let isAsync = false
        let isGenerator = false

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name
            const value = child.value || child.loc?.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = getUtil().createBindingIdentifierAst(child)
                continue
            }

            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = getUtil().createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = getUtil().createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
                continue
            }
        }

        if (!body) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

    static createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return DeclarationCstToAst.createVariableDeclarationAst(first);
        } else if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            return DeclarationCstToAst.createLexicalDeclarationAst(first);
        } else if (name === SlimeParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return getUtil().createClassDeclarationAst(first);
        } else if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return DeclarationCstToAst.createFunctionDeclarationAst(first);
        } else if (name === SlimeParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return DeclarationCstToAst.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }
}
