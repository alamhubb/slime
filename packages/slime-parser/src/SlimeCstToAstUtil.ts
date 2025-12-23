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

    /**
     * 构造函数 - 初始化方法拦截
     * 
     * 必须在任何 CST-to-AST 转换之前调用，以确保 TypeScript 支持生效。
     * 拦截机制会修改 SlimeJavascriptCstToAstUtil 单例的方法引用。
     */
    constructor() {
        super()
        this._setupMethodInterception()
    }

    /**
     * [TypeScript] 程序入口转换
     * 
     * 将 CST 根节点转换为 AST Program 节点，支持 TypeScript 语法。
     */
    override toProgram(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.toProgram(cst)
    }

    /**
     * 方法拦截 - TypeScript 支持的核心机制
     * 
     * 问题：deprecated 包中硬编码调用 SlimeJavascriptCstToAstUtil.xxx()，
     *       无法通过类继承重写来拦截。
     * 
     * 解决：运行时替换 SlimeJavascriptCstToAstUtil 单例的方法引用，
     *       指向支持 TypeScript 的新实现。
     * 
     * 添加新拦截：
     * 1. 在 Slime 版本文件中重写方法（如 SlimeFunctionDeclarationCstToAst.ts）
     * 2. 在此处添加: (SlimeJavascriptCstToAstUtil as any).methodName = 
     *               SlimeXxxCstToAst.methodName.bind(SlimeXxxCstToAst)
     */
    private _setupMethodInterception() {
        // 基础标识符和变量声明 - 支持类型注解 (let x: number = 1)
        ; (SlimeJavascriptCstToAstUtil as any).createBindingIdentifierAst = 
            this.createBindingIdentifierAst.bind(this)
        ; (SlimeJavascriptCstToAstUtil as any).createLexicalBindingAst = 
            this.createLexicalBindingAst.bind(this)
        ; (SlimeJavascriptCstToAstUtil as any).toProgram = 
            this.toProgram.bind(this)
        
        // TypeScript 声明 - interface, type, enum
        ; (SlimeJavascriptCstToAstUtil as any).createDeclarationAst = 
            this.createDeclarationAst.bind(this)
        
        // 函数声明 - 支持返回类型注解 (function foo(): number { })
        ; (SlimeJavascriptCstToAstUtil as any).createFunctionDeclarationAst = 
            SlimeFunctionDeclarationCstToAst.createFunctionDeclarationAst.bind(SlimeFunctionDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createGeneratorDeclarationAst = 
            SlimeFunctionDeclarationCstToAst.createGeneratorDeclarationAst.bind(SlimeFunctionDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createAsyncFunctionDeclarationAst = 
            SlimeFunctionDeclarationCstToAst.createAsyncFunctionDeclarationAst.bind(SlimeFunctionDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createAsyncGeneratorDeclarationAst = 
            SlimeFunctionDeclarationCstToAst.createAsyncGeneratorDeclarationAst.bind(SlimeFunctionDeclarationCstToAst)
        
        // 类声明 - 支持 TSClassTail (class Foo<T> implements Bar { })
        ; (SlimeJavascriptCstToAstUtil as any).createClassDeclarationAst = 
            SlimeClassDeclarationCstToAst.createClassDeclarationAst.bind(SlimeClassDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createClassExpressionAst = 
            SlimeClassDeclarationCstToAst.createClassExpressionAst.bind(SlimeClassDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createClassTailAst = 
            SlimeClassDeclarationCstToAst.createClassTailAst.bind(SlimeClassDeclarationCstToAst)
        ; (SlimeJavascriptCstToAstUtil as any).createFieldDefinitionAst = 
            SlimeClassDeclarationCstToAst.createFieldDefinitionAst.bind(SlimeClassDeclarationCstToAst)
    }

    // ============================================
    // [TypeScript] 重写的方法 - 支持类型注解
    // ============================================

    /** 支持 TypeScript 类型注解的标识符转换 */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    /** 支持 TypeScript 类型注解的变量声明转换 */
    override createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return SlimeVariableCstToAst.createLexicalBindingAst(cst)
    }

    /** 支持 TypeScript 声明 (interface, type, enum) */
    override createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return SlimeVariableCstToAst.createDeclarationAst(cst)
    }
}

// 创建单例实例
// 构造函数中会自动完成方法拦截
const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
