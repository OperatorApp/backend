




const query = require('../models/queries.js')




async function getCurrentOperatorLanguage(operatorId){
    return await query.getOperatorsLanguages(operatorId)
}





module.exports=  {getCurrentOperatorLanguage}







