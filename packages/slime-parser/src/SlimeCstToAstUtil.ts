import {
    type SlimeAssignmentExpression,
    type SlimeBlockStatement,
    type SlimeCallExpression,
    type SlimeClassBody,
    type SlimeClassDeclaration,
    type SlimeConditionalExpression,
    type SlimeDeclaration,
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration,
    type SlimeExpression,
    type SlimeExpressionStatement,
    type SlimeFunctionExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeModuleDeclaration,
    type SlimePattern,
    type SlimeProgram,
    type SlimeStatement,
    type SlimeStringLiteral,
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeReturnStatement,
    type SlimeSpreadElement,
    type SlimeMethodDefinition,
    type SlimeRestElement,
    type SlimeMemberExpression,
    type SlimeImportDeclaration,
    type SlimeImportSpecifier,
    type SlimeClassExpression,
    type SlimeArrayPattern,
    type SlimeObjectPattern,
    type SlimeAssignmentProperty,
    // Wrapper types for comma token association
    type SlimeArrayElement,
    type SlimeObjectPropertyItem,
    type SlimeFunctionParam,
    type SlimeCallArgument,
    type SlimeArrayPatternElement,
    type SlimeObjectPatternProperty,
    type SlimeImportSpecifierItem,
    type SlimeExportSpecifierItem,
    type SlimeFunctionDeclaration,
    type SlimeImportDefaultSpecifier,
    type SlimeImportNamespaceSpecifier,
    // Additional needed types
    type SlimeObjectExpression,
    type SlimeProperty,
    type SlimeNumericLiteral,
    type SlimeArrayExpression,
    type SlimeArrowFunctionExpression,
    type SlimeDotToken,
    type SlimeAssignToken,
    type SlimeLBracketToken,
    type SlimeRBracketToken,
    type SlimeCommaToken,
    type SlimeLBraceToken,
    type SlimeRBraceToken,
    type SlimeSuper,
    type SlimeThisExpression,
    type SlimePropertyDefinition,
    type SlimeMaybeNamedFunctionDeclaration,
    type SlimeMaybeNamedClassDeclaration,
    type SlimeExportAllDeclaration,
    type SlimeExportSpecifier,
} from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import SlimeParser from "./SlimeParser.ts";
import { SlimeAstUtil, SlimeTokenCreate, SlimeAstTypeName } from "slime-ast";
import {
    SlimeArrowFunctionCstToAst,
    SlimeAssignmentPatternCstToAst,
    SlimeBinaryExpressionCstToAst,
    SlimeBindingPatternCstToAst,
    SlimeBlockCstToAst,
    SlimeCompoundLiteralCstToAst,
    SlimeControlFlowCstToAst,
    SlimeExpressionCstToAst,
    SlimeExportCstToAst,
    SlimeFunctionBodyCstToAst,
    SlimeFunctionDeclarationCstToAst,
    SlimeFunctionExpressionCstToAst,
    SlimeFunctionParameterCstToAst,
    SlimeIdentifierCstToAst,
    SlimeImportCstToAst,
    SlimeLiteralCstToAst,
    SlimeMemberCallCstToAst,
    SlimeMethodDefinitionCstToAst,
    SlimeModuleCstToAst,
    SlimeOptionalExpressionCstToAst,
    SlimeOtherStatementCstToAst,
    SlimePatternConvertCstToAst,
    SlimePrimaryExpressionCstToAst,
    SlimeUnaryExpressionCstToAst,
    SlimeVariableCstToAst, SlimeClassDeclarationCstToAst,
} from "./cstToAst";
import { SlimeJavascriptCstToAst } from "./deprecated/SlimeJavascriptCstToAstUtil.ts";
import SlimeJavascriptCstToAstUtil from './deprecated/SlimeJavascriptCstToAstUtil.ts'


// ============================================
// Unicode 转义序列解码
// ES2025 规范 12.9.4 - \uXXXX \u{XXXXX} 转换为实际字符
// 参考实现：Babel、Acorn、TypeScript
// ============================================

/**
 * CST 到 AST 转换器
 *
 * ## 两层架构设计
 *
 * ### 第一层：AST 工厂类 (SlimeAstCreateUtils.ts / SlimeAstUtil)
 * - 与 ESTree AST 节点类型一一对应的纯粹创建方法
 * - 不依赖 CST 结构，只接收参数创建节点
 * - 示例：createIdentifier(name, loc) -> SlimeIdentifier
 *
 * ### 第二层：CST 转换器 (本类)
 * - 与 CST 规则一一对应的转换方法 (createXxxAst)
 * - 解析 CST 结构，提取信息，调用 AST 工厂类
 * - 中心转发方法：createAstFromCst(cst) - 自动根据类型分发
 *
 * ## 方法命名规范
 *
 * | 方法类型 | 命名模式 | 说明 |
 * |----------|----------|------|
 * | CST 规则转换 | createXxxAst | 与 @SubhutiRule 规则一一对应 |
 * | AST 类型映射 | createXxxAst | CST 规则名与 AST 类型名不一致时使用 |
 * | 内部辅助方法 | createXxxAst | ES2025 专用处理等 |
 * | 工具方法 | convertXxx / isXxx | 表达式转模式、检查方法等 |
 *
 * ## 方法命名规范
 *
 * 所有 CST 转换方法命名为 createXxxAst，其中 Xxx 与 CST 规则名一致。
 * 内部调用 SlimeNodeCreate / SlimeAstUtil 中与 AST 类型名一致的工厂方法。
 *
 * 例如：
 * - createArrayLiteralAst (CST 规则名) -> 内部调用 createArrayExpression (AST 类型名)
 * - createObjectLiteralAst (CST 规则名) -> 内部调用 createObjectExpression (AST 类型名)
 * - createCatchAst (CST 规则名) -> 内部调用 createCatchClause (AST 类型名)
 *
 * ## 核心分发方法
 * - createAstFromCst: 中心转发，根据 CST 类型显式分发到对应方法
 * - createStatementDeclarationAst: 语句/声明分发
 *
 * ## 辅助处理方法
 * - toProgram: Program 入口处理
 */
export class SlimeCstToAst extends SlimeJavascriptCstToAst {

    constructor() {
        super()
        // 在构造时拦截父类的方法引用
        // 这样所有调用 SlimeJavascriptCstToAstUtil 的地方都会使用我们的实现
        this._setupMethodInterception()
    }

    /**
     * 设置方法拦截
     * 将需要 TypeScript 支持的方法重新绑定到新的实现
     * 
     * 原理：deprecated 类内部调用 SlimeJavascriptCstToAstUtil.xxx()（硬编码单例）
     * 我们通过运行时修改该单例的方法引用，让它指向我们重写的方法
     */
    private _setupMethodInterception() {
        // 绑定重写的方法到 SlimeJavascriptCstToAstUtil
        // 这样所有调用 SlimeJavascriptCstToAstUtil.createBindingIdentifierAst 的地方
        // 都会使用我们的实现（支持 TypeScript 类型注解）
        ; (SlimeJavascriptCstToAstUtil as any).createBindingIdentifierAst = this.createBindingIdentifierAst.bind(this)
            ; (SlimeJavascriptCstToAstUtil as any).createLexicalBindingAst = this.createLexicalBindingAst.bind(this)
            ; (SlimeJavascriptCstToAstUtil as any).toProgram = this.toProgram.bind(this)
            // [TypeScript] 添加 createDeclarationAst 拦截以支持 TypeScript 声明
            ; (SlimeJavascriptCstToAstUtil as any).createDeclarationAst = this.createDeclarationAst.bind(this)
    }

    // ============================================
    // [TypeScript] 重写的方法 - 支持类型注解
    // ============================================

    /**
     * [TypeScript] 重写 createBindingIdentifierAst
     * 使用 SlimeIdentifierCstToAst 来支持 TypeScript 类型注解
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    /**
     * [TypeScript] 重写 createLexicalBindingAst
     * 使用 SlimeVariableCstToAst 来支持 TypeScript 类型注解
     */
    override createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return SlimeVariableCstToAst.createLexicalBindingAst(cst)
    }

    /**
     * [TypeScript] 重写 toProgram
     * 使用 SlimeModuleCstToAst 来支持 TypeScript 类型注解
     */
    override toProgram(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.toProgram(cst)
    }

    /**
     * [TypeScript] 重写 createDeclarationAst
     * 使用 SlimeVariableCstToAst 来支持 TypeScript 声明
     */
    override createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return SlimeVariableCstToAst.createDeclarationAst(cst)
    }
}

// 创建单例实例
// 构造函数中会自动完成方法拦截
const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
