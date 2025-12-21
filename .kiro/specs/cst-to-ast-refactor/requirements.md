# Requirements Document

## Introduction

本文档定义了将 `SlimeCstToAstUtil.ts` 重构为分发中心的需求。目标是将该文件中的具体转换方法提取到 `cstToAst` 目录下的合适文件中，使 `SlimeCstToAstUtil.ts` 仅作为方法分发中心，所有转换方法都应该是静态方法。

## Glossary

- **SlimeCstToAstUtil**: CST 到 AST 转换的主入口类，当前包含所有转换方法
- **CST**: Concrete Syntax Tree，具体语法树
- **AST**: Abstract Syntax Tree，抽象语法树
- **分发中心**: 仅负责根据 CST 节点类型调用对应转换方法的中心类
- **静态方法**: 不依赖实例状态的类方法

## Requirements

### Requirement 1

**User Story:** 作为开发者，我希望 `SlimeCstToAstUtil.ts` 仅作为分发中心，以便代码结构更清晰、职责更单一。

#### Acceptance Criteria

1. WHEN 重构完成后 THEN SlimeCstToAst 类 SHALL 仅包含 `createAstFromCst` 分发方法和 `toProgram` 入口方法
2. WHEN 重构完成后 THEN SlimeCstToAst 类 SHALL 保持单例模式导出（`export default new SlimeCstToAst()`）
3. WHEN 重构完成后 THEN SlimeCstToAst 类 SHALL 通过调用 cstToAst 目录下各个类的静态方法来完成转换
4. WHEN 重构完成后 THEN 所有具体的转换方法 SHALL 被移动到 cstToAst 目录下的对应文件中

### Requirement 2

**User Story:** 作为开发者，我希望 cstToAst 目录下的文件按功能分类，以便于维护和查找。

#### Acceptance Criteria

1. WHEN 分析方法归属时 THEN 系统 SHALL 按照以下分类规则分配方法：
   - IdentifierCstToAst: 标识符相关方法
   - LiteralCstToAst: 字面量相关方法
   - ExpressionCstToAst: 表达式相关方法
   - StatementCstToAst: 语句相关方法
   - DeclarationCstToAst: 声明相关方法
   - FunctionCstToAst: 函数相关方法
   - ClassCstToAst: 类相关方法
   - PropertyCstToAst: 对象属性相关方法
   - PatternCstToAst: 解构模式相关方法
   - ModuleCstToAst: 模块相关方法
   - TemplateCstToAst: 模板字符串相关方法（新建）
   - OperatorCstToAst: 运算符相关方法（新建）
2. WHEN 方法不属于任何现有分类时 THEN 系统 SHALL 创建新的合适文件

### Requirement 3

**User Story:** 作为开发者，我希望 cstToAst 目录下所有类的转换方法都是静态方法，以便于直接调用和测试。

#### Acceptance Criteria

1. WHEN 方法被移动到 cstToAst 目录下的文件后 THEN 该方法 SHALL 被声明为静态方法（static）
2. WHEN 静态方法需要调用其他转换方法时 THEN 该方法 SHALL 通过类名直接调用（如 `IdentifierCstToAst.createIdentifierAst()`）
3. WHEN 方法有内部状态依赖时 THEN 该状态 SHALL 作为参数传递或通过工具类处理

### Requirement 4

**User Story:** 作为开发者，我希望重构后的代码保持原有功能不变。

#### Acceptance Criteria

1. WHEN 重构完成后 THEN 所有现有测试 SHALL 继续通过
2. WHEN 重构完成后 THEN CST 到 AST 的转换结果 SHALL 与重构前完全一致

### Requirement 5

**User Story:** 作为开发者，我希望有清晰的文件列表说明每个文件应该包含哪些方法。

#### Acceptance Criteria

1. WHEN 分析完成后 THEN 系统 SHALL 生成一个文件列表，说明每个文件应该包含的方法
2. WHEN 文件列表生成后 THEN 每个文件 SHALL 有明确的职责描述

