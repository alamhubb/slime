# Design Document: CST to AST 重构

## Overview

本设计文档描述如何将 `SlimeCstToAstUtil.ts` 重构为分发中心，将具体转换方法提取到 `cstToAst` 目录下的对应文件中。

**关键设计决策：**
- `SlimeCstToAstUtil` 保持现有的单例模式（`export default new SlimeCstToAst()`），作为分发中心
- `cstToAst` 目录下的所有类的方法都应该是**静态方法**，便于直接调用

## Architecture

### 当前架构

```
SlimeCstToAstUtil.ts (2248行) - 单例模式导出
├── createAstFromCst() - 分发方法
├── toProgram() - 入口方法
├── 标识符相关方法 (部分)
├── 字面量相关方法 (部分)
├── 表达式相关方法 (部分)
├── 语句相关方法 (部分)
├── 声明相关方法 (部分)
├── 函数相关方法 (部分)
├── 类相关方法 (部分)
├── 模块相关方法 (部分)
├── 模板字符串方法
├── 运算符方法
└── 辅助方法
```

### 目标架构

```
SlimeCstToAstUtil.ts (约200行) - 保持单例模式
├── SlimeCstToAst 类（实例方法）
│   ├── createAstFromCst() - 分发方法（调用各类静态方法）
│   └── toProgram() - 入口方法
└── export default new SlimeCstToAst()

cstToAst/ (所有方法都是静态方法)
├── index.ts - 统一导出
├── SlimeCstToAstTools.ts - 静态工具方法
├── IdentifierCstToAst.ts - 标识符转换（静态方法）
├── LiteralCstToAst.ts - 字面量转换（静态方法）
├── ExpressionCstToAst.ts - 表达式转换（静态方法）
├── StatementCstToAst.ts - 语句转换（静态方法）
├── DeclarationCstToAst.ts - 声明转换（静态方法）
├── FunctionCstToAst.ts - 函数转换（静态方法）
├── ClassCstToAst.ts - 类转换（静态方法）
├── PropertyCstToAst.ts - 属性转换（静态方法）
├── PatternCstToAst.ts - 解构模式转换（静态方法）
├── ModuleCstToAst.ts - 模块转换（静态方法）
├── TemplateCstToAst.ts - 模板字符串转换（静态方法，新建）
└── OperatorCstToAst.ts - 运算符转换（静态方法，新建）
```

## Components and Interfaces

### 文件职责分配

#### 1. SlimeCstToAstUtil.ts (分发中心)
保留方法：
- `createAstFromCst()` - 中心分发方法
- `toProgram()` - 程序入口方法

#### 2. IdentifierCstToAst.ts
已有方法：
- `createIdentifierReferenceAst()`
- `createLabelIdentifierAst()`
- `createIdentifierAst()`
- `createIdentifierNameAst()`
- `createBindingIdentifierAst()`
- `findFirstIdentifierInExpression()`
- `convertExpressionToPattern()`

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createPrivateIdentifierAst()` - 私有标识符

#### 3. LiteralCstToAst.ts
已有方法：
- `createBooleanLiteralAst()`
- `createArrayLiteralAst()`
- `createObjectLiteralAst()`
- `createElisionAst()`
- `createLiteralAst()`
- `createNumericLiteralAst()`
- `createStringLiteralAst()`
- `createRegExpLiteralAst()`

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createLiteralFromToken()` - 从 token 创建字面量
- `createElementListAst()` - 数组元素列表
- `createSpreadElementAst()` - 展开元素

#### 4. ExpressionCstToAst.ts
已有方法：
- `createCallExpressionAst()`
- `createNewExpressionAst()`
- `createMemberExpressionAst()`
- `createParenthesizedExpressionAst()`
- `createCallMemberExpressionAst()`
- `createShortCircuitExpressionAst()`
- `createExpressionAst()`
- `createOptionalExpressionAst()`
- `createCoalesceExpressionAst()`
- `createExponentiationExpressionAst()`
- `createLogicalORExpressionAst()`
- `createLogicalANDExpressionAst()`
- 等二元表达式方法...

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createSuperCallAst()` - super 调用
- `createImportCallAst()` - 动态 import
- `createSuperPropertyAst()` - super 属性访问
- `createMetaPropertyAst()` - 元属性
- `createMemberExpressionFirstOr()` - 成员表达式首项
- `createCoalesceExpressionHeadAst()` - 空值合并头部
- `createOptionalChainAst()` - 可选链
- `createShortCircuitExpressionTailAst()` - 短路表达式尾部

#### 5. StatementCstToAst.ts
已有方法：
- `createStatementAst()`
- `createVariableStatementAst()`
- `createTryStatementAst()`
- `createThrowStatementAst()`
- `createBreakStatementAst()`
- `createContinueStatementAst()`
- `createLabelledStatementAst()`
- `createWithStatementAst()`
- `createDebuggerStatementAst()`
- `createEmptyStatementAst()`
- `createBlockStatementAst()`
- `createReturnStatementAst()`
- `createExpressionStatementAst()`
- `createIfStatementAst()`
- `createForStatementAst()`
- `createForInOfStatementAst()`
- 等...

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createStatementDeclarationAst()` - 语句/声明分发
- `createBlockAst()` - Block 转换
- `createCatchAst()` - catch 子句
- `createFinallyAst()` - finally 子句
- `createCaseBlockAst()` - case 块
- `createCaseClausesAst()` - case 子句列表
- `createCaseClauseAst()` - 单个 case
- `createDefaultClauseAst()` - default 子句
- `createSwitchCaseAst()` - switch case (私有)
- `extractCasesFromCaseBlock()` - 提取 cases (私有)
- `createSemicolonASIAst()` - ASI 处理
- `createForBindingAst()` - for 绑定
- `createLetOrConstAst()` - let/const 关键字
- `createCatchParameterAst()` - catch 参数

#### 6. DeclarationCstToAst.ts
已有方法：
- `createVariableDeclarationFromList()`
- `createVariableDeclaratorFromVarDeclaration()`
- `createHoistableDeclarationAst()`
- `createGeneratorDeclarationAst()`
- `createAsyncFunctionDeclarationAst()`
- `createAsyncGeneratorDeclarationAst()`
- `createVariableDeclarationAst()`
- `createVariableDeclarationListAst()`
- `createLabelledItemAst()`
- `createForDeclarationAst()`
- `createFunctionDeclarationAst()`
- `createVariableDeclaratorAst()`
- `createDeclarationAst()`
- `createLexicalDeclarationAst()`

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createLexicalBindingAst()` - 词法绑定
- `createInitializerAst()` - 初始化器

#### 7. FunctionCstToAst.ts
已有方法：
- `createAsyncMethodAst()`
- `createAsyncFunctionBodyAst()`
- `createAsyncGeneratorMethodAst()`
- `createAsyncGeneratorBodyAst()`
- `createAsyncArrowBindingIdentifierAst()`
- `createAsyncConciseBodyAst()`
- `createAsyncArrowHeadAst()`
- `createArrowFunctionAst()`
- `createAsyncArrowFunctionAst()`
- `createAsyncArrowParamsFromCover()`
- `convertCstToPattern()`
- `convertCoverParameterCstToPattern()`
- `createGeneratorMethodAst()`
- `createGeneratorBodyAst()`
- `createArrowFormalParametersAst()`
- `createArrowParametersFromCoverGrammar()`
- `extractParametersFromExpression()`
- 等...

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createFormalParameterListAst()` - 形参列表
- `createBindingElementAst()` - 绑定元素
- `createSingleNameBindingAst()` - 单名绑定
- `createFunctionRestParameterAst()` - 函数 rest 参数
- `createBindingRestElementAst()` - 绑定 rest 元素
- `createFunctionBodyAst()` - 函数体
- `createFunctionStatementListAst()` - 函数语句列表
- `createFormalParameterListAstWrapped()` - 包装版形参列表
- `createUniqueFormalParametersAst()` - 唯一形参
- `createUniqueFormalParametersAstWrapped()` - 包装版唯一形参
- `createPropertySetParameterListAst()` - setter 参数列表
- `createPropertySetParameterListAstWrapped()` - 包装版 setter 参数
- `createFormalParameterAst()` - 单个形参
- `createConciseBodyAst()` - 简洁函数体

#### 8. ClassCstToAst.ts
已有方法：
- `isStaticModifier()`
- `createClassBodyAst()`
- `createClassStaticBlockAst()`
- `createClassDeclarationAst()`
- `createClassTailAst()`
- `createClassHeritageAst()`
- `createClassHeritageAstWithToken()`
- `createClassElementAst()`
- `createClassElementNameAst()`
- `createClassElementListAst()`
- `createClassStaticBlockBodyAst()`
- `createClassStaticBlockStatementListAst()`
- `createClassExpressionAst()`
- 私有方法...

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createFieldDefinitionAst()` - 字段定义
- `isComputedPropertyName()` - 检查计算属性名
- `createMethodDefinitionAst()` - 方法定义

#### 9. PropertyCstToAst.ts
当前为空类，需要添加：
- `createPropertyDefinitionAst()` - 属性定义
- `createPropertyNameAst()` - 属性名
- `createLiteralPropertyNameAst()` - 字面量属性名
- `createComputedPropertyNameAst()` - 计算属性名
- `createCoverInitializedNameAst()` - Cover 初始化名

#### 10. PatternCstToAst.ts
已有方法：
- `convertObjectLiteralToPattern()`
- `convertPropertyDefinitionToPatternProperty()`
- `convertObjectExpressionToPattern()`
- `convertArrayExpressionToPattern()`
- `convertAssignmentExpressionToPattern()`
- `convertExpressionToPatternFromAST()`
- `convertArrayLiteralToPattern()`
- `createBindingPatternAst()`
- `createArrayBindingPatternAst()`
- `createObjectBindingPatternAst()`
- `createAssignmentPatternAst()`
- `createObjectAssignmentPatternAst()`
- `createArrayAssignmentPatternAst()`

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createBindingPropertyAst()` - 绑定属性
- `createBindingPropertyListAst()` - 绑定属性列表
- `createBindingElementListAst()` - 绑定元素列表
- `createBindingElisionElementAst()` - 绑定省略元素
- `createBindingRestPropertyAst()` - 绑定 rest 属性

#### 11. ModuleCstToAst.ts
已有方法：
- `createModuleItemListAst()`
- `createProgramAst()`
- `createScriptAst()`
- `createScriptBodyAst()`
- `createModuleAst()`
- `createModuleBodyAst()`
- `createNameSpaceImportAst()`
- `createNamedImportsAst()`
- `createImportsListAst()`
- `createImportSpecifierAst()`
- `createAttributeKeyAst()`
- `createExportFromClauseAst()`
- `createWithEntriesAst()`
- `createModuleItemAst()`
- `createImportDeclarationAst()`
- `createWithClauseAst()`
- `createFromClauseAst()`
- `createModuleSpecifierAst()`
- `createImportClauseAst()`
- `createImportedDefaultBindingAst()`
- `createImportedBindingAst()`
- `createNamedImportsListAstWrapped()`
- `createExportDeclarationAst()`

需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createStatementListAst()` - 语句列表
- `createStatementListItemAst()` - 语句列表项

#### 12. TemplateCstToAst.ts (新建)
需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createTemplateLiteralAst()` - 模板字面量
- `processTemplateSpans()` - 处理模板 spans
- `processTemplateMiddleList()` - 处理模板中间列表

#### 13. OperatorCstToAst.ts (新建)
需要添加的方法（从 SlimeCstToAstUtil.ts）：
- `createMultiplicativeOperatorAst()` - 乘法运算符
- `createAssignmentOperatorAst()` - 赋值运算符
- `createExpressionBodyAst()` - 表达式体

## Data Models

### 静态方法调用模式

```typescript
// cstToAst 目录下的类 - 所有方法都是静态方法
class IdentifierCstToAst {
    static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // 实现
    }
    
    static createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // 实现
    }
}

// SlimeCstToAstUtil.ts - 保持单例模式，作为分发中心
class SlimeCstToAst {
    // 实例方法，调用各类的静态方法
    createAstFromCst(cst: SubhutiCst): any {
        const name = cst.name
        
        if (name === 'Identifier') {
            return IdentifierCstToAst.createIdentifierAst(cst)
        }
        if (name === 'BindingIdentifier') {
            return IdentifierCstToAst.createBindingIdentifierAst(cst)
        }
        // ...其他分发
    }
    
    toProgram(cst: SubhutiCst): SlimeProgram {
        // 入口方法实现
    }
}

// 单例导出
const SlimeCstToAstUtil = new SlimeCstToAst()
export default SlimeCstToAstUtil
```

### 静态方法间的相互调用

```typescript
// 静态方法调用其他类的静态方法
class ExpressionCstToAst {
    static createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        // 调用其他类的静态方法
        const callee = IdentifierCstToAst.createIdentifierAst(cst.children[0])
        const args = FunctionCstToAst.createArgumentsAst(cst.children[1])
        // ...
    }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: 转换结果等价性
*For any* 有效的 CST 输入，重构后的转换结果 SHALL 与重构前完全一致
**Validates: Requirements 4.2**

## Error Handling

1. 如果方法移动后出现循环依赖，通过参数传递或延迟导入解决
2. 如果静态方法需要访问实例状态，将状态作为参数传递
3. 保持原有的错误处理逻辑不变

## Testing Strategy

### 单元测试
- 验证每个移动后的方法功能正确
- 验证分发中心正确调用各类方法

### 属性测试
- 使用 fast-check 库进行属性测试
- 验证重构前后转换结果的等价性

### 回归测试
- 运行现有的所有测试用例
- 确保所有测试继续通过

