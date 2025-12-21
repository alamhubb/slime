import {
    type SlimeProperty,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimePattern,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { checkCstName, getUtil } from "../core/CstToAstContext";

// 前向声明，用于调用 ExpressionCstToAst 的方法
function createExpressionAst(cst: SubhutiCst): SlimeExpression {
    return getUtil().createExpressionAst(cst);
}

/**
 * 对象属性相关的 CST to AST 转换
 */
export class PropertyCstToAst {
    /**
     * PropertyDefinition CST 到 AST
     */
    static createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        // 防御性检查：如果 children 为空，说明是空对象的情况，不应该被调用
        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children - this should not happen for valid syntax');
        }

        const first = cst.children[0]

        // ES2018: 对象spread {...obj}
        if (first.name === 'Ellipsis' || first.value === '...') {
            // PropertyDefinition -> Ellipsis + AssignmentExpression
            const AssignmentExpressionCst = cst.children[1]
            const argument = getUtil().createAssignmentExpressionAst(AssignmentExpressionCst)

            return {
                type: SlimeNodeType.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any
        } else if (cst.children.length > 2) {
            // PropertyName : AssignmentExpression（完整形式）
            const PropertyNameCst = cst.children[0]
            const AssignmentExpressionCst = cst.children[2]

            const key = PropertyCstToAst.createPropertyNameAst(PropertyNameCst)
            const value = getUtil().createAssignmentExpressionAst(AssignmentExpressionCst)

            const keyAst = SlimeAstUtil.createPropertyAst(key, value)

            // 检查是否是计算属性名
            if (PropertyNameCst.children[0].name === SlimeParser.prototype.ComputedPropertyName?.name) {
                keyAst.computed = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name) {
            // 方法定义（对象中的方法没有static）
            const SlimeMethodDefinition = getUtil().createMethodDefinitionAst(null, first)

            const keyAst = SlimeAstUtil.createPropertyAst(SlimeMethodDefinition.key, SlimeMethodDefinition.value)

            // 继承MethodDefinition的computed标志
            if (SlimeMethodDefinition.computed) {
                keyAst.computed = true
            }

            // 继承MethodDefinition的kind标志（getter/setter/method）
            if (SlimeMethodDefinition.kind === 'get' || SlimeMethodDefinition.kind === 'set') {
                keyAst.kind = SlimeMethodDefinition.kind
            } else {
                // 普通方法使用 method: true
                keyAst.method = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            // 属性简写 {name} -> {name: name}
            const identifierCst = first.children[0] // IdentifierReference -> Identifier
            const identifier = getUtil().createIdentifierAst(identifierCst)
            const keyAst = SlimeAstUtil.createPropertyAst(identifier, identifier)
            keyAst.shorthand = true
            return keyAst
        } else if (first.name === 'CoverInitializedName') {
            // CoverInitializedName: 带默认值的属性简写 {name = 'default'}
            const identifierRefCst = first.children[0]
            const initializerCst = first.children[1]

            const identifierCst = identifierRefCst.children[0]
            const identifier = getUtil().createIdentifierAst(identifierCst)

            // Initializer -> Assign + AssignmentExpression
            const defaultValue = getUtil().createAssignmentExpressionAst(initializerCst.children[1])

            // 创建 AssignmentPattern 作为 value
            const assignmentPattern = {
                type: SlimeNodeType.AssignmentPattern,
                left: identifier,
                right: defaultValue,
                loc: first.loc
            }

            const keyAst = SlimeAstUtil.createPropertyAst(identifier, assignmentPattern as any)
            keyAst.shorthand = true
            return keyAst
        } else {
            throw new Error(`不支持的PropertyDefinition类型: ${first.name}`)
        }
    }

    /**
     * PropertyName CST 到 AST
     */
    static createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        if (!cst || !cst.children || cst.children.length === 0) {
            throw new Error('createPropertyNameAst: invalid cst or no children')
        }

        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.LiteralPropertyName?.name || first.name === 'LiteralPropertyName') {
            return PropertyCstToAst.createLiteralPropertyNameAst(first)
        } else if (first.name === SlimeParser.prototype.ComputedPropertyName?.name || first.name === 'ComputedPropertyName') {
            // [expression]: value
            return getUtil().createAssignmentExpressionAst(first.children[1])
        }
        // 回退：可能first直接就是 LiteralPropertyName 的内容
        return PropertyCstToAst.createLiteralPropertyNameAst(first)
    }

    /**
     * LiteralPropertyName CST 到 AST
     */
    static createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        if (!cst) {
            throw new Error('createLiteralPropertyNameAst: cst is null')
        }

        // 可能是 LiteralPropertyName 节点，也可能直接是内部节点
        let first = cst
        if (cst.name === SlimeParser.prototype.LiteralPropertyName?.name || cst.name === 'LiteralPropertyName') {
            if (!cst.children || cst.children.length === 0) {
                throw new Error('createLiteralPropertyNameAst: LiteralPropertyName has no children')
            }
            first = cst.children[0]
        }

        // IdentifierName (Es2025Parser) - 可能是规则节点或 token
        if (first.name === 'IdentifierName' || first.name === SlimeParser.prototype.IdentifierName?.name) {
            if (first.value !== undefined) {
                return SlimeAstUtil.createIdentifier(first.value, first.loc)
            }
            let current = first
            while (current.children && current.children.length > 0 && current.value === undefined) {
                current = current.children[0]
            }
            if (current.value !== undefined) {
                return SlimeAstUtil.createIdentifier(current.value, current.loc || first.loc)
            }
            throw new Error(`createLiteralPropertyNameAst: Cannot extract value from IdentifierName`)
        }
        // Identifier (旧版或 Es2025)
        else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return getUtil().createIdentifierAst(first)
        }
        // NumericLiteral
        else if (first.name === SlimeTokenConsumer.prototype.NumericLiteral?.name || first.name === 'NumericLiteral' || first.name === 'Number') {
            return getUtil().createNumericLiteralAst(first)
        }
        // StringLiteral
        else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name || first.name === 'StringLiteral' || first.name === 'String') {
            return getUtil().createStringLiteralAst(first)
        }
        // 如果是直接的 token（有 value 属性），创建 Identifier
        else if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`)
    }
}
