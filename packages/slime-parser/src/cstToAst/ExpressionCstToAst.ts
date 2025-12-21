import {
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeSpreadElement,
    type SlimeCallExpression,
    type SlimeMemberExpression,
    type SlimeSuper,
    type SlimeThisExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createExpressionAst(cst: SubhutiCst): SlimeExpression;
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier;
    createLiteralAst(cst: SubhutiCst): SlimeLiteral;
    createArrayLiteralAst(cst: SubhutiCst): SlimeExpression;
    createObjectLiteralAst(cst: SubhutiCst): SlimeExpression;
    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression;
    createFunctionExpressionAst(cst: SubhutiCst): SlimeExpression;
    createClassExpressionAst(cst: SubhutiCst): SlimeExpression;
    createArrowFunctionAst(cst: SubhutiCst): SlimeExpression;
    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeExpression;
    createGeneratorExpressionAst(cst: SubhutiCst): SlimeExpression;
    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeExpression;
    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeExpression;
    createArgumentsAst(cst: SubhutiCst): any[];
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createRegExpLiteralAst(cst: SubhutiCst): SlimeLiteral;
    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression;
    createSuperCallAst(cst: SubhutiCst): SlimeExpression;
    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression;
    createImportCallAst(cst: SubhutiCst): SlimeExpression;
    createYieldExpressionAst(cst: SubhutiCst): SlimeExpression;
    createAwaitExpressionAst(cst: SubhutiCst): SlimeExpression;
    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression;
};

/**
 * 表达式相关的 CST to AST 转换
 */
export class ExpressionCstToAst {
    /**
     * 创建 PrimaryExpression 的 AST
     */
    static createPrimaryExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name);
        const first = cst.children[0]
        const name = first.name

        // this
        if (name === 'This' || first.value === 'this') {
            return SlimeAstUtil.createThisExpression(first.loc) as SlimeThisExpression
        }

        // IdentifierReference
        if (name === SlimeParser.prototype.IdentifierReference?.name || name === 'IdentifierReference') {
            const child = first.children?.[0]
            if (child) {
                return converter.createIdentifierAst(child)
            }
            throw new Error('IdentifierReference has no children')
        }

        // Literal
        if (name === SlimeParser.prototype.Literal?.name || name === 'Literal') {
            return converter.createLiteralAst(first) as SlimeExpression
        }

        // ArrayLiteral
        if (name === SlimeParser.prototype.ArrayLiteral?.name || name === 'ArrayLiteral') {
            return converter.createArrayLiteralAst(first)
        }

        // ObjectLiteral
        if (name === SlimeParser.prototype.ObjectLiteral?.name || name === 'ObjectLiteral') {
            return converter.createObjectLiteralAst(first)
        }

        // FunctionExpression
        if (name === SlimeParser.prototype.FunctionExpression?.name || name === 'FunctionExpression') {
            return converter.createFunctionExpressionAst(first)
        }

        // ClassExpression
        if (name === SlimeParser.prototype.ClassExpression?.name || name === 'ClassExpression') {
            return converter.createClassExpressionAst(first)
        }

        // GeneratorExpression
        if (name === SlimeParser.prototype.GeneratorExpression?.name || name === 'GeneratorExpression') {
            return converter.createGeneratorExpressionAst(first)
        }

        // AsyncFunctionExpression
        if (name === SlimeParser.prototype.AsyncFunctionExpression?.name || name === 'AsyncFunctionExpression') {
            return converter.createAsyncFunctionExpressionAst(first)
        }

        // AsyncGeneratorExpression
        if (name === SlimeParser.prototype.AsyncGeneratorExpression?.name || name === 'AsyncGeneratorExpression') {
            return converter.createAsyncGeneratorExpressionAst(first)
        }

        // RegularExpressionLiteral
        if (name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name || name === 'RegularExpressionLiteral') {
            return converter.createRegExpLiteralAst(first) as SlimeExpression
        }

        // TemplateLiteral
        if (name === SlimeParser.prototype.TemplateLiteral?.name || name === 'TemplateLiteral') {
            return converter.createTemplateLiteralAst(first)
        }

        // CoverParenthesizedExpressionAndArrowParameterList
        if (name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            return converter.createCoverParenthesizedExpressionAndArrowParameterListAst(first)
        }

        // ParenthesizedExpression (旧版兼容)
        if (name === 'ParenthesizedExpression') {
            return ExpressionCstToAst.createParenthesizedExpressionAst(first, converter)
        }

        throw new Error(`Unknown PrimaryExpression type: ${name}`)
    }

    /**
     * 创建 ParenthesizedExpression 的 AST
     */
    static createParenthesizedExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        // 查找内部表达式
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return converter.createExpressionAst(child)
            }
        }

        // 尝试查找嵌套的表达式
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' &&
            ch.value !== '(' && ch.value !== ')'
        )
        if (innerExpr) {
            return converter.createExpressionAst(innerExpr)
        }
        throw new Error('ParenthesizedExpression has no inner expression')
    }

    /**
     * 创建 ConditionalExpression 的 AST
     */
    static createConditionalExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);

        if (cst.children.length === 1) {
            return converter.createExpressionAst(cst.children[0])
        }

        // ConditionalExpression: test ? consequent : alternate
        const test = converter.createExpressionAst(cst.children[0])
        let consequent: SlimeExpression | null = null
        let alternate: SlimeExpression | null = null

        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]
            if (child.name === 'Question' || child.value === '?') {
                continue
            } else if (child.name === 'Colon' || child.value === ':') {
                continue
            } else if (!consequent) {
                consequent = converter.createAssignmentExpressionAst(child)
            } else {
                alternate = converter.createAssignmentExpressionAst(child)
            }
        }

        return {
            type: SlimeNodeType.ConditionalExpression,
            test,
            consequent: consequent!,
            alternate: alternate!,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 LogicalORExpression 的 AST
     */
    static createLogicalORExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 LogicalANDExpression 的 AST
     */
    static createLogicalANDExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 BitwiseORExpression 的 AST
     */
    static createBitwiseORExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 BitwiseXORExpression 的 AST
     */
    static createBitwiseXORExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 BitwiseANDExpression 的 AST
     */
    static createBitwiseANDExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 EqualityExpression 的 AST
     */
    static createEqualityExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);

        if (cst.children.length > 1) {
            const left = converter.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any
            const right = converter.createExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 RelationalExpression 的 AST
     */
    static createRelationalExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 ShiftExpression 的 AST
     */
    static createShiftExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 AdditiveExpression 的 AST
     */
    static createAdditiveExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 MultiplicativeExpression 的 AST
     */
    static createMultiplicativeExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);

        if (cst.children.length > 1) {
            let left = converter.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = converter.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 ExponentiationExpression 的 AST
     */
    static createExponentiationExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        if (cst.children.length === 1) {
            return converter.createExpressionAst(cst.children[0])
        }

        // 右结合：a ** b ** c = a ** (b ** c)
        const left = converter.createExpressionAst(cst.children[0])
        const right = ExpressionCstToAst.createExponentiationExpressionAst(cst.children[2], converter)

        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 UnaryExpression 的 AST
     */
    static createUnaryExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        if (!cst.children || cst.children.length === 0) {
            throw new Error('UnaryExpression CST没有children')
        }

        if (cst.children.length === 1) {
            const child = cst.children[0]
            if (child.value !== undefined && !child.children) {
                throw new Error(`UnaryExpression CST不完整：只有运算符token '${child.name}'`)
            }
            return converter.createExpressionAst(child)
        }

        const operatorToken = cst.children[0]
        const argumentCst = cst.children[1]

        const operatorMap: { [key: string]: string } = {
            'Exclamation': '!',
            'Plus': '+',
            'Minus': '-',
            'Tilde': '~',
            'Typeof': 'typeof',
            'Void': 'void',
            'Delete': 'delete',
            'PlusPlus': '++',
            'MinusMinus': '--',
        }

        const operator = operatorMap[operatorToken.name] || operatorToken.value
        const argument = converter.createExpressionAst(argumentCst)

        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 UpdateExpression 的 AST
     */
    static createUpdateExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        if (cst.children.length > 1) {
            const first = cst.children[0]
            const isPrefix = first.value === '++' || first.value === '--'

            if (isPrefix) {
                const operator = first.value
                const argument = converter.createExpressionAst(cst.children[1])
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any
            } else {
                const argument = converter.createExpressionAst(first)
                const operator = cst.children[1].value
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: false,
                    loc: cst.loc
                } as any
            }
        }
        return converter.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 SpreadElement 的 AST
     */
    static createSpreadElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeSpreadElement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);

        const assignmentExpr = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )

        if (!assignmentExpr) {
            throw new Error('SpreadElement missing AssignmentExpression')
        }

        const argument = converter.createAssignmentExpressionAst(assignmentExpr)
        return SlimeAstUtil.createSpreadElement(argument, cst.loc)
    }

    /**
     * 创建 CoalesceExpression 的 AST (ES2020)
     */
    static createCoalesceExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        if (cst.children.length === 1) {
            return converter.createExpressionAst(cst.children[0])
        }

        let left = converter.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const right = converter.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeNodeType.LogicalExpression,
                operator: '??',
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return left
    }
}
