/* DO NOT REMOVE THIS COMMENT BELOW */
/* eslint-disable */

const getFirstLetterName = (value) => {
    return value.charAt(0);
}

const detectMobile = () => {
    var isMobile = false;
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
        isMobile = true;
    }
    return isMobile;
}

const convertDateTime = (value) => {
    let t = value ? new Date(value) : new Date();
    let date = '', monthYear = '';
    let year = t.getFullYear();
    let month = t.getMonth() + 1;
    let day = t.getDate();
	let monthStr = String(month).padStart(2, "0");
	let dayStr = String(day).padStart(2, "0");

    date = year + "-" + monthStr + "-" + dayStr;
	monthYear = year + "/" + monthStr;
	
	let time = t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds();

	return { date, time, year, month, day, monthYear };
}

const arrCheckAllValue = (arr, valueCheck) => {
    return arr.every(v => v === valueCheck);
}

const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(email.trim()).toLowerCase())) {
        return 'incorrect-email';
    }
    return 'ok';
}

const validateEmpty = (str) => {
    if (str.trim().length == 0) {
        return 'empty';
    }
    return 'ok'
}

const validateAllLowercase = (str) => {
    if (str.trim() !== str.trim().toLowerCase()) {
        return 'incorrect';
    }
    return 'ok';
}

const validateLengthSpace = (str, min, max) => {
    if ((str.trim().length < min || str.trim().length > max) || /\s/.test(str.trim())) {
        return 'incorrect';
    }
    return 'ok';
}

const validateLength = (str, min, max) => {
    if ((str.trim().length < min || str.trim().length > max)) {
        return 'incorrect';
    }
    return 'ok';
}

const checkContainSpecialCharacters = (str) => {
    if(/^[a-zA-Z0-9- ]*$/.test(str) == false) {
        return 'contain';
    }
    return 'not-contain';
}

const validateNumber = (str) => {
    if (/^\d+$/.test(str.toString().trim())) {
        return 'ok';
    }
    return 'incorrect';
}

const validateName = (str) => {
    if (str.trim().length < 1 || str.trim().length > 64) {
        return 'incorrect';
    }
    return 'ok';
}

const bytesToSize = (bytes) => {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

const secToHHMMSS = (seconds, format) => {
	let result = new Date(seconds * 1000).toISOString().substr(11, 8);
	if (format === "HHMMSS") return result;
	if (seconds >= 3600) return result;
	return result.slice(3);
};

const secToTime = (s) => {
    let hours = Math.floor(s / 3600);
    s %= 3600;
    let minutes = Math.floor(s / 60);
    let seconds = Math.floor(s % 60);

    return { hours, minutes, seconds };
}

const bytesToMB = (bytes) => {
    if (bytes == 0) return '0';
    return Math.round(bytes / Math.pow(1024, 2), 2);
}

const megabyteToBytes = (mb) => {
    return parseInt(mb) * 1024 * 1024;
}

const stripNonNumeric = (str) => {
    return str.replace(/\D/g,'');
}

const checkValidDate = (date) => {
    let d = new Date(date);
    if(isNaN(d.getTime())){
        return 'invalid-date';
    }
    return 'ok';
}

const commaNumber = (x) => {
	if (!x) return '0';
    let result = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if(result.length > 0) return result;
    return '0';
}


const atou = (b64) =>{
	return decodeURIComponent(escape(atob(b64)));
}

const utoa = (data) =>{
	return btoa(unescape(encodeURIComponent(data)));
}

export {
    getFirstLetterName,
    convertDateTime,
    validateEmpty,
    validateAllLowercase,
    validateEmail,
    validateLengthSpace,
    validateNumber,
    validateName,
    arrCheckAllValue,
    detectMobile,
    bytesToSize,
    bytesToMB,
    validateLength,
    stripNonNumeric,
    megabyteToBytes,
    checkContainSpecialCharacters,
    checkValidDate,
    commaNumber,
    atou,
    utoa,
    secToHHMMSS,
    secToTime
}