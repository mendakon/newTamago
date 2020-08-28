"use strict"

const wakachiText = require("./wakachiText")


const wakachiEachElement = async (splitedArray) => {
    let result = []
    for(let i=0; i<splitedArray.length; i++){
        const attr = splitedArray[i].attr
        if(attr==="url"){
            const urlElementArray = splitedArray[i].value.split("/")
            for(let j=0; j<urlElementArray.length; j++){
                let elm
                
                //最初の一回
                if(j===0){
                    elm = {"attr":"url","value":urlElementArray[0]+"//","isUrlFirst":true,"isUrlEnd":false}
                    j++
                }else if(j+1 === urlElementArray.length){//最後の一回
                    elm = {"attr":"url","value":urlElementArray[j]+"/","isUrlFirst":false,"isUrlEnd":true}
                }else{//それ以外
                    elm = {"attr":"url","value":urlElementArray[j]+"/","isUrlFirst":false,"isUrlEnd":false}
                }
                result.push(elm)
            }
        }else if(attr==="hashTag"){
            let elm = {"attr":"hashTag","value":splitedArray[i].value}
            result.push(elm)            
        }else if(attr==="reply"){
            let elm = {"attr":"reply","value":splitedArray[i].value}
            result.push(elm)
        }else if(attr==="emoji"){
            let elm = {"attr":"emoji","value":splitedArray[i].value}
            result.push(elm)
        }else if(attr==="break"){
            let elm = {"attr":"break","value":splitedArray[i].value}
            result.push(elm)
        }else if(attr==="blank"){
            let elm = {"attr":"blank","value":splitedArray[i].value}
            result.push(elm)
        }else if(attr==="textWrapper"){
            const content = splitedArray[i].value
            const wakachied = await wakachiText(content)
            wakachied.forEach(elm => {    
                result.push(elm)
            });

        }else{
            console.log(attr)
        }

    }
    
    return result
} 

module.exports = wakachiEachElement