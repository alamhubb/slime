/**
 * ClassDeclarationCstToAst - class body/element 转换
 */
import { SubhutiCst } from "subhuti";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptClassBody, SlimeJavascriptClassDeclaration, SlimeJavascriptClassExpression,
    SlimeJavascriptExpression, SlimeJavascriptIdentifier, SlimeJavascriptLiteral,
    SlimeJavascriptMethodDefinition, SlimeAstTypeName,
    SlimeJavascriptPropertyDefinition, SlimeJavascriptStatement,
    SlimeJavascriptTokenCreateUtils, SlimeClassBody, SlimeClassDeclaration, SlimeIdentifier, SlimeTokenCreateUtils,
    SlimeAstCreateUtils, SlimeClassExpression, SlimeExpression, SlimePropertyDefinition,
    SlimeStatement, SlimeLiteral
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class SlimeJavascriptClassDeclarationCstToAstSingle {

    /**
     * 创建 ClassDeclaration AST
     * 支持泛型参数和 implements（TypeScript 扩展）
     */
    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreateUtils.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
            // TSTypeParameterDeclaration 当前忽略（ESTree 不支持泛型参数）
        }

        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        const classTailResult = SlimeCstToAstUtil.createClassTailAst(classTailCst)

        return SlimeAstCreateUtils.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )
    }

    /**
     * 创建 ClassExpression AST
     */
    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        if (!classTailCst) {
            throw new Error('ClassExpression missing ClassTail')
        }

        const classTail = SlimeCstToAstUtil.createClassTailAst(classTailCst)
        return SlimeAstCreateUtils.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
    }

    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0] // ClassBody -> ClassElementList?，第一项为列表容器
        const body: Array<SlimeJavascriptMethodDefinition | SlimePropertyDefinition | any> = [] // 收集类成�?(any 用于 StaticBlock)
        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) { // 遍历 ClassElement
                const elementChildren = element.children ?? [] // 兼容无子节点情况
                if (!elementChildren.length) {
                    continue // 没有内容�?ClassElement 直接忽略
                }

                // 找到真正的成员定义（跳过 �?SemicolonASI�?
                let staticCst: SubhutiCst | null = null
                let targetCst: SubhutiCst | null = null
                let classStaticBlockCst: SubhutiCst | null = null

                for (const child of elementChildren) {
                    if (child.name === 'Static' || child.value === 'static') {
                        staticCst = child
                    } else if (child.name === 'SemicolonASI' || child.name === 'Semicolon' || child.value === ';') {
                        // 跳过分号
                        continue
                    } else if (child.name === 'ClassStaticBlock') {
                        // ES2022 静态块
                        classStaticBlockCst = child
                    } else if (child.name === SlimeParser.prototype.MethodDefinition?.name ||
                        child.name === SlimeParser.prototype.FieldDefinition?.name ||
                        child.name === 'MethodDefinition' || child.name === 'FieldDefinition') {
                        targetCst = child
                    }
                }

                // 处理静态块
                if (classStaticBlockCst) {
                    const staticBlock = SlimeCstToAstUtil.createClassStaticBlockAst(classStaticBlockCst)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }

                if (targetCst) {
                    // 根据成员类型直接调用对应方法
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(SlimeCstToAstUtil.createMethodDefinitionAst(staticCst, targetCst))
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(SlimeCstToAstUtil.createFieldDefinitionAst(staticCst, targetCst))
                    }
                }
            }
        }
        return {
            type: astName as any, // 构�?ClassBody AST
            body: body, // 挂载类成员数�?
            loc: cst.loc // 透传位置信息
        }
    }


    /**
     * ClassElementList CST �?AST
     */
    createClassElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = SlimeCstToAstUtil.createClassElementAst(child)
                if (element) {
                    elements.push(element)
                }
            }
        }
        return elements
    }


    /**
     * ClassElement CST �?AST
     * ClassElement -> MethodDefinition | MethodDefinition | FieldDefinition | ...
     */
    createClassElementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        // 检查是否是 static
        let staticCst: SubhutiCst | null = null
        let startIndex = 0
        if (firstChild.name === 'Static' || firstChild.value === 'static') {
            staticCst = firstChild
            startIndex = 1
        }

        const actualChild = cst.children?.[startIndex]
        if (!actualChild) return null

        // 根据类型处理
        if (actualChild.name === SlimeParser.prototype.MethodDefinition?.name ||
            actualChild.name === 'MethodDefinition') {
            return SlimeCstToAstUtil.createMethodDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return SlimeCstToAstUtil.createFieldDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return SlimeCstToAstUtil.createClassStaticBlockAst(actualChild)
        }

        return null
    }


    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.FieldDefinition?.name);

        // FieldDefinition -> (ClassElementName | PropertyName) + Initializer?
        // ES2022: ClassElementName = PrivateIdentifier | PropertyName
        const elementNameCst = cst.children[0]
        const key = SlimeCstToAstUtil.createClassElementNameAst(elementNameCst)

        // 检查是否是计算属�?
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(elementNameCst)

        // 检查是否有初始化器
        let value: SlimeExpression | null = null
        if (cst.children.length > 1) {
            const initializerCst = cst.children[1]
            if (initializerCst && initializerCst.name === SlimeParser.prototype.Initializer?.name) {
                value = SlimeCstToAstUtil.createInitializerAst(initializerCst)
            }
        }

        // 检查是否有 修饰�?
        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)

        // 注意参数顺序�?key, value, computed, isStatic, loc)
        return SlimeJavascriptCreateUtils.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
    }


    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: { ClassStaticBlockBody }
     */
    createClassStaticBlockAst(cst: SubhutiCst): any {
        // CST 结构: ClassStaticBlock -> [IdentifierName:"static", LBrace, ClassStaticBlockBody, RBrace]
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let bodyStatements: SlimeStatement[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(child.loc)
            } else if (child.name === 'ClassStaticBlockBody') {
                // ClassStaticBlockBody -> ClassStaticBlockStatementList -> StatementList
                const stmtListCst = child.children?.find((c: any) =>
                    c.name === 'ClassStaticBlockStatementList' || c.name === 'StatementList'
                )
                if (stmtListCst) {
                    const actualStatementList = stmtListCst.name === 'ClassStaticBlockStatementList'
                        ? stmtListCst.children?.find((c: any) => c.name === 'StatementList')
                        : stmtListCst
                    if (actualStatementList) {
                        bodyStatements = SlimeCstToAstUtil.createStatementListAst(actualStatementList)
                    }
                }
            }
        }

        return SlimeJavascriptCreateUtils.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }


    /**
     * ClassStaticBlockBody CST �?AST
     */
    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        )
        if (stmtList) {
            return SlimeCstToAstUtil.createClassStaticBlockStatementListAst(stmtList)
        }
        return []
    }


    /**
     * ClassStaticBlockStatementList CST �?AST
     */
    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return SlimeCstToAstUtil.createStatementListAst(stmtList)
        }
        return []
    }


    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1]) // ClassHeritage -> extends + LeftHandSideExpression
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined

        // ClassHeritage: extends LeftHandSideExpression
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeJavascriptTokenCreateUtils.createExtendsToken(extendsCst.loc)
        }

        const superClass = SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1])
        return { superClass, extendsToken }
    }


    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null // 超类默认�?null
        let body: SlimeClassBody = { type: SlimeAstTypeName.ClassBody as any, body: [], loc: cst.loc } // 默认空类�?
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ClassTail = ClassHeritage? { ClassBody? }
        // 遍历 children 找到 ClassHeritage �?ClassBody
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = SlimeCstToAstUtil.createClassHeritageAstWithToken(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = SlimeCstToAstUtil.createClassBodyAst(child)
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(child.loc)
            }
        }

        // 设置 body �?brace tokens
        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return { superClass, body, extendsToken, lBraceToken, rBraceToken }
    }


    /**
     * ClassElementName CST �?AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassElementName?.name)
        const first = cst.children[0]
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children')
        }
        if (first.name === 'PrivateIdentifier') {
            return SlimeCstToAstUtil.createPrivateIdentifierAst(first)
        }
        // PropertyName
        return SlimeCstToAstUtil.createPropertyNameAst(first)
    }


    /**
     * 检�?CST 节点是否表示 修饰�?
     * 兼容 Static �?IdentifierNameTok (value='static') 两种情况
     */
    isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        // 方式1：直接是 Static
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static' || cst.name === 'Static') {
            return true
        }
        // 方式2：是 IdentifierNameTok �?value �?'static'
        if ((cst.name === 'IdentifierName' || cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }


    /**
     * 检�?ClassElementName/PropertyName 是否是计算属性名
     */
    isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false

        // 递归查找 ComputedPropertyName
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
}

export const SlimeJavascriptClassDeclarationCstToAst = new SlimeJavascriptClassDeclarationCstToAstSingle()
