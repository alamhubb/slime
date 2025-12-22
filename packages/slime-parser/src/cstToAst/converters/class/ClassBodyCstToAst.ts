import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeClassBody, SlimeMethodDefinition, SlimePropertyDefinition, SlimeStatement } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 类体 CST 到 AST 转换器
 * 
 * 负责处理：
 * - ClassBody: 类体
 * - ClassElementList: 类元素列表
 * - ClassElement: 类元素
 * - ClassElementName: 类元素名称
 * - ClassStaticBlock: 静态块 (ES2022)
 * - ClassStaticBlockBody: 静态块体
 * - ClassStaticBlockStatementList: 静态块语句列表
 */
export class ClassBodyCstToAst {

    /**
     * 创建 ClassBody AST
     */
    static createClassBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeClassBody {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0] // ClassBody -> ClassElementList?，第一项为列表容器
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = [] // 收集类成员 (any 用于 StaticBlock)
        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) { // 遍历 ClassElement
                const elementChildren = element.children ?? [] // 兼容无子节点情况
                if (!elementChildren.length) {
                    continue // 没有内容的 ClassElement 直接忽略
                }

                // 找到真正的成员定义（跳过 static 和 SemicolonASI）
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
                    const staticBlock = this.createClassStaticBlockAst(classStaticBlockCst, util)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }


                if (targetCst) {
                    // 根据成员类型直接调用对应方法
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(util.createMethodDefinitionAst(staticCst, targetCst))
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(util.createFieldDefinitionAst(staticCst, targetCst))
                    }
                }
            }
        }
        return {
            type: astName as any, // 构造 ClassBody AST
            body: body, // 挂载类成员数组
            loc: cst.loc // 透传位置信息
        }
    }

    /**
     * 创建 ClassElementList AST
     */
    static createClassElementListAst(cst: SubhutiCst, util: SlimeCstToAst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = this.createClassElementAst(child, util)
                if (element) {
                    elements.push(element)
                }
            }
        }
        return elements
    }

    /**
     * 创建 ClassElement AST
     */
    static createClassElementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
            return util.createMethodDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return util.createFieldDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return this.createClassStaticBlockAst(actualChild, util)
        }

        return null
    }

    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    static createClassStaticBlockAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                        bodyStatements = util.createStatementListAst(actualStatementList)
                    }
                }
            }
        }

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * 创建 ClassStaticBlockBody AST
     */
    static createClassStaticBlockBodyAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        )
        if (stmtList) {
            return this.createClassStaticBlockStatementListAst(stmtList, util)
        }
        return []
    }

    /**
     * 创建 ClassStaticBlockStatementList AST
     */
    static createClassStaticBlockStatementListAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return util.createStatementListAst(stmtList)
        }
        return []
    }
}
