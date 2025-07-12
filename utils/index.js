
function formatDate(payload) {
	if (!payload) {
		return undefined
	}
	
  let date = payload.toISOString()

  let day = `${date.split("T")[0].split("-")[2]}/${
    date.split("T")[0].split("-")[1]
  }/${date.split("T")[0].split("-")[0]}`

  let hour = `${date.split("T")[1]}`
  let newHour = `${hour.split("Z")[0]}`

  return `${day} ${newHour}`
}

function timeDuration (value){
  let x     = value
  let y     = x % 86400
  let z     = x % 3600
  let hari  = x / 86400
  let jam   = y / 3600
  let menit = z / 60
  let detik = z % 60
  
  return Math.floor(hari) + ' Hari ' + Math.floor(jam) + ' Jam ' + Math.floor(menit) + ' Menit ' + Math.floor(detik) + ' Detik';
}

function formatNumber(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return 0;
  }
  return Number.parseFloat(value).toFixed(1);
}

module.exports = {
  formatDate,
  timeDuration,
  formatNumber
}