const sql = require('mssql');
const { sqlConfig } =require("../config")

async function getAllScadaUnitMeter() {
  const pool = await sql.connect(sqlConfig);
  const result = await pool.request()
    .query(`
    SELECT A.*,
      B.*
    FROM SCADA_UNIT A
      OUTER APPLY (
        SELECT *
        FROM (
            SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY unit_subname
                ORDER BY id DESC
              ) AS row_num
            FROM SCADA_METER_2 B
            WHERE B.unit_id = A.unit_id
          ) AS C
        WHERE C.row_num = 1
      ) AS B;
    `);

  return result.recordset;
}


module.exports = {
  getAllScadaUnitMeter,
}
