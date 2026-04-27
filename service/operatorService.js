const query = require('../models/queries.js')


async function getCurrentOperatorLanguage(operatorId){
    return await query.getOperatorsLanguages(operatorId)
}


const updateLanguageSer = async (operatorId, languages) => {
    await query.updateOperatorLanguage(operatorId, languages)
}


const getLanguagesSer = async (operatorId) => {
    return await query.getOperatorsLanguages(operatorId)
}

module.exports=  {getCurrentOperatorLanguage, updateLanguageSer, getLanguagesSer}







