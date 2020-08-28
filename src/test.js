"use strict"

const fs = require("fs").promises

const fileName = "./words.json"

const makeTootContents = async()=>{
    const input = await fs.readFile(`${fileName}`, "utf-8")
    .catch((err)=>console.error(err))

    const data = JSON.parse(input)

    let firstWordArray = []
    for(let i=0; i<data.length; i++){
        if(data[i].index > 1)break
        firstWordArray.push(data[i])
    }
    const firstWord = firstWordArray[randomNum(firstWordArray.length)]

    console.log(firstWord.value)

    let nextHash = firstWord.nextHash
    let totalWord = firstWord.value
    let word = firstWord
    while(nextHash){
        const serchedArray = data.filter((d)=>d.hash===nextHash)
        const randomIndex = randomNum(serchedArray.length)
        word = serchedArray[randomIndex]
        nextHash = word.nextHash
        totalWord += word.value
        console.log(word)
    }
    console.log(word)
    console.log(totalWord)
    
}



const randomNum = (max=0) => {
    return Math.floor(Math.random()*max)
}



(async()=>{
    await makeTootContents()
})()