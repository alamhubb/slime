import {
    type SlimeFunctionDeclaration,
    type SlimeFunctionExpression,
    type SlimeArrowFunctionExpression,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
    type SlimeRestElement,
    type SlimeFunctionParam,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createExpressionAst(cst: SubhutiCst): SlimeExpression;
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createBindingPatternAst(cst: SubhutiCst): SlimePattern;
    createBindingElementAst(cst: SubhutiCst): SlimePattern | SlimeIdentifier;
    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement;
    createStatementListAst(cst: SubhutiCst): any[];
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement;
};

/**
 * 函数相关的 CST to AST 转换
 */
export class FunctionCstToAst {
    /**
     * 创建 FunctionDeclaration 的 AST
     */
    static createFunctionDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FunctionDeclaration?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])
        let isAsync = false
        let isGenerator = false

        // Token fields
        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 FunctionExpression 的 AST
     */
    static createFunctionExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FunctionExpression?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])
        let isAsync = false
        let isGenerator = false

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionExpression(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 FormalParameters 的 AST（包装类型）
     */
    static createFormalParametersAstWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FormalParameters?.name);

        const params: SlimeFunctionParam[] = []
        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name

            // 跳过括号
            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            // 处理逗号
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameterList
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...FunctionCstToAst.createFormalParameterListWrapped(child, converter))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFunctionRestParameterAst(child, converter)
                hasParam = true
                continue
            }

            // FormalParameter
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFormalParameterAst(child, converter)
                hasParam = true
                continue
            }

            // BindingElement
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = converter.createBindingElementAst(child)
                hasParam = true
                continue
            }

            // BindingIdentifier
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = converter.createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        // 处理最后一个参数
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }


    /**
     * 创建 FormalParameterList 的 AST（包装类型）
     */
    static createFormalParameterListWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        const params: SlimeFunctionParam[] = []
        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name

            // 处理逗号
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameter
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFormalParameterAst(child, converter)
                hasParam = true
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFunctionRestParameterAst(child, converter)
                hasParam = true
            }
        }

        // 处理最后一个参数
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 创建 FormalParameter 的 AST
     */
    static createFormalParameterAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimePattern {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FormalParameter?.name);

        const first = cst.children?.[0]
        if (!first) throw new Error('FormalParameter has no children')

        if (first.name === SlimeParser.prototype.BindingElement?.name || first.name === 'BindingElement') {
            return converter.createBindingElementAst(first)
        }

        return converter.createBindingIdentifierAst(first)
    }

    /**
     * 创建 FunctionRestParameter 的 AST
     */
    static createFunctionRestParameterAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeRestElement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FunctionRestParameter?.name);

        const bindingRestElement = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingRestElement?.name || ch.name === 'BindingRestElement'
        )

        if (bindingRestElement) {
            return converter.createBindingRestElementAst(bindingRestElement)
        }

        // 备用：直接处理 ... BindingIdentifier 结构
        let argument: SlimePattern | null = null
        for (const child of cst.children || []) {
            if (child.value === '...' || child.name === 'Ellipsis') continue
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = converter.createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = converter.createBindingPatternAst(child)
            }
        }

        if (argument) {
            return SlimeAstUtil.createRestElement(argument, cst.loc)
        }

        throw new Error('FunctionRestParameter missing argument')
    }


    /**
     * 创建 FunctionBody 的 AST
     */
    static createFunctionBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        // 支持多种 body 名称
        const validNames = [
            SlimeParser.prototype.FunctionBody?.name,
            'FunctionBody',
            SlimeParser.prototype.AsyncFunctionBody?.name,
            'AsyncFunctionBody',
            SlimeParser.prototype.GeneratorBody?.name,
            'GeneratorBody',
            SlimeParser.prototype.AsyncGeneratorBody?.name,
            'AsyncGeneratorBody'
        ]

        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected FunctionBody variant, got ${cst.name}`)
        }

        const stmtListCst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FunctionStatementList?.name ||
            ch.name === 'FunctionStatementList' ||
            ch.name === SlimeParser.prototype.StatementList?.name ||
            ch.name === 'StatementList'
        )

        if (stmtListCst) {
            return converter.createStatementListAst(stmtListCst)
        }

        return []
    }

    /**
     * 创建 ArrowFunction 的 AST
     */
    static createArrowFunctionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeArrowFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);

        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | SlimeExpression = SlimeAstUtil.createBlockStatement([])
        let expression = false
        let arrowToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children || []) {
            const name = child.name

            if (name === 'Arrow' || child.value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(child.loc)
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === SlimeParser.prototype.ArrowParameters?.name || name === 'ArrowParameters') {
                params = FunctionCstToAst.createArrowParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.ConciseBody?.name || name === 'ConciseBody') {
                const result = FunctionCstToAst.createConciseBodyAst(child, converter)
                body = result.body
                expression = result.expression
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params = [SlimeAstUtil.createFunctionParam(converter.createBindingIdentifierAst(child), undefined)]
            }
        }

        return SlimeAstUtil.createArrowFunctionExpression(
            params, body, expression, false, cst.loc,
            arrowToken, lParenToken, rParenToken
        )
    }


    /**
     * 创建 ArrowParameters 的 AST（包装类型）
     */
    static createArrowParametersAstWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        const first = cst.children?.[0]
        if (!first) return []

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier') {
            return [SlimeAstUtil.createFunctionParam(converter.createBindingIdentifierAst(first), undefined)]
        }

        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            first.name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            return FunctionCstToAst.extractArrowParamsFromCoverWrapped(first, converter)
        }

        if (first.name === SlimeParser.prototype.ArrowFormalParameters?.name || first.name === 'ArrowFormalParameters') {
            return FunctionCstToAst.createArrowFormalParametersAstWrapped(first, converter)
        }

        return []
    }

    /**
     * 从 CoverParenthesizedExpressionAndArrowParameterList 提取箭头函数参数（包装类型）
     */
    static extractArrowParamsFromCoverWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        const params: SlimeFunctionParam[] = []
        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (const child of cst.children || []) {
            const name = child.name

            // 跳过括号
            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            // 处理逗号
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = converter.createBindingIdentifierAst(child)
                hasParam = true
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = converter.createBindingPatternAst(child)
                hasParam = true
            } else if (name === SlimeParser.prototype.BindingRestElement?.name || name === 'BindingRestElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = converter.createBindingRestElementAst(child)
                hasParam = true
            }
        }

        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 创建 ArrowFormalParameters 的 AST（包装类型）
     */
    static createArrowFormalParametersAstWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        const uniqueParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name || ch.name === 'UniqueFormalParameters'
        )

        if (uniqueParams) {
            return FunctionCstToAst.createFormalParametersAstWrapped(uniqueParams, converter)
        }

        return []
    }


    /**
     * 创建 ConciseBody 的 AST
     */
    static createConciseBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): { body: SlimeBlockStatement | SlimeExpression; expression: boolean } {
        const first = cst.children?.[0]
        if (!first) {
            return { body: SlimeAstUtil.createBlockStatement([]), expression: false }
        }

        // 如果是 FunctionBody，返回 BlockStatement
        if (first.name === SlimeParser.prototype.FunctionBody?.name || first.name === 'FunctionBody') {
            const statements = FunctionCstToAst.createFunctionBodyAst(first, converter)
            return { body: SlimeAstUtil.createBlockStatement(statements, first.loc), expression: false }
        }

        // 如果是 ExpressionBody 或 AssignmentExpression，返回表达式
        if (first.name === SlimeParser.prototype.ExpressionBody?.name || first.name === 'ExpressionBody') {
            const exprCst = first.children?.[0]
            if (exprCst) {
                return { body: converter.createAssignmentExpressionAst(exprCst), expression: true }
            }
        }

        if (first.name === SlimeParser.prototype.AssignmentExpression?.name || first.name === 'AssignmentExpression') {
            return { body: converter.createAssignmentExpressionAst(first), expression: true }
        }

        // 默认作为表达式处理
        return { body: converter.createExpressionAst(first), expression: true }
    }

    /**
     * 创建 AsyncFunctionDeclaration 的 AST
     */
    static createAsyncFunctionDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AsyncFunctionDeclaration?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.AsyncFunctionBody?.name || name === 'AsyncFunctionBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, false, true, cst.loc,
            functionToken, asyncToken, undefined, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 AsyncFunctionExpression 的 AST
     */
    static createAsyncFunctionExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AsyncFunctionExpression?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.AsyncFunctionBody?.name || name === 'AsyncFunctionBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionExpression(
            functionName, params, body, false, true, cst.loc,
            functionToken, asyncToken, undefined, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

    /**
     * 创建 AsyncArrowFunction 的 AST
     */
    static createAsyncArrowFunctionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeArrowFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AsyncArrowFunction?.name);

        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | SlimeExpression = SlimeAstUtil.createBlockStatement([])
        let expression = false
        let arrowToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children || []) {
            const name = child.name
            const value = child.value

            if (name === 'Arrow' || value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === SlimeParser.prototype.AsyncArrowHead?.name || name === 'AsyncArrowHead') {
                params = FunctionCstToAst.createAsyncArrowHeadAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.AsyncConciseBody?.name || name === 'AsyncConciseBody') {
                const result = FunctionCstToAst.createConciseBodyAst(child, converter)
                body = result.body
                expression = result.expression
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params = [SlimeAstUtil.createFunctionParam(converter.createBindingIdentifierAst(child), undefined)]
            }
        }

        return SlimeAstUtil.createArrowFunctionExpression(
            params, body, expression, true, cst.loc,
            arrowToken, lParenToken, rParenToken, asyncToken
        )
    }


    /**
     * 创建 AsyncArrowHead 的 AST（包装类型）
     */
    static createAsyncArrowHeadAstWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionParam[] {
        for (const child of cst.children || []) {
            const name = child.name

            if (name === SlimeParser.prototype.ArrowFormalParameters?.name || name === 'ArrowFormalParameters') {
                return FunctionCstToAst.createArrowFormalParametersAstWrapped(child, converter)
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                return [SlimeAstUtil.createFunctionParam(converter.createBindingIdentifierAst(child), undefined)]
            }

            if (name === SlimeParser.prototype.CoverCallExpressionAndAsyncArrowHead?.name ||
                name === 'CoverCallExpressionAndAsyncArrowHead') {
                // 从 cover grammar 提取参数
                return FunctionCstToAst.extractArrowParamsFromCoverWrapped(child, converter)
            }
        }

        return []
    }

    /**
     * 创建 GeneratorDeclaration 的 AST
     */
    static createGeneratorDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.GeneratorDeclaration?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.GeneratorBody?.name || name === 'GeneratorBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, true, false, cst.loc,
            functionToken, undefined, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 GeneratorExpression 的 AST
     */
    static createGeneratorExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.GeneratorExpression?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.GeneratorBody?.name || name === 'GeneratorBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionExpression(
            functionName, params, body, true, false, cst.loc,
            functionToken, undefined, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

    /**
     * 创建 AsyncGeneratorDeclaration 的 AST
     */
    static createAsyncGeneratorDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AsyncGeneratorDeclaration?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.AsyncGeneratorBody?.name || name === 'AsyncGeneratorBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, true, true, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 AsyncGeneratorExpression 的 AST
     */
    static createAsyncGeneratorExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeFunctionExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AsyncGeneratorExpression?.name);

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement = SlimeAstUtil.createBlockStatement([])

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            } else if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            } else if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child, converter)
            } else if (name === SlimeParser.prototype.AsyncGeneratorBody?.name || name === 'AsyncGeneratorBody' ||
                       name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child, converter)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        return SlimeAstUtil.createFunctionExpression(
            functionName, params, body, true, true, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }
}
