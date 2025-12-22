/**
 * ClassDeclarationCstToAst - class body/element 转换
 */
import {SubhutiCst} from "subhuti";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {
    SlimeAstUtil,
    SlimeClassBody, SlimeClassDeclaration, SlimeClassExpression,
    SlimeExpression, SlimeIdentifier, SlimeLiteral,
    SlimeMethodDefinition, SlimeAstTypeName,
    SlimePropertyDefinition, SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class ClassDeclarationCstToAst {

    static createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        // 检�?CST 节点名称是否�?ClassDeclaration
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        // Token fields
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点，提取 class token、标识符�?ClassTail
        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        // ClassTail 是必须的
        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        // 解析 ClassTail，获取类体和父类信息
        const classTailResult = SlimeCstToAstUtil.createClassTailAst(classTailCst)

        // 创建类声�?AST 节点（id 可能�?null，用于匿名类�?
        const ast = SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )

        return ast
    }

    static createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null // class 表达式可选的标识�?
        let tailStartIndex = 1 // 默认 ClassTail 位于索引 1
        const nextChild = cst.children[1]
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(nextChild) // 若存在标识符则解�?
            tailStartIndex = 2 // ClassTail 的位置后�?
        }
        const classTail = SlimeCstToAstUtil.createClassTailAst(cst.children[tailStartIndex]) // 统一解析 ClassTail

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc) // 生成 ClassExpression AST
    }

    static createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0] // ClassBody -> ClassElementList?，第一项为列表容器
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = [] // 收集类成员 (any 用于 StaticBlock)
        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) { // 遍历 ClassElement
                const elementChildren = element.children ?? [] // 兼容无子节点情况
                if (!elementChildren.length) {
                    continue // 没有内容�?ClassElement 直接忽略
                }

                // 找到真正的成员定义（跳过 static �?SemicolonASI�?
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
    static createClassElementListAst(cst: SubhutiCst): any[] {
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
     * ClassElement -> MethodDefinition | static MethodDefinition | FieldDefinition | ...
     */
    static createClassElementAst(cst: SubhutiCst): any {
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


    static createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
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

        // 检查是否有 static 修饰�?
        const isStatic = SlimeCstToAstUtil.isStaticModifier(staticCst)

        // 注意参数顺序�?key, value, computed, isStatic, loc)
        return SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
    }


    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    static createClassStaticBlockAst(cst: SubhutiCst): any {
        // CST 结构: ClassStaticBlock -> [IdentifierName:"static", LBrace, ClassStaticBlockBody, RBrace]
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let bodyStatements: SlimeStatement[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
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

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }


    /**
     * ClassStaticBlockBody CST �?AST
     */
    static createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
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
    static createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return SlimeCstToAstUtil.createStatementListAst(stmtList)
        }
        return []
    }


    static createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1]) // ClassHeritage -> extends + LeftHandSideExpression
    }

    static createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined

        // ClassHeritage: extends LeftHandSideExpression
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc)
        }

        const superClass = SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1])
        return {superClass, extendsToken}
    }


    static createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null // 超类默认�?null
        let body: SlimeClassBody = {type: SlimeAstTypeName.ClassBody as any, body: [], loc: cst.loc} // 默认空类�?
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
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 设置 body �?brace tokens
        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return {superClass, body, extendsToken, lBraceToken, rBraceToken}
    }


    /**
     * ClassElementName CST �?AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    static createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
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
     * 检�?CST 节点是否表示 static 修饰�?
     * 兼容 Static �?IdentifierNameTok (value='static') 两种情况
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
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
    static isComputedPropertyName(cst: SubhutiCst): boolean {
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
