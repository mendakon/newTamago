"use strict"

const MeCab = new require('mecab-async')
const mecab = new MeCab()
/*
var childProcess = require('child_process');
var dir = childProcess.spawn('dir');
*/

//windowsはこれないとうごかないっぽい
//コマンドが通るようにしている
if(process.platform === 'win32'){
    mecab._shellCommand = function(str){
        str.replace(/(!?\^)</g,"").replace(/(!?\^)>/g,"")
        return  'echo '+ str + ' |' + this.command
    }
}


//文字列をmecabによって分割、配列を返す
const strSegmentation = async str => {
    const words = await mecabWakachi(str)
    return words
}

//WakachiをPromise化
const mecabWakachi = (str) => new Promise((resolve,reject)=>{
    mecab.wakachi(str,(err,result)=>{
        if(err){reject(err)}
        resolve(result)
    })
})

const wakachiText = async (content)=>{
    let result = []
    
    let allTextConcat = ""//分かち書きのためすべてのテキストを結合
    let textIndex = 0//カッコや、空白の位置を記録しておく
    let tmpAnotherValue = []//text以外の値を一時的に保管
    for(let j=0; j<content.length; j++){
        //テキストなら結合、場所を記録
        if(content[j].attr === "text"){
            allTextConcat += content[j].value
            textIndex += content[j].value.length
        }else{//テキストでないなら場所と値を保存
            tmpAnotherValue.push({"tmpValue":content[j],"index":textIndex})
        }
    }
    //分かち書きをする
    let wakachiedTexts = await strSegmentation(allTextConcat)
    
    for(
            let resultIndex = 0,
            bracketState="",//カッコのステータスを記録
            textIndexCount = 0,//現在の位置を記録
            anotherValueIndex = 0,//その他の記号の次の挿入位置
            wakachiValueIndex = 0;//分かち書きの次の挿入位置

            resultIndex<wakachiedTexts.length+tmpAnotherValue.length;//分かち書き結果とその他の記号の数だけ回す
            resultIndex++,
            wakachiValueIndex++
        ){
        //wakachi分け方によっては先行してしまう！！のでもう過ぎた記号はすっ飛ばす
        
        while(tmpAnotherValue[anotherValueIndex] && tmpAnotherValue[anotherValueIndex].index <= textIndexCount){
            //もし記号の開始位置に来たら記号を挿入し、結果の配列を一つ進める
            result.push(tmpAnotherValue[anotherValueIndex].tmpValue)
            resultIndex++
            //もし記号の中でもカッコが来たなら、その値を保存する
            //カッコの終端にきたら保存した値を破棄
            if(tmpAnotherValue[anotherValueIndex].tmpValue.attr === "bracket"){
                if(tmpAnotherValue[anotherValueIndex].tmpValue.value === bracketState[1]){
                    bracketState = ""
                }else{
                    bracketState = tmpAnotherValue[anotherValueIndex].tmpValue.bracket
                }
            }
            //anotherValueIndexを進める
            anotherValueIndex++
        }
        
        if(resultIndex>=wakachiedTexts.length+tmpAnotherValue.length){break}

        
        let elem = {
            "attr":"text",
            "value":wakachiedTexts[wakachiValueIndex],
            "bracket":bracketState
        }
        try {
            textIndexCount += wakachiedTexts[wakachiValueIndex].length
        }catch(e){
            console.log(e)
            console.log("\nwakachiedTexts.length: "+wakachiedTexts.length,"\nwakachiValueIndex: "+wakachiValueIndex,"\n\n")
            console.log("\n\ncontent")
            console.log(content)
            console.log("\n\nresult")
            console.log(result)
        }
        //console.log(result,"\nwakachiedTexts.length: "+wakachiedTexts.length,"\nwakachiValueIndex: "+wakachiValueIndex,"\n\n")
        
        result.push(elem)
    }

    return result
}

module.exports = wakachiText
