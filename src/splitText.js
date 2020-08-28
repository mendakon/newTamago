"use strict"
/**
 * splitText 文字列を受け取って成型したそれをオブジェクトを返す
 *           再帰関数になっている。 
 * 
 */

const https = require("https") 
const cutAttr = require("./cutAttr");

const splitText = async function recursion(text){
    let result = []
    const urlRegex = /(https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/ig
    const hashtagsRegex = /[#][Ａ-Ｚａ-ｚA-Za-z一-鿆0-9０-９ぁ-ヶｦ-ﾟー_]+/ig
    const replyRegex = /[@][A-Za-z0-9_]+/ig

    //emojiのregex
    const emojis = await getEmojis()
    const catEmojis = emojis.reduce((acc,emoji)=>acc+=("|"+":"+emoji+":"))
    const emojiRegex = new RegExp(catEmojis,"ig")
    
    //全体からurlを探す
    result = cutAttr(urlRegex,"url",text)

    //未整備の要素を検索ししてハッシュタグを探す
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "undeveloped"){
            result[i] = cutAttr(hashtagsRegex,"hashTag",result[i].value)
        }
    }
    //配列の入れ子になるので平たんにする
    result = result.flat()

    //未整備の要素を検索ししてリプライを探す
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "undeveloped"){
            result[i] = cutAttr(replyRegex,"reply",result[i].value)
        }
    }
    //配列の入れ子になるので平たんにする
    result = result.flat()


    //絵文字を探す
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "undeveloped"){
            result[i] = cutAttr(emojiRegex,"emoji",result[i].value)
        }
    }

    //配列の入れ子になるので平たんにする
    result = result.flat()
    /** 
     * テキスト外に単体で存在する記号類に属性をつける
    */
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "undeveloped"){
            if(/^\s+$/.test(result[i].value)){//空白だけ
                result[i].attr = "blank"
            }else if(result[i].value === ""){//無を消す
                result.splise(i,1)
                i--
            }else if(/^(<br>|<br \/>)$/.test(result[i].value)){//改行
                result[i].attr = "break"
            }else{
                result[i].attr = "textWrapper"//その他はテキスト
            }
        }
    }
    /**
     * ここからtextWrapperの操作
     * テキスト中に存在するカッコ、改行、空白を区別していく
    */

    const blankRegex = /\s+/ig//空白の正規表現
    const breakRegex = /(<br>|<br \/>)/ig//改行の正規表現

    //カッコの正規表現を作成
    const allBrackets = [["\(","\)"],["{","}"],["\[","\]"],["\"","\""],["（","）"],["｛","｝"],["「","」"],["【","】"],["［","］"],["『","』"],["〔","〕"]]
    const bracketsRegexStr = allBrackets.reduce(((acc,cur)=>acc+`\\${cur[0]}.+?\\${cur[1]}|`),"")
    const bracketsRegex = new RegExp(bracketsRegexStr.slice(0,-1),"ig")

    const symbols = [" <",">","(",")","%","^","。","、","？","！","・","!","?","&","|",]
    const catSymbols = symbols.reduce((acc,symbol)=>acc+=("|\\"+symbol))
    const symbolsRegex = new RegExp(catSymbols,"ig")

    //console.log(catSymbols)

    /**
     * カッコに関する処理
     * どのかっこが出現しているか区別して属性bracketとして保存する
     */
    for(let i=0; i<result.length; i++){
        //テキストである要素を探し
        if(result[i].attr === "textWrapper"){
            let brackets = cutAttr(bracketsRegex, "bracket", result[i].value)//カッコで分ける
            for(let j=0; j<brackets.length; j++){//hitしたカッコにそれぞれ
                if(brackets[j].attr === "bracket"){
                    const temp = brackets[j]
                    //カッコの先頭
                    const bracketHeader = brackets[j].value[0]
                    
                    //どのカッコかを区別し保存する
                    const hitBracketsPair =  allBrackets.reduce((acc,cur)=>{
                        return cur[0]===bracketHeader?cur:acc
                    })

                    //カッコで囲まれた文字列の先頭を切り出し挿入（カッコのはじめ）
                    brackets[j] = {"attr":"bracket","value":bracketHeader, "bracket":hitBracketsPair }
                    j++

                    //中身を挿入
                    brackets.splice(j,0,
                                    {
                                        "attr":"undeveloped",
                                        "value":temp.value.slice(1,temp.value.length-1),
                                        "bracket":hitBracketsPair
                                    }
                                )
                    j++

                    //閉じカッコ
                    brackets.splice(j,0,{"attr":"bracket","value":temp.value[temp.value.length-1], "bracket":hitBracketsPair})
                }
            }
            result[i].value = brackets
        }
    }

    //改行で分離
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "textWrapper"){
            for(let j=0; j<result[i].value.length; j++){
                if(result[i].value[j].attr === "undeveloped"){
                    result[i].value[j] = cutAttr(breakRegex, "break", result[i].value[j].value, result[i].value[j].bracket)
                }
            }
             result[i].value = result[i].value.flat()   
        }
    }

    //空白で分離
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "textWrapper"){
            for(let j=0; j<result[i].value.length; j++){
                if(result[i].value[j].attr === "undeveloped"){
                    result[i].value[j] =  cutAttr(blankRegex, "blank", result[i].value[j].value, result[i].value[j].bracket)
                }
            }
            result[i].value = result[i].value.flat() 
        }
    }

    //シンボルで分離
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "textWrapper"){
            for(let j=0; j<result[i].value.length; j++){
                if(result[i].value[j].attr === "undeveloped"){
                    result[i].value[j] =  cutAttr(symbolsRegex, "symbol", result[i].value[j].value, result[i].value[j].bracket)
                }
            }
            result[i].value = result[i].value.flat() 
        }
    }

    //残りをtextに変換
    for(let i=0; i<result.length; i++){
        if(result[i].attr === "textWrapper"){
            for(let j=0; j<result[i].value.length; j++){
                if(result[i].value[j].attr === "undeveloped"){
                    result[i].value[j].attr = "text"
                }
            }
            result[i].value = result[i].value.flat() 
        }
    }
    
    return result
}

/**
 * 絵文字を取得する
 * パースして返す
 */
const getEmojis = async () =>new Promise((resolve, reject)=> {
    const url = 'https://mstdn.tamag.org/api/v1/custom_emojis'
    let result = ""
    
    const req = https.request(url, (res) => {
        //取得したら
        res.on('data', (chunk) => {
            result += chunk
        })
        //最後まで取得したら
        res.on('end', () => {
            try{
                const parsedData = JSON.parse(result)
                const emojiList = parsedData.map(emoji=>emoji.shortcode)
                resolve(emojiList)
            }catch(e){
                console.log(result)
                exit()
            }
        })
    })
    //エラーが起きたら
    req.on('error', (e) => {
        reject(`problem with request: ${e.message}`)
    })
    
    //リクエストを実行
    req.end();
})

module.exports = splitText

/*;(async()=>{
    const result = await splitText("こんちくわ&さようなら")
    console.log(JSON.stringify(result))
})()*/