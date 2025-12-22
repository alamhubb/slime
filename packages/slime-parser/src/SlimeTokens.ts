// ============================================
// Token 对象（用于 TokenConsumer 复用）
// ============================================
import {
    type SubhutiCreateToken,
} from "subhuti";
import {slimeJavascriptTokens} from "./deprecated/SlimeJavascriptTokens.ts";

export const SlimeTokensObj = {
    ...slimeJavascriptTokens
}

const slimeTokens: SubhutiCreateToken[] = Object.values(SlimeTokensObj)
export default slimeTokens