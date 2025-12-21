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
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral;
    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral;
    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): any;
    createFormalParameterAst(cst: SubhutiCst): SlimePattern;
    createBindingElementAst(cst: SubhutiCst): SlimePattern;
};

/**
 * 对象属性相关的 CST to AST 转换
 */
export class PropertyCstToAst {
    /**
     * 创建 PropertyDefinition 的 AST
     */
    static createPropertyDefinitionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProperty {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children - this should not happen for valid syntax');
        }

        const first = cst.children[0]

        // ES2018: 对象spread {...obj}
        if (first.name === 'Ellipsis' || first.value === '...') {
            const AssignmentExpressionCst = cst.children[1]
            const argument = converter.createAssignmentExpressionAst(AssignmentExpressionCst)

            return {
                type: SlimeNodeType.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any
        } else if (cst.children.length > 2) {
            // PropertyName : AssignmentExpression（完整形式）
            const PropertyNameCst = cst.children[0]
            const AssignmentExpressionCst = cst.children[2]

            const key = PropertyCstToAst.createPropertyNameAst(PropertyNameCst, converter)
            const value = converter.createAssignmentExpressionAst(AssignmentExpressionCst)

            const keyAst = SlimeAstUtil.createPropertyAst(key, value)

            // 检查是否是计算属性名
            if (PropertyNameCst.children[0].name === SlimeParser.prototype.ComputedPropertyName?.name) {
                keyAst.computed = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name) {
            // 方法定义（对象中的方法没有static）
            const SlimeMethodDefinition = converter.createMethodDefinitionAst(null, first)

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
            const identifierCst = first.children[0]
            const identifier = converter.createIdentifierAst(identifierCst)
            const keyAst = SlimeAstUtil.createPropertyAst(identifier, identifier)
            keyAst.shorthand = true
            return keyAst
        } else if (first.name === 'CoverInitializedName') {
            // CoverInitializedName: 带默认值的属性简写 {name = 'default'}
            const identifierRefCst = first.children[0]
            const initializerCst = first.children[1]

            const identifierCst = identifierRefCst.children[0]
            const identifier = converter.createIdentifierAst(identifierCst)

            // Initializer -> Assign + AssignmentExpression
            const defaultValue = converter.createAssignmentExpressionAst(initializerCst.children[1])

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
     * 创建 PropertyName 的 AST
     */
    static createPropertyNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        if (!cst || !cst.children || cst.children.length === 0) {
            throw new Error('createPropertyNameAst: invalid cst or no children')
        }

        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.LiteralPropertyName?.name || first.name === 'LiteralPropertyName') {
            return PropertyCstToAst.createLiteralPropertyNameAst(first, converter)
        } else if (first.name === SlimeParser.prototype.ComputedPropertyName?.name || first.name === 'ComputedPropertyName') {
            // [expression]: value
            return converter.createAssignmentExpressionAst(first.children[1])
        }
        // 回退：可能first直接就是 LiteralPropertyName 的内容
        return PropertyCstToAst.createLiteralPropertyNameAst(first, converter)
    }

    /**
     * 创建 LiteralPropertyName 的 AST
     */
    static createLiteralPropertyNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral {
        if (!cst) {
            throw new Error('createLiteralPropertyNameAst: cst is null')
        }

        let first = cst
        if (cst.name === SlimeParser.prototype.LiteralPropertyName?.name || cst.name === 'LiteralPropertyName') {
            if (!cst.children || cst.children.length === 0) {
                throw new Error('createLiteralPropertyNameAst: LiteralPropertyName has no children')
            }
            first = cst.children[0]
        }

        // IdentifierName
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
        // Identifier
        else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return converter.createIdentifierAst(first)
        }
        // NumericLiteral
        else if (first.name === SlimeTokenConsumer.prototype.NumericLiteral?.name || first.name === 'NumericLiteral' || first.name === 'Number') {
            return converter.createNumericLiteralAst(first)
        }
        // StringLiteral
        else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name || first.name === 'StringLiteral' || first.name === 'String') {
            return converter.createStringLiteralAst(first)
        }
        // 如果是直接的 token（有 value 属性），创建 Identifier
        else if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`)
    }

    /**
     * 创建 ComputedPropertyName 的 AST
     */
    static createComputedPropertyNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return converter.createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }

    /**
     * 创建 PropertySetParameterList 的 AST
     */
    static createPropertySetParameterListAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [converter.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [converter.createBindingElementAst(first)]
        }
        return []
    }
}
