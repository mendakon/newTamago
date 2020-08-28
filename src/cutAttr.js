/**
 * 
 * @param {attrを表現する正規表現} regex 
 * @param {その正規表現の属性、url,bracket,hashtag} attr 
 * @param {対象の文字列} str 
 * 
 * 特定の正規表現で文章を分割し、それに属性をつけ、{attr:属性,value:text,bracket:}の形で返す
 */

"use strict"

const cutAttr = (regex,attr,str,bracket="")=>{
    let result = []

    const matches = str.matchAll(regex)
    let headIndex = 0
    for (const match of matches) {
        //前にヒットした箇所からヒットした箇所との間
        const hitForward = str.slice(headIndex,match.index)
        //ヒットした箇所
        const hit = str.slice(match.index,match.index + match[0].length)
        if(hitForward!==""){
            result.push({"attr":"undeveloped","value":hitForward,"bracket":bracket})
        }
        result.push({"attr":attr,"value":hit,"bracket":bracket})
        //自分のケツを次のために保存
        headIndex = match.index + match[0].length
    }
    const last = str.slice(headIndex)
    if(last!==""){
        result.push({"attr":"undeveloped","value":last,"bracket":bracket})
    }
    return result
}

module.exports = cutAttr