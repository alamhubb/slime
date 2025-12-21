# Implementation Plan

## Phase 1: 准备工作

- [x] 1. 分析现有 cstToAst 文件，将现有实例方法转换为静态方法

  - [x] 1.1 将 IdentifierCstToAst 的方法转换为静态方法


    - 修改所有方法添加 `static` 关键字
    - 更新方法内部的 `this.` 调用为类名调用
    - _Requirements: 3.1, 3.2_
  - [x] 1.2 将 LiteralCstToAst 的方法转换为静态方法


    - _Requirements: 3.1, 3.2_
  - [x] 1.3 将 ExpressionCstToAst 的方法转换为静态方法


    - _Requirements: 3.1, 3.2_
  - [x] 1.4 将 StatementCstToAst 的方法转换为静态方法




    - _Requirements: 3.1, 3.2_

  - [x] 1.5 将 DeclarationCstToAst 的方法转换为静态方法

    - _Requirements: 3.1, 3.2_


  - [x] 1.6 将 FunctionCstToAst 的方法转换为静态方法

    - _Requirements: 3.1, 3.2_

  - [x] 1.7 将 ClassCstToAst 的方法转换为静态方法

    - _Requirements: 3.1, 3.2_
  - [x] 1.8 将 PropertyCstToAst 的方法转换为静态方法
    - _Requirements: 3.1, 3.2_
  - [x] 1.9 将 PatternCstToAst 的方法转换为静态方法
    - _Requirements: 3.1, 3.2_
  - [x] 1.10 将 ModuleCstToAst 的方法转换为静态方法
    - _Requirements: 3.1, 3.2_

## Phase 2: 创建新文件

- [x] 2. 创建新的转换类文件
  - [x] 2.1 创建 TemplateCstToAst.ts
    - 创建类结构
    - 添加静态方法声明
    - _Requirements: 2.2_
  - [x] 2.2 创建 OperatorCstToAst.ts
    - 创建类结构
    - 添加静态方法声明
    - _Requirements: 2.2_

## Phase 3: 从 SlimeCstToAstUtil.ts 提取方法

- [x] 3. 提取标识符相关方法到 IdentifierCstToAst
  - [x] 3.1 提取 createPrivateIdentifierAst 方法
    - 将方法移动到 IdentifierCstToAst.ts
    - 添加 static 关键字
    - 更新内部调用
    - _Requirements: 1.4, 3.1_

- [x] 4. 提取字面量相关方法到 LiteralCstToAst
  - [ ] 4.1 提取 createLiteralFromToken 方法
    - _Requirements: 1.4, 3.1_
  - [x] 4.2 提取 createElementListAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 4.3 提取 createSpreadElementAst 方法
    - _Requirements: 1.4, 3.1_

- [ ] 5. 提取表达式相关方法到 ExpressionCstToAst
  - [ ] 5.1 提取 createSuperCallAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.2 提取 createImportCallAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.3 提取 createSuperPropertyAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.4 提取 createMetaPropertyAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.5 提取 createMemberExpressionFirstOr 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.6 提取 createCoalesceExpressionHeadAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.7 提取 createOptionalChainAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 5.8 提取 createShortCircuitExpressionTailAst 方法
    - _Requirements: 1.4, 3.1_

- [x] 6. 提取语句相关方法到 StatementCstToAst
  - [x] 6.1 提取 createStatementDeclarationAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 6.2 提取 createBlockAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 6.3 提取 createCatchAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 6.4 提取 createFinallyAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 6.5 提取 createCaseBlockAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.6 提取 createCaseClausesAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.7 提取 createCaseClauseAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.8 提取 createDefaultClauseAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.9 提取 createSemicolonASIAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.10 提取 createForBindingAst 方法 (已在 DeclarationCstToAst)
    - _Requirements: 1.4, 3.1_
  - [x] 6.11 提取 createLetOrConstAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 6.12 提取 extractCasesFromCaseBlock 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 6.13 提取 createSwitchCaseAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_

- [x] 7. 提取声明相关方法到 DeclarationCstToAst
  - [x] 7.1 提取 createLexicalBindingAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 7.2 提取 createInitializerAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_

- [x] 8. 提取函数相关方法到 FunctionCstToAst
  - [x] 8.1 提取 createFormalParameterListAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.2 提取 createBindingElementAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.3 提取 createSingleNameBindingAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.4 提取 createFunctionRestParameterAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.5 提取 createBindingRestElementAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.6 提取 createFunctionBodyAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [ ] 8.7 提取 createFunctionStatementListAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 8.8 提取 createFormalParameterListAstWrapped 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.9 提取 createUniqueFormalParametersAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.10 提取 createUniqueFormalParametersAstWrapped 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [ ] 8.11 提取 createPropertySetParameterListAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 8.12 提取 createPropertySetParameterListAstWrapped 方法
    - _Requirements: 1.4, 3.1_
  - [x] 8.13 提取 createFormalParameterAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 8.14 提取 createConciseBodyAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_

- [x] 9. 提取类相关方法到 ClassCstToAst
  - [x] 9.1 提取 createFieldDefinitionAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [ ] 9.2 提取 isComputedPropertyName 方法
    - _Requirements: 1.4, 3.1_
  - [x] 9.3 提取 createMethodDefinitionAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.4 提取 createMethodDefinitionClassElementNameAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.5 提取 createMethodDefinitionGetterMethodAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.6 提取 createMethodDefinitionSetterMethodAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.7 提取 createMethodDefinitionGeneratorMethodAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.8 提取 createMethodDefinitionAsyncMethodAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.9 提取 createMethodDefinitionAsyncGeneratorMethodAst 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.10 提取 createMethodDefinitionMethodDefinitionFromIdentifier 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.11 提取 createMethodDefinitionGetterMethodFromIdentifier 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.12 提取 createMethodDefinitionSetterMethodFromIdentifier 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 9.13 提取 createMethodDefinitionAsyncMethodFromChildren 私有方法 (已存在)
    - _Requirements: 1.4, 3.1_

- [ ] 10. 提取属性相关方法到 PropertyCstToAst
  - [ ] 10.1 提取 createPropertyDefinitionAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 10.2 提取 createPropertyNameAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 10.3 提取 createLiteralPropertyNameAst 方法
    - _Requirements: 1.4, 3.1_
  - [x] 10.4 提取 createComputedPropertyNameAst 方法 (已在 FunctionCstToAst)
    - _Requirements: 1.4, 3.1_
  - [x] 10.5 提取 createCoverInitializedNameAst 方法 (已在 FunctionCstToAst)
    - _Requirements: 1.4, 3.1_

- [x] 11. 提取解构模式相关方法到 PatternCstToAst
  - [ ] 11.1 提取 createBindingPropertyAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 11.2 提取 createBindingPropertyListAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 11.3 提取 createBindingElementListAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 11.4 提取 createBindingElisionElementAst 方法
    - _Requirements: 1.4, 3.1_
  - [ ] 11.5 提取 createBindingRestPropertyAst 方法
    - _Requirements: 1.4, 3.1_

- [x] 12. 提取模块相关方法到 ModuleCstToAst
  - [x] 12.1 提取 createStatementListAst 方法 (已在 StatementCstToAst)
    - _Requirements: 1.4, 3.1_
  - [x] 12.2 提取 createStatementListItemAst 方法 (已在 StatementCstToAst)
    - _Requirements: 1.4, 3.1_

- [x] 13. 提取模板字符串相关方法到 TemplateCstToAst
  - [x] 13.1 提取 createTemplateLiteralAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 13.2 提取 processTemplateSpans 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 13.3 提取 processTemplateMiddleList 方法 (已存在)
    - _Requirements: 1.4, 3.1_

- [x] 14. 提取运算符相关方法到 OperatorCstToAst
  - [x] 14.1 提取 createMultiplicativeOperatorAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 14.2 提取 createAssignmentOperatorAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_
  - [x] 14.3 提取 createExpressionBodyAst 方法 (已存在)
    - _Requirements: 1.4, 3.1_

## Phase 4: 更新分发中心

- [ ] 15. 重构 SlimeCstToAstUtil.ts 为分发中心
  - [ ] 15.1 更新 createAstFromCst 方法调用静态方法
    - 将所有 `this.createXxxAst()` 调用改为 `XxxCstToAst.createXxxAst()`
    - _Requirements: 1.1, 1.3_
  - [ ] 15.2 更新 toProgram 方法调用静态方法
    - _Requirements: 1.1, 1.3_
  - [ ] 15.3 删除已移动的方法
    - 确保所有方法都已成功移动后删除
    - _Requirements: 1.1_
  - [ ] 15.4 更新导入语句
    - 添加对所有 cstToAst 类的导入
    - _Requirements: 1.3_

## Phase 5: 更新导出和索引

- [ ] 16. 更新 cstToAst/index.ts
  - [ ] 16.1 添加新文件的导出
    - 导出 TemplateCstToAst
    - 导出 OperatorCstToAst
    - _Requirements: 2.2_

## Phase 6: 验证和测试

- [ ] 17. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

