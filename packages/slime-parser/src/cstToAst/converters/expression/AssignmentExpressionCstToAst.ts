import {SubhutiCst} from "subhuti";
import {
    SlimeArrowFunctionExpression, SlimeAssignmentExpression, SlimeAstUtil,
    type SlimeBlockStatement, type SlimeClassExpression,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier,
    SlimeTokenCreate
} from "slime-ast";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export default class AssignmentExpressionCstToAst{

    /**
     * ExpressionBody CST �?AST
     * ExpressionBody -> AssignmentExpression
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }



    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return this.createArrowFunctionAst(child)
            }
            // 否则作为表达式处�?
            return this.createExpressionAst(child)
        }

        // AssignmentExpression -> LeftHandSideExpression + Eq + AssignmentExpression
        // �?LeftHandSideExpression + AssignmentOperator + AssignmentExpression
        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = this.createExpressionAst(leftCst)
        const right = this.createAssignmentExpressionAst(rightCst)
        // AssignmentOperator节点下有子节�?PlusEq/MinusEq�?，需要从children[0].value获取
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: SlimeAssignmentExpression = {
            type: 'AssignmentExpression',
            operator: operator as any,
            left: left as any,
            right: right,
            loc: cst.loc
        }
        return ast
    }


    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = this.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = this.createExpressionAstUncached(cst)
        this.expressionAstCache.set(cst, result)
        return result
    }

    createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeParser.prototype.Expression?.name) {
            // Expression 可能是逗号表达�?(SequenceExpression)
            // 结构: Expression -> AssignmentExpression | Expression, AssignmentExpression
            // 收集所有表达式
            const expressions: SlimeExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    // 跳过逗号 token
                    continue
                }
                expressions.push(this.createExpressionAst(child))
            }

            if (expressions.length === 1) {
                // 单个表达式，直接返回
                left = expressions[0]
            } else if (expressions.length > 1) {
                // 多个表达式，创建 SequenceExpression
                left = {
                    type: 'SequenceExpression',
                    expressions: expressions,
                    loc: cst.loc
                } as any
            } else {
                throw new Error('Expression has no children')
            }
        } else if (astName === SlimeParser.prototype.Statement?.name) {
            left = this.createStatementAst(cst)
        } else if (astName === SlimeParser.prototype.AssignmentExpression?.name) {
            left = this.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ConditionalExpression?.name) {
            left = this.createConditionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalORExpression?.name) {
            left = this.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalANDExpression?.name) {
            left = this.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseORExpression?.name) {
            left = this.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseXORExpression?.name) {
            left = this.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseANDExpression?.name) {
            left = this.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.EqualityExpression?.name) {
            left = this.createEqualityExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.RelationalExpression?.name) {
            left = this.createRelationalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ShiftExpression?.name) {
            left = this.createShiftExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AdditiveExpression?.name) {
            left = this.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MultiplicativeExpression?.name) {
            left = this.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UnaryExpression?.name) {
            left = this.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LeftHandSideExpression?.name) {
            left = this.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.CallExpression?.name) {
            left = this.createCallExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.NewExpression?.name) {
            left = this.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = this.createNewExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MemberExpression?.name) {
            left = this.createMemberExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.PrimaryExpression?.name) {
            left = this.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.YieldExpression?.name) {
            left = this.createYieldExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AwaitExpression?.name) {
            left = this.createAwaitExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.SuperProperty?.name) {
            left = this.createSuperPropertyAst(cst)
        } else if (astName === SlimeParser.prototype.MetaProperty?.name) {
            left = this.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            // ES2020: ShortCircuitExpression = LogicalORExpression | CoalesceExpression
            // ShortCircuitExpression: LogicalANDExpression ShortCircuitExpressionTail?
            left = this.createExpressionAst(cst.children[0])

            // 检查是否有 ShortCircuitExpressionTail (|| 运算�?
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    // 处理尾部：可能是 LogicalORExpressionTail �?CoalesceExpressionTail
                    left = this.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            // ES2020: CoalesceExpression (处理 ?? 运算�?
            left = this.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            // ES2016: ExponentiationExpression (处理 ** 运算�?
            left = this.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            // ES2017+: Cover grammar for CallExpression and async arrow function
            // In non-async-arrow context, this is a CallExpression
            left = this.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            // ES2020: Optional chaining (?.)
            left = this.createOptionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = this.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = this.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            // ES2020: 动�?import()
            left = this.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            // ES2022: PrivateIdentifier (e.g. #x in `#x in obj`)
            left = this.createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }
}