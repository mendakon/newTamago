/**
 * TLからトゥートを受け取り書き出す
*/

"use strict"
//比較的もっさりめのjsonを使うので高速化を目的にhashを利用する
const crypto = require('crypto');

//文字を属性ごとに分割する
const splitText = require("./splitText")
//分割したものをさらに分かち書きして返す
const wakachiEachElement = require("./wakachiEachElement")


//同時に読み書きされるとまずいと思うので、処理した値をmainで扱うためにキューに積む
let queueStack = []


const onLoadMeaasage = async (toot) => {
    //投稿のみをキャッチそれ以外をスルー
    if(toot.event !== 'update'){return}
    
    const content = toot.data.content
    const tootId = toot.data.id
    const spoilerText = toot.data.spoiler_text//たまご調教のスポイラー以外読まない
    const sensitive = toot.data.sensitive//センシティブだと読みたくない
    const isBot = toot.data.account.bot//botだと読みたくない
    //たまごと調教を含むスポイラーを読む
    const isGoodSpoilerText = (spoilerText === "") || (/たまご/.test(spoilerText) && /調教/.test(spoilerText))

    //条件から外れると読み込まない
    if(isBot || sensitive || !isGoodSpoilerText || !content){
        return
    }

    //処理に必要ない不要な文字を削除する
    const text = await moldToot(content)

    //文字列を属性をつけて分ける
    const splited = await splitText(text)
    
    //さらにその一つ一つを分かち書きしてフラットにする）
    const wakachiedElements = await wakachiEachElement(splited)

    //帰ってきた配列を成型
    let hash = ""//高速化のためにハッシュをつけるが、前回のハッシュを記録しておく
    for(let i=1; i<wakachiedElements.length; i++){
        wakachiedElements[i-1].next = wakachiedElements[i].value//次の値
        wakachiedElements[i-1].tootId = tootId//トゥートID
        wakachiedElements[i-1].index = i //自分の順番
        wakachiedElements[i-1].hash = hash //自分の値のハッシュ（nextHashは一周前に計算済）
        const hashSeed = wakachiedElements[i].value + wakachiedElements[i].attr//ハッシュのシードは属性と自身の値
                
        hash = crypto.createHash('sha256').update(hashSeed).digest('hex')
        
        wakachiedElements[i-1].nextHash = hash//次の要素のハッシュを挿入
    }

    //最後の１要素は回らないので手動で入れる
    wakachiedElements[wakachiedElements.length-1].next = false //最後は次の値を持たない
    wakachiedElements[wakachiedElements.length-1].tootId = tootId
    wakachiedElements[wakachiedElements.length-1].index = wakachiedElements.length
    wakachiedElements[wakachiedElements.length-1].hash = hash 
    wakachiedElements[wakachiedElements.length-1].nextHash = false 
    
    
    
    //キューに入れて終了（入れた値はmainで処理）
    queueStack.push(wakachiedElements)
    

}

const moldToot = async (text) => {
    let result = text
    
    result = result.replace(/<p>/g,"").replace(/<\/p>/g,"")//pタグの削除
    result = result.replace(/<a(?: .+?)?>/g,"").replace(/<\/a>/g,"")//aタグの削除
    result = result.replace(/<span(?: .+?)?>/g,"").replace(/<\/span>/g,"")//spanタグの削除
    result = result.replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,"\"").replace(/&amp;/g,"&").replace(/&apos;/g,"\'")
    .replace(/&nbsp;/g," ")
    result = result.replace(/&.+?;/g,"")//よくわからんのを殺す

    return result
}



module.exports = {
    "onLoadMeaasage":onLoadMeaasage,
    "queueStack":queueStack
}