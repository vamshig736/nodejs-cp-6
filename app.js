const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running http//localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();

const convertStateTableObjectsToCamelCase = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT * FROM state`;
  const stateList = await db.all(getStateQuery);
  response.send(
    stateList.map((eachState) => convertStateTableObjectsToCamelCase(eachState))
  );
});

//Returns a state based on the state ID
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id=${stateId}`;
  const stateList = await db.get(getStateQuery);
  response.send(convertStateTableObjectsToCamelCase(stateList));
});
//convert district table to camel case
const convertDistrictTableObjectsToCamelCase = (dbObject) => {
  return {
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
    districtId: dbObject.district_id,
  };
};

//creating District table
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtDetailsQuery = `
    INSERT INTO district
    (district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
    )`;
  const dbResponse = await db.run(districtDetailsQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id=${districtId}`;
  const districtList = await db.get(getDistrictQuery);
  response.send(convertDistrictTableObjectsToCamelCase(districtList));
});

//district removed api as per district id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId}`;
  const districtList = await db.get(getDistrictQuery);
  response.send("District Removed");
});

//
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const getDistrictQuery = `
  UPDATE district
  SET
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE district_id=${districtId}`;
  await db.run(getDistrictQuery);
  response.send("District Details Updated");
});

///
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatesQuery = `
    SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM 
    district
    WHERE state_id=${stateId}`;
  const state = await db.get(getStateStatesQuery);
  response.send(state);
});

//
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictNameQuery = `
SELECT
state_name as stateName 
FROM
district INNER JOIN state ON district.state_id=state.state_id
WHERE
district_id=${districtId}`;
  const stateName = await db.get(getDistrictNameQuery);
  response.send(stateName);
});

module.exports = app;
