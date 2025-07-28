const cron = require("node-cron");
const moment = require("moment");
const {
  getAllScadaUnitMeter,
  insertIntoPowerHistories,
  getPowerHistoriesByTime
} = require("../model/scada_unit.model")
const { loadDataMessage } = require("../utils/message-builder");
const { sendMessageToWaBlas } = require("./wablas.service")
const { formatDate } = require("../utils")

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"]

// Running job every hour
const cronJob = cron.schedule(`0 * * * *`, async () => {
  try {
    const day = days[new Date().getDay()]
    const notifTime = formatDate(moment(new Date()).add(9, 'hours'))
    const data = await getAllScadaUnitMeter()

    const now = new Date();
    const hour = now.getHours();
    const isEvenHour = hour % 2 === 0;
    const isSpecialHour = hour == 19;

    console.log(`Current hour: ${hour}, isEvenHour: ${isEvenHour}, isSpecialHour: ${isSpecialHour}`);

    const grandTotal = {
      p: 0,
      p_dmp_netto: 0,
      p_dmp_pasok: 0,
      vAverage: 0,
      vLength: 0,
      vTotal: 0
    }

    // Get data power
    const powerData = data.reduce((acc, obj) => {
      const key = obj.unit_name;
      if (!acc[key]) {
        acc[key] = {
          total: {
            p_dmp_netto: 0,
            p_dmp_pasok: 0,
            p: 0,
            vTotal: 0,
            vLength: 0,
            vAverage: 0,
          },
          detail: []
        }
      }
    
      // total
      acc[key].total.p_dmp_netto += obj.p_dmp_netto / 1000 // MW
      acc[key].total.p_dmp_pasok += obj.p_dmp_pasok / 1000
      acc[key].total.p += obj.p / 1000
      acc[key].total.vTotal += obj.v // KV
      if (obj.v) {
        acc[key].total.vLength += 1
      }
      acc[key].total.vAverage = acc[key].total.vTotal / acc[key].total.vLength
    
      // detail
      acc[key].detail.push({
        unit_subname: obj.unit_subname,
        p_dmp_netto: obj.p_dmp_netto / 1000,
        p_dmp_pasok: obj.p_dmp_pasok / 1000,
        p: obj.p / 1000,
        v: obj.v
      })

      // grandTotal
      if (obj.unit_id[0] === 11 || obj.unit_id[0] === 12 || obj.unit_id[0] === 13 || obj.unit_id[0] === 14) {
        grandTotal.p += obj.p / 1000
        grandTotal.p_dmp_netto += obj.p_dmp_netto / 1000
        grandTotal.p_dmp_pasok += obj.p_dmp_pasok / 1000
        grandTotal.vTotal += obj.v
        if (obj.v) {
          grandTotal.vLength += 1
        }
      }
    
      return acc;
    }, {});

    // Get data current
    let time

    const currentData = data.reduce((acc, obj) => {
      const key = obj.unit_name;
      if (!acc[key]) {
        acc[key] = {
          pTotal: 0,
          vTotal: 0,
          vLength: 0,
          vAverage: 0,
          fTotal: 0,
          fAverage: 0,
          current1: 0,
          current2: 0,
          current3: 0, // GIS PASSO - SIRIMAU 1
          current4: 0, // GIS PASSO - SIRIMAU 2
        }
      }
      // set time 
      if (!time) {
        time = obj.time
      }

      if (obj.unit_id[0] === 11 || obj.unit_id[0] === 12 || obj.unit_id[0] === 13 || obj.unit_id[0] === 14) {
        acc[key].pTotal += obj.p / 1000 // MW
        if (obj.v) {
          acc[key].vTotal += obj.v
          acc[key].fTotal += obj.f
          acc[key].vLength += 1
        }
        acc[key].vAverage = acc[key].vTotal / acc[key].vLength
        acc[key].fAverage = acc[key].fTotal / acc[key].vLength
      }

      // GI WAAI
      if (obj.unit_id[0] === 51 && (obj.unit_subname === "150-LINE1" || obj.unit_subname === "150-LINE2" || obj.unit_subname === "150-BMPP")) {
        acc[key].pTotal += obj.p / 1000 // MW
        if (obj.v) {
          acc[key].vTotal += obj.v
          acc[key].fTotal += obj.f
          acc[key].vLength += 1
        }

        if (obj.unit_subname === "150-LINE1") {
          acc[key].current1 += obj.i
        }

        if (obj.unit_subname === "150-LINE2") {
          acc[key].current2 += obj.i
        }

        if (obj.unit_subname === "150-BMPP") {
          acc[key].current3 += obj.i
        }

        acc[key].vAverage = acc[key].vTotal / acc[key].vLength
        acc[key].fAverage = acc[key].fTotal / acc[key].vLength
      }

      // GI HATIVE BESAR
      if (obj.unit_id[0] === 55 && (obj.unit_subname === "150-TRAFO1" || obj.unit_subname === "150-TRAFO2")) {
        acc[key].pTotal += obj.p / 1000 // MW
        if (obj.v) {
          acc[key].vTotal += obj.v
          acc[key].fTotal += obj.f
          acc[key].vLength += 1
        }
        acc[key].vAverage = acc[key].vTotal / acc[key].vLength
        acc[key].fAverage = acc[key].fTotal / acc[key].vLength
      }


      // GI SIRIMAU
      if (obj.unit_id[0] === 54 && (obj.unit_subname === "150-TRAFO1" || obj.unit_subname === "150-TRAFO2")) {
        acc[key].pTotal += obj.p / 1000 // MW
        if (obj.v) {
          acc[key].vTotal += obj.v
          acc[key].fTotal += obj.f
          acc[key].vLength += 1
        }
        acc[key].vAverage = acc[key].vTotal / acc[key].vLength
        acc[key].fAverage = acc[key].fTotal / acc[key].vLength
      }
    

      // GIS PASSO
      if (obj.unit_id[0] === 53 && (obj.unit_subname === "150-TRAFO1" || obj.unit_subname === "150-TRAFO2")) {
        acc[key].pTotal += obj.p / 1000 // MW
        if (obj.v) {
          acc[key].vTotal += obj.v
          acc[key].fTotal += obj.f
          acc[key].vLength += 1
        }

        acc[key].vAverage = acc[key].vTotal / acc[key].vLength
        acc[key].fAverage = acc[key].fTotal / acc[key].vLength
      }

      if (obj.unit_id[0] === 53 && obj.unit_subname === "150-WAYAME1") {
        acc[key].current1 += obj.i
      }

      if (obj.unit_id[0] === 53 && obj.unit_subname === "150-WAYAME2") {
        acc[key].current2 += obj.i
      }

      if (obj.unit_id[0] === 53 && obj.unit_subname === "150-SIRIMAU1") {
        acc[key].current3 += obj.i
      }

      if (obj.unit_id[0] === 53 && obj.unit_subname === "150-SIRIMAU2") {
        acc[key].current4 += obj.i
      }
    
      return acc;
    }, {});

    powerData.grandTotal = grandTotal

    // insert data to histories
    const {
      "BMPP WAAI": bmppWaai,
      "PLTMG WAAI": pltmgWaai,
      "PLTD POKA": pltdPoka,
      "PLTD HATIVE KECIL": pltdHativeKecil,
    } = powerData

    const dataInsert = [
      {
        unit_id: 11,
        p: pltmgWaai?.total?.p ? pltmgWaai?.total?.p * 1000 : 0,
      },
      {
        unit_id: 12,
        p: bmppWaai?.total?.p ? bmppWaai?.total?.p * 1000 : 0,
      },
      {
        unit_id: 13,
        p: pltdPoka?.total?.p ? pltdPoka?.total?.p * 1000 : 0,
      },
      {
        unit_id: 14,
        p: pltdHativeKecil?.total?.p ? pltdHativeKecil?.total?.p * 1000 : 0,
      }
    ]

    await insertIntoPowerHistories({ payload: dataInsert })

    // send message to wablas only even hour or special hour (19:00)
    if (isEvenHour || isSpecialHour) {
      // getdata power histories 2 hours ago
      const totalPower2HoursAgo = await getTotalPowerHistories2HoursAgo();

      // getdata power histories 24 hours ago
      const totalPower24HoursAgo = await getTotalPowerHistories24HoursAgo();

      const deviation = {
        deviation2Hours: grandTotal.p - totalPower2HoursAgo,
        deviation24Hours: grandTotal.p - totalPower24HoursAgo
      }
      
      const message = loadDataMessage({
        powerPayload: powerData,
        currentPayload: currentData,
        day,
        notifTime,
        deviation
      });
  
      await sendMessageToWaBlas(message)
    }

  } catch (error) {
    console.log(error, "<<< error")
  }
});

async function getTotalPowerHistories2HoursAgo() {
  // Karena beda timezone 9 jam (UTC+9)
  // Now  + 9 jam - 2 jam = +7 jam
  const targetMoment = moment().add(7, 'hours').seconds(0).milliseconds(0); 
  const startTime = targetMoment.clone().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
  const endTime = targetMoment.clone().add(1, 'minute').format('YYYY-MM-DD HH:mm:59.999');

  console.log(`Start Time 2 Hours ago: ${startTime}, End Time: ${endTime}`);

  const data = await getPowerHistoriesByTime({ startTime, endTime });

  // console.log(`Total data 2 Hours ago: ${data} records`);
  
  if (!data || data?.length === 0) {
    return 0; // No data found, return 0
  }

  const total = data.reduce((acc, item) => {
    acc.p += item.p;
    return acc;
  }, { p: 0 });

  return total?.p ? total.p / 1000 : 0;  // convert to MW

}

async function getTotalPowerHistories24HoursAgo() {
  // Karena beda timezone 9 jam (UTC+9)
  // Now  + 9 jam - 24 jam = -15 jam
  const targetMoment = moment().subtract(15, 'hours').seconds(0).milliseconds(0);
  const startTime = targetMoment.clone().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
  const endTime = targetMoment.clone().add(1, 'minute').format('YYYY-MM-DD HH:mm:59.999');

  console.log(`Start Time 24 Hours ago: ${startTime}, End Time: ${endTime}`);

  const data = await getPowerHistoriesByTime({ startTime, endTime });

  // console.log(`Total data 24 Hours ago: ${data} records`);

  if (!data || data?.length === 0) {
    return 0; // No data found, return 0
  }

  const total = data.reduce((acc, item) => {
    acc.p += item.p;
    return acc;
  }, { p: 0 });

  return total?.p ? total.p / 1000 : 0;  // convert to MW

}

module.exports = cronJob
