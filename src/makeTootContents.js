"use strict"

const fs = require("fs").promises

const fileName = "./words.json" //単語を入れておくファイルの名前
/**
 * fileNameを読み込んでその中の単語から文章を作り返す
*/
const makeTootContents = async()=>{
    //ファイルを読み込み
    const input = await fs.readFile(`${fileName}`, "utf-8")
        .catch((err)=>console.error(err))

    //読み込んだ値をパースしてデータに
    const data = JSON.parse(input)

    //もしデータがないなら
    if(!data.length)return ""

    let firstWordSorted = data.concat()//データを直接いじらずコピーする値を

    firstWordSorted.sort((a,b)=>a.index-b.index)//index=1を取り出しやすくするためにソート

    //index==1だけの配列をつくる
    let firstWordArray = []
    for(let i=0; i<firstWordSorted.length; i++){
        if(firstWordSorted[i].index > 1)break//index順に並んでいるはずなのでindex==2が来たらすぐ終わる
        firstWordArray.push(firstWordSorted[i])
    }
    const firstWord = firstWordArray[randomNum(firstWordArray.length)]

    //console.log(firstWord.value)

    let totalWord = firstWord.value
    let word = firstWord
    let nextHash = word.nextHash

    //console.log(word)
    while(nextHash){
        //もしテキストでなければ、自身をとばして同じトゥートの次に行ってもらう
        let isText = word.attr==="text"||word.attr==="url"
        
        //全体の配列から候補だけを抽出する（むずかしい）
        const serchedArray = data.filter((d)=>{
            /**
             * trueがでたものだけがフィルターされる
             * 要素は4つ
             * isHashMatch:現在の要素が指し示すハッシュ値と同一であるか
             * isNotMine:ハッシュが同値、次のハッシュも同値の場合、（自身と同一である可能性が高い）
             * symbolSkipper:シンボルである場合、tootIdが同じものしか受けつかない
             * braketController :カッコを持たない場合、カッコのはじめかカッコを持たない者にマッチ、カッコを持つ場合、カッコを持つもので、自分のカッコと同一のものにしかマッチしてはいけない
            */
            const isHashMatch = d.hash===nextHash
            const isNotMine = !((word.hash === d.hash) && (word.nextHash === d.nextHash))
            let symbolSkipper = true
            if(!isText){
                symbolSkipper = d.tootId === word.tootId
            }
            const bracketController = (()=>{
                let isOk = true
                //braketの内
                if(word.bracket && word.bracket !== "" && word.bracket[1] !== word.value){
                    isOk = false
                    if(d.bracket && d.bracket !== ""){//dにはbracketのあるもののみ
                        isOk = d.bracket[0] === word.bracket[0]//その中で同じもののみ
                    }
                    
                //braketの外
                }else{
                    if(!d.bracket){//bracketの無い要素をtrue
                        isOk = true
                    }else if(d.bracket === ""){
                        isOk = true
                    }else if(d.attr === "bracket" && d.bracket[0]===d.value){
                        isOk = true
                    }else{ 
                        isOk = false
                    }
                }
                return isOk
            })()
            //console.log(isHashMatch,isNotMine,symbolSkipper,bracketController)
            return isHashMatch && isNotMine && symbolSkipper && bracketController
        })

        //console.log("--------------------------------------------------------------------------------------")

        //抽出された中からランダムに選ぶ
        const randomIndex = randomNum(serchedArray.length)
        word = serchedArray[randomIndex]

        //改行なら改行コードを挿入
        if(word.attr === "break"){
            totalWord += "\n"
        }else{ //それ以外ならそのまま挿入
            totalWord += word.value
            if(word.isUrlEnd){//urlの最後は空白を入れる
                totalWord +=" "
            }
        }
        
        //console.log(word)

        //次の値をハッシュで探す
        nextHash = word.nextHash

    }
    //console.log(word)
    return totalWord
    
}



const randomNum = (max=0) => {
    return Math.floor(Math.random()*max)
}



module.exports = makeTootContents