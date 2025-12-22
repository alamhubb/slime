/**
 * MemberCallCstToAst - 成员访问/调用表达式/可选链转换
 */
import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, type SlimeCallArgument,
    SlimeExpression,
    type SlimeIdentifier, SlimeAstTypeName, type SlimePattern, SlimeSpreadElement, type SlimeSuper,
    SlimeTokenCreate,
    type SlimeVariableDeclarator
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptMemberCallCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeMemberCallCstToAstSingle extends SlimeJavascriptMemberCallCstToAstSingle{

}


export const SlimeMemberCallCstToAst = new SlimeMemberCallCstToAstSingle()
