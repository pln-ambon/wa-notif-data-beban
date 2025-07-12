const cron = require("node-cron");
const moment = require("moment");
const {
  getAllScadaUnitMeter,
} = require("../model/scada_unit.model")
const { loadDataMessage } = require("../utils/message-builder");
const { sendMessageToWaBlas } = require("./wablas.service")
const { formatDate } = require("../utils")

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"]

// Running job every hour on minutes 00 and 30
const cronJob = cron.schedule(`0,30 * * * *`, async () => {
  try {
    const day = days[new Date().getDay()]
    const notifTime = formatDate(moment(new Date()).add(9, 'hours'))
    const data = await getAllScadaUnitMeter()

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
      if (obj.unit_id[0] === 51 && (obj.unit_subname === "150-LINE1" || obj.unit_subname === "150-LINE2")) {
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

    const message = loadDataMessage({
      powerPayload: powerData,
      currentPayload: currentData,
      day,
      notifTime
    });

    await sendMessageToWaBlas(message)

  } catch (error) {
    console.log(error, "<<< error")
  }
});

module.exports = cronJob
