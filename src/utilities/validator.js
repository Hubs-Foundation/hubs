
function validDisplayName(displayName, pattern) {  
    if(!pattern){
        pattern = /^[a-zA-Z가-힇ㄱ-ㅎㅏ-ㅣ一-龥0-9_~ -]{2,32}$/;
    }
    return pattern.test(displayName);
}

export default { 
    validDisplayName
};