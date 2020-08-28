"use strict"

const fs = require("fs").promises
const Mastodon = require("mastodon-api")
const path = require("path")

const toot = require("./toot")
const loadToot = require("./loadToot")
const saveElements = require("./saveElements")
const makeTootContents = require("./makeTootContents")

const baseUrl = "https://mstdn.tamag.org"

const streamUrl = "streaming/public/local"

//認証ファイルの名前
const authFileName = path.join("../authedId.json")

/*
30分まで待つsetTimeout使いpromise化
*/

let ddelta = 1800
const waitHarfTime = () => {
    const date = new Date()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    const now = (minutes%30)*60+seconds//分数は30分以下にしたいのでmod30

    const delta = 30*60 - now

    const isOver = ddelta < delta
    ddelta = delta
    
    return isOver;
}


;(async()=>{
    //トークンコードを読みこむ
    const input = await fs.readFile(`${authFileName}`, "utf-8")
    .catch((err)=>console.error(err))

    //アクセストークンだけ取り出す
    const accessToken = JSON.parse(input).accessToken

    //M君を作成
    const info = {
        access_token:accessToken,
        timeout_ms: 60 * 1000,
        api_url: `${baseUrl}/api/v1/`,
    }
    const M = new Mastodon(info)

    /**
     * 購読を開始（トゥートを読み込むたびに作動）
     */
    const listener = M.stream(streamUrl)
    listener.on('message', loadToot.onLoadMeaasage)
    listener.on('error', (error)=>console.log(error))

    /**
     * 30分おきに作動
     */
    while(true){
        //if(waitHarfTime()){console.log("ボンバイエ")}
        const word = loadToot.queueStack.shift()
        if(word){
            await saveElements(word)
        }
        await (async()=>new Promise((resolve)=>setTimeout(()=>resolve(),1000)))()
        console.log("--------------------------------------------------")
        console.log(await makeTootContents())
    }
})()