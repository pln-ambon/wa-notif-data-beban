const { WA_GROUP_ID, WA_PRIVATE_ID } = require('../config')
const { formatNumber } = require("./index")

function loadDataMessage({day, notifTime, powerPayload, currentPayload }) {

  const {
    "PLTD HATIVE KECIL": pltdHativeKecil,
    "PLTMG WAAI": pltmgWaai,
    "BMPP WAAI": bmppWaai,
    "GI WAAI": giWaai,
    "PLTD POKA": pltdPoka,
    "GI SIRIMAU": giSirimau,
    "GI HATIVE BESAR": giHativeBesar,
    "GIS PASSO": gisPasso,
  } = powerPayload

  const {
    "GI WAAI": giWaaiCurrent,
    "GIS PASSO": gisPassoCurrent,
  } = currentPayload

  const content = `  
    *Data Beban - Sistem Ambon*
    ========================
    *${day} ${notifTime}*
    ========================
    *BMPP WAAI     ➤ ${formatNumber(bmppWaai?.total?.p)} MW*
    GEN1           : ${formatNumber(bmppWaai?.detail[0]?.p)} MW
    GEN2           : ${formatNumber(bmppWaai?.detail[1]?.p)} MW
    GEN3           : ${formatNumber(bmppWaai?.detail[2]?.p)} MW
    GEN4           : ${formatNumber(bmppWaai?.detail[3]?.p)} MW
    GEN5           : ${formatNumber(bmppWaai?.detail[4]?.p)} MW
    GEN6           : ${formatNumber(bmppWaai?.detail[5]?.p)} MW
    ----------------------------------
    *PLTMG PEAKER  ➤ ${formatNumber(pltmgWaai?.total?.p)} MW*
    GEN1           : ${formatNumber(pltmgWaai?.detail[0]?.p)} MW
    GEN2           : ${formatNumber(pltmgWaai?.detail[1]?.p)} MW
    GEN3           : ${formatNumber(pltmgWaai?.detail[2]?.p)} MW
    GEN4           : ${formatNumber(pltmgWaai?.detail[3]?.p)} MW
    ----------------------------------
    *PLTD POKA     ➤ ${formatNumber(pltdPoka?.total?.p)} MW*
    BLOK-PLN POKA  : ${formatNumber(pltdPoka?.detail[3]?.p)} MW
    ----------------------------------
    *PLTD HATIVE KECIL  ➤ ${formatNumber(pltdHativeKecil?.total?.p)} MW*
    HATIVE-1       : ${formatNumber(pltdHativeKecil?.detail[0]?.p)} MW
    HATIVE-3       : ${formatNumber(pltdHativeKecil?.detail[1]?.p)} MW
    ========================
    *GI WAAI       ➤ ${formatNumber(giWaai?.total?.p)} MW*
    TRAFO-1        : ${formatNumber(giWaai?.detail[4]?.p)} MW
    TRAFO-2        : ${formatNumber(giWaai?.detail[5]?.p)} MW
    LINE-PASSO#1   : ${formatNumber(giWaaiCurrent?.current1)} A
    LINE-PASSO#2   : ${formatNumber(giWaaiCurrent?.current2)} A
    ----------------------------------
    *GIS PASSO     ➤ ${formatNumber(gisPasso?.total?.p)} MW*
    TRAFO-1        : ${formatNumber(gisPasso?.detail[4]?.p)} MW
    TRAFO-2        : ${formatNumber(gisPasso?.detail[5]?.p)} MW
    LINE-SIRIMAU#1 : ${formatNumber(gisPassoCurrent?.current3)} A
    LINE-SIRIMAU#2 : ${formatNumber(gisPassoCurrent?.current4)} A
    LINE-WAYAME#1  : ${formatNumber(gisPassoCurrent?.current1)} A
    LINE-WAYAME#2  : ${formatNumber(gisPassoCurrent?.current2)} A
    ----------------------------------
    *GI SIRIMAU    ➤ ${formatNumber(giSirimau?.total?.p)} MW*
    TRAFO-1        : ${formatNumber(giSirimau?.detail[2]?.p)} MW
    TRAFO-2        : ${formatNumber(giSirimau?.detail[3]?.p)} MW
    ----------------------------------
    *GI HATIVE BESAR  ➤ ${formatNumber(giHativeBesar?.total?.p)} MW*
    TRAFO-1        : ${formatNumber(giHativeBesar?.detail[2]?.p)} MW
    TRAFO-2        : ${formatNumber(giHativeBesar?.detail[3]?.p)} MW
    `
  const message = {
    "phone": WA_PRIVATE_ID,
    "message": content,
    "isGroup": false
  }

  return message
}

function dateEventMessage({day, notifTime, payload }) {

  const {
    id,
    substation,
    point,
    elemen,
    controlString,
    controlBy,
    result,
    failreason,
    controlTime
  } = payload

  const controlStatus = "-";
  if (typeof controlString === "string") {
    if (controlString.includes("(1)")) {
      controlStatus = "On";
    } else if (controlString.includes("(0)")) {
      controlStatus = "Off";
    } else {
      controlStatus = controlString;
    }
  }

  const formattedControlTime = controlTime
    ? moment(controlTime).locale('id').format('dddd, DD/MM/YYYY HH:mm:ss')
    : "-";

  const content = `
    *Data Event Control - Sistem Ambon*
    ========================
    *${day} ${notifTime}*
    ========================
    Id             : ${id}
    Site           : ${substation}
    Unit           : ${point}; ${elemen}
    Control        : ${controlStatus}
    Result         : ${result}
    Reason         : ${failreason || "-"}
    Control By     : ${controlBy}
    Control Time   : ${formattedControlTime}
    `
  const message = {
    "phone": WA_PRIVATE_ID,
    "message": content,
    "isGroup": false
  }

  return message
}



module.exports = {
  loadDataMessage,
  dateEventMessage
}