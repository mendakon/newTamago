"use strict"
const fs = require("fs").promises

const fileName = "./words.json"

const saveElements = async (words) => {
    const input = await fs.readFile(`${fileName}`, "utf-8")
        .catch((err)=>console.error(err))

    let data = JSON.parse(input)

    words.forEach(element => {
        data.push(element)
    });

    data.sort((a,b)=>(a.hash>b.hash?1:-1))

    const ouputJson = JSON.stringify(data,null,"  ")

    await fs.writeFile(fileName,ouputJson)
        .catch((err)=>console.log(err))
}

module.exports = saveElements

