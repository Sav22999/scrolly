function getToday() {
    let todayDate = new Date();
    return getFormattedDate(todayDate);
}

function getFormattedDate(date) {
    let dateToUse = new Date(date);
    let dateToReturn = "";
    dateToReturn = dateToUse.getFullYear() + "-";
    let month = dateToUse.getMonth() + 1;
    if (month < 10) dateToReturn = dateToReturn + "0" + month + "-";
    else dateToReturn = dateToReturn + "" + month + "-";
    let day = dateToUse.getDate();
    if (day < 10) dateToReturn = dateToReturn + "0" + day;
    else dateToReturn = dateToReturn + "" + day;

    return dateToReturn;
}