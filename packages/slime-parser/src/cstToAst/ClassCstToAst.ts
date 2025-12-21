import {
    type SlimeClassDeclaration,
    type SlimeClassExpression,
    type SlimeClassBody,
    type SlimeMethodDefinition,
    type SlimePropertyDefinition,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeBlockStatement,
    type SlimeFunctionExpression,
    type SlimePattern,
    type SlimeStatement,
    type SlimeFunctionParam,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression;
    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression;
    createStatementListAst(cst: SubhutiCst): SlimeStatement[];
    createFunctionBodyAst(cst: SubhutiCst): SlimeStatement[];
    createFormalParametersAst(cst: SubhutiCst): SlimePattern[];
    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[];
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[];
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[];
    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[];
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createInitializerAst(cst: SubhutiCst): SlimeExpression;
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
};

/**
 * 类相关的 CST to AST 转换
 */
export class ClassCstToAst {
    /**
     * 创建 ClassDeclaration 的 AST
     */
    static createClassDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeClassDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        const classTailResult = ClassCstToAst.createClassTailAst(classTailCst, converter)

        return SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )
    }

    /**
     * 创建 ClassExpression 的 AST
     */
    static createClassExpressionAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeClassExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null
        let tailStartIndex = 1

        const nextChild = cst.children[1]
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = converter.createBindingIdentifierAst(nextChild)
            tailStartIndex = 2
        }

        const classTail = ClassCstToAst.createClassTailAst(cst.children[tailStartIndex], converter)

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
    }

    /**
     * 创建 ClassTail 的 AST
     */
    static createClassTailAst(cst: SubhutiCst, converter: SlimeCstToAstType): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassTail?.name);

        let superClass: SlimeExpression | null = null
        let body: SlimeClassBody = { type: SlimeNodeType.ClassBody as any, body: [], loc: cst.loc }
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = ClassCstToAst.createClassHeritageAstWithToken(child, converter)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = ClassCstToAst.createClassBodyAst(child, converter)
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return { superClass, body, extendsToken, lBraceToken, rBraceToken }
    }

    /**
     * 创建 ClassHeritage 的 AST
     */
    static createClassHeritageAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return converter.createLeftHandSideExpressionAst(cst.children[1])
    }

    /**
     * 创建 ClassHeritage 的 AST（带 token）
     */
    static createClassHeritageAstWithToken(cst: SubhutiCst, converter: SlimeCstToAstType): { superClass: SlimeExpression; extendsToken?: any } {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);

        let extendsToken: any = undefined
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc)
        }

        const superClass = converter.createLeftHandSideExpressionAst(cst.children[1])
        return { superClass, extendsToken }
    }

    /**
     * 创建 ClassBody 的 AST
     */
    static createClassBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeClassBody {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassBody?.name);

        const elementsWrapper = cst.children && cst.children[0]
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = []

        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) {
                const elementChildren = element.children ?? []
                if (!elementChildren.length) continue

                let staticCst: SubhutiCst | null = null
                let targetCst: SubhutiCst | null = null
                let classStaticBlockCst: SubhutiCst | null = null

                for (const child of elementChildren) {
                    if (child.name === 'Static' || child.value === 'static') {
                        staticCst = child
                    } else if (child.name === 'SemicolonASI' || child.name === 'Semicolon' || child.value === ';') {
                        continue
                    } else if (child.name === 'ClassStaticBlock') {
                        classStaticBlockCst = child
                    } else if (child.name === SlimeParser.prototype.MethodDefinition?.name ||
                               child.name === SlimeParser.prototype.FieldDefinition?.name ||
                               child.name === 'MethodDefinition' || child.name === 'FieldDefinition') {
                        targetCst = child
                    }
                }

                if (classStaticBlockCst) {
                    const staticBlock = ClassCstToAst.createClassStaticBlockAst(classStaticBlockCst, converter)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }

                if (targetCst) {
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(ClassCstToAst.createMethodDefinitionAst(staticCst, targetCst, converter))
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(ClassCstToAst.createFieldDefinitionAst(staticCst, targetCst, converter))
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ClassBody as any,
            body: body,
            loc: cst.loc
        }
    }

    /**
     * 创建 ClassElementList 的 AST
     */
    static createClassElementListAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = ClassCstToAst.createClassElementAst(child, converter)
                if (element) {
                    elements.push(element)
                }
            }
        }
        return elements
    }

    /**
     * 创建 ClassElement 的 AST
     */
    static createClassElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        let staticCst: SubhutiCst | null = null
        let startIndex = 0
        if (firstChild.name === 'Static' || firstChild.value === 'static') {
            staticCst = firstChild
            startIndex = 1
        }

        const actualChild = cst.children?.[startIndex]
        if (!actualChild) return null

        if (actualChild.name === SlimeParser.prototype.MethodDefinition?.name ||
            actualChild.name === 'MethodDefinition') {
            return ClassCstToAst.createMethodDefinitionAst(staticCst, actualChild, converter)
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return ClassCstToAst.createFieldDefinitionAst(staticCst, actualChild, converter)
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return ClassCstToAst.createClassStaticBlockAst(actualChild, converter)
        }

        return null
    }

    /**
     * 创建 ClassElementName 的 AST
     */
    static createClassElementNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ClassElementName?.name)

        const first = cst.children[0]
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children')
        }

        if (first.name === 'PrivateIdentifier') {
            return converter.createPrivateIdentifierAst(first)
        }

        return converter.createPropertyNameAst(first)
    }

    /**
     * 创建 ClassStaticBlock 的 AST (ES2022)
     */
    static createClassStaticBlockAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let bodyStatements: SlimeStatement[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'ClassStaticBlockBody') {
                const stmtListCst = child.children?.find((c: any) =>
                    c.name === 'ClassStaticBlockStatementList' || c.name === 'StatementList'
                )
                if (stmtListCst) {
                    const actualStatementList = stmtListCst.name === 'ClassStaticBlockStatementList'
                        ? stmtListCst.children?.find((c: any) => c.name === 'StatementList')
                        : stmtListCst
                    if (actualStatementList) {
                        bodyStatements = converter.createStatementListAst(actualStatementList)
                    }
                }
            }
        }

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * 创建 ClassStaticBlockBody 的 AST
     */
    static createClassStaticBlockBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        )
        if (stmtList) {
            return ClassCstToAst.createClassStaticBlockStatementListAst(stmtList, converter)
        }
        return []
    }

    /**
     * 创建 ClassStaticBlockStatementList 的 AST
     */
    static createClassStaticBlockStatementListAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return converter.createStatementListAst(stmtList)
        }
        return []
    }

    /**
     * 创建 FieldDefinition 的 AST
     */
    static createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst, converter: SlimeCstToAstType): SlimePropertyDefinition {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FieldDefinition?.name);

        const elementNameCst = cst.children[0]
        const key = ClassCstToAst.createClassElementNameAst(elementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(elementNameCst)

        let value: SlimeExpression | null = null
        if (cst.children.length > 1) {
            const initializerCst = cst.children[1]
            if (initializerCst && initializerCst.name === SlimeParser.prototype.Initializer?.name) {
                value = converter.createInitializerAst(initializerCst)
            }
        }

        const isStatic = ClassCstToAst.isStaticModifier(staticCst)

        return SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
    }

    /**
     * 创建 MethodDefinition 的 AST
     */
    static createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst, converter: SlimeCstToAstType): SlimeMethodDefinition {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.MethodDefinition?.name);

        const first = cst.children?.[0]
        if (!first) {
            throw new Error('MethodDefinition has no children')
        }

        if (first.name === 'ClassElementName') {
            return ClassCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst, converter)
        } else if (first.name === 'Get') {
            return ClassCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst, converter)
        } else if (first.name === 'Set') {
            return ClassCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst, converter)
        } else if (first.name === SlimeParser.prototype.GeneratorMethod?.name || first.name === 'GeneratorMethod') {
            return ClassCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, first, converter)
        } else if (first.name === 'AsyncMethod' || first.name === SlimeParser.prototype.AsyncMethod?.name) {
            return ClassCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, first, converter)
        } else if (first.name === 'AsyncGeneratorMethod' || first.name === SlimeParser.prototype.AsyncGeneratorMethod?.name) {
            return ClassCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, first, converter)
        } else if (first.name === 'Asterisk') {
            return ClassCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst, converter)
        } else if (first.name === 'Async') {
            return ClassCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst, converter)
        } else if (first.name === 'IdentifierName' || first.name === 'PropertyName' || first.name === 'LiteralPropertyName') {
            if (first.value === 'get' && cst.children[1]?.name === 'ClassElementName') {
                return ClassCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst, converter)
            } else if (first.value === 'set' && cst.children[1]?.name === 'ClassElementName') {
                return ClassCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst, converter)
            }
            return ClassCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst, converter)
        } else {
            throw new Error('不支持的类型: ' + first.name)
        }
    }

    /**
     * 创建 GeneratorMethod 的 AST
     */
    static createGeneratorMethodAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionAstInternal(cst, 'method', true, false, converter)
    }

    /**
     * 创建 AsyncMethod 的 AST
     */
    static createAsyncMethodAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionAstInternal(cst, 'method', false, true, converter)
    }

    /**
     * 创建 AsyncGeneratorMethod 的 AST
     */
    static createAsyncGeneratorMethodAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionAstInternal(cst, 'method', true, true, converter)
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 检查 CST 节点是否表示 static 修饰符
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static') {
            return true
        }
        if ((cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }

    /**
     * 检查 ClassElementName/PropertyName 是否是计算属性名
     */
    static isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false

        function hasComputedPropertyName(node: SubhutiCst): boolean {
            if (!node) return false
            if (node.name === 'ComputedPropertyName' || node.name === SlimeParser.prototype.ComputedPropertyName?.name) {
                return true
            }
            if (node.children) {
                for (const child of node.children) {
                    if (hasComputedPropertyName(child)) return true
                }
            }
            return false
        }

        return hasComputedPropertyName(cst)
    }

    /**
     * 内部辅助方法：创建 MethodDefinition AST
     */
    private static createMethodDefinitionAstInternal(
        cst: SubhutiCst,
        kind: 'method' | 'get' | 'set',
        generator: boolean,
        async: boolean,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )

        const key = classElementName ? ClassCstToAst.createClassElementNameAst(classElementName, converter) : null

        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? converter.createFormalParametersAst(formalParams) : []

        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? converter.createFunctionBodyAst(bodyNode) : []
        const body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode?.loc)

        const value: SlimeFunctionExpression = {
            type: SlimeNodeType.FunctionExpression,
            id: null,
            params: params as any,
            body: body,
            generator: generator,
            async: async,
            loc: cst.loc
        } as any

        return SlimeAstUtil.createMethodDefinition(key, value, kind, false, false, cst.loc)
    }


    /**
     * 普通方法定义
     */
    private static createMethodDefinitionClassElementNameAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = converter.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = converter.createFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }

        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)
        const isConstructor = key.type === "Identifier" && (key as SlimeIdentifier).name === "constructor" &&
            !ClassCstToAst.isStaticModifier(staticCst)
        const isStatic = ClassCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }


    /**
     * getter 方法
     */
    private static createMethodDefinitionGetterMethodAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.name === 'Get' || children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'get', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, getToken
        )
    }


    /**
     * setter 方法
     */
    private static createMethodDefinitionSetterMethodAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.name === 'Set' || children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = converter.createPropertySetParameterListAst(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'set', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken
        )
    }


    /**
     * getter 方法 (以 IdentifierName="get" 开始)
     */
    private static createMethodDefinitionGetterMethodFromIdentifier(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'get', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, getToken
        )
    }


    /**
     * setter 方法 (以 IdentifierName="set" 开始)
     */
    private static createMethodDefinitionSetterMethodFromIdentifier(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = converter.createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            params = [converter.createBindingIdentifierAst(children[i])]
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'set', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken
        )
    }


    /**
     * 从标识符创建方法定义
     */
    private static createMethodDefinitionMethodDefinitionFromIdentifier(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        const firstChild = children[i++]
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression

        if (firstChild.name === 'IdentifierName') {
            key = SlimeAstUtil.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = converter.createPropertyNameAst(firstChild)
        } else {
            key = ClassCstToAst.createClassElementNameAst(firstChild, converter)
        }

        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = converter.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = converter.createFormalParametersAstWrapped(children[i])
            i++
        }

        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(children[i])
            i++
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const isConstructor = key.type === "Identifier" && (key as SlimeIdentifier).name === "constructor" &&
            !ClassCstToAst.isStaticModifier(staticCst)
        const isStatic = ClassCstToAst.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)
    }


    /**
     * generator 方法
     */
    private static createMethodDefinitionGeneratorMethodAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = converter.createUniqueFormalParametersAst(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'method', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken
        )
    }


    /**
     * async 方法
     */
    private static createMethodDefinitionAsyncMethodAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = converter.createUniqueFormalParametersAst(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'method', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken
        )
    }


    /**
     * async 方法 (从 MethodDefinition children 直接处理)
     */
    private static createMethodDefinitionAsyncMethodFromChildren(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return ClassCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst, converter)
        }
        return ClassCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst, converter)
    }

    /**
     * async generator 方法
     */
    private static createMethodDefinitionAsyncGeneratorMethodAst(
        staticCst: SubhutiCst | null,
        cst: SubhutiCst,
        converter: SlimeCstToAstType
    ): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        let staticToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = ClassCstToAst.createClassElementNameAst(classElementNameCst, converter)
        const isComputed = ClassCstToAst.isComputedPropertyName(classElementNameCst)

        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = converter.createUniqueFormalParametersAst(children[i])
            i++
        }

        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = converter.createFunctionBodyAst(bodyChild)
            i++
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        return SlimeAstUtil.createMethodDefinition(
            key, functionExpression, 'method', isComputed,
            ClassCstToAst.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken
        )
    }
}
