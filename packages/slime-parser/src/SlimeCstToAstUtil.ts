import {
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimePattern,
} from "slime-ast";
import { SubhutiCst } from "subhuti";

// 导入子模块静态方法
import { ArrowFunctionCstToAst } from "./cstToAst/converters/function/ArrowFunctionCstToAst";
import { BinaryExpressionCstToAst } from "./cstToAst/converters/expression/BinaryExpressionCstToAst";
import { PrimaryExpressionCstToAst } from "./cstToAst/converters/expression/PrimaryExpressionCstToAst";

// 重新导出工具类
export { SlimeAstUtils } from "./cstToAst/SlimeAstUtils";

/**
 * CST 到 AST 转换器
 *
 * ## 两层架构设计
 *
 * ### 第一层：AST 工厂层 (SlimeNodeCreate.ts / SlimeAstUtil)
 * - 与 ESTree AST 节点类型一一对应的纯粹创建方法
 * - 不依赖 CST 结构，只接收参数创建节点
 *
 * ### 第二层：CST 转换层 (本类 + cstToAst/converters/)
 * - 与 CST 规则一一对应的转换方法
 * - 解析 CST 结构，提取信息，调用 AST 工厂层
 * - 子模块使用静态方法，通过导入本模块的单例实例来调用其他转换方法
 */
export class SlimeCstToAst {
    // ============================================
    // 箭头函数相关 - 委托给 ArrowFunctionCstToAst
    // ============================================
    
    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowParametersAst(cst);
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return ArrowFunctionCstToAst.createConciseBodyAst(cst);
    }

    // ============================================
    // 表达式相关 - 委托给 PrimaryExpressionCstToAst
    // ============================================

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createConditionalExpressionAst(cst);
    }

    createYieldExpressionAst(cst: SubhutiCst): any {
        return PrimaryExpressionCstToAst.createYieldExpressionAst(cst);
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return PrimaryExpressionCstToAst.createAwaitExpressionAst(cst);
    }

    // ============================================
    // 二元表达式相关 - 委托给 BinaryExpressionCstToAst
    // ============================================

    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst);
    }

    // ============================================
    // 以下方法需要后续实现
    // 子模块通过导入本单例来调用这些方法
    // ============================================

    createBindingIdentifierAst(cst: SubhutiCst): SlimePattern {
        // TODO: 实现
        throw new Error('createBindingIdentifierAst not implemented');
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        // TODO: 实现
        throw new Error('createArrowParametersFromCoverGrammar not implemented');
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        // TODO: 实现
        throw new Error('createFormalParameterListAst not implemented');
    }

    createFunctionBodyAst(cst: SubhutiCst): any[] {
        // TODO: 实现
        throw new Error('createFunctionBodyAst not implemented');
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现
        throw new Error('createAssignmentExpressionAst not implemented');
    }

    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现
        throw new Error('createExpressionAst not implemented');
    }
}

const SlimeCstToAstUtil = new SlimeCstToAst();

export default SlimeCstToAstUtil;
