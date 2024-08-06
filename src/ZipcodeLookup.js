import { useEffect, useState } from "react";

export default function ZipcodeLookup({rows}) {
    const [currentZip, setCurrentZip] = useState(null);
    const [currentRow, setCurrentRow] = useState();

    useEffect(() => {
        const newRow = rows.find((row) => {
            return row["Geographic Area Name"] === currentZip
        });
        setCurrentRow(newRow);
    },[currentZip])

    function ZipcodeData() {
        if (currentRow) {
            return(
                <div style={{width: "100%", display: "inline-flex", justifyContent: "space-evenly", fontSize: "22px"}}>
                    <div style={{margin: "10px", textAlign: "left"}}>
                        <b>Zipcode:</b> {currentRow["Geographic Area Name"]} <br/>
                        <b>City:</b> {currentRow.city} <br/>
                        <b>Total Population:</b> {currentRow["Total Population"]} <br/>
                        <b>Median Age:</b> {currentRow["Median Age"]} <br/>
                        <b>Median Household Income:</b> ${currentRow["Median Household Income (USD)*"]} <br/> <br/>
                        <b>Percent of Housing Units that are Occupied:</b> {currentRow["Percent of Housing Units that are Occupied"]} <br/>
                        <b>Percent of Housing Units that are Vacant:</b> {currentRow["Percent of Housing Units that are Vacant"]} <br/>
                        <b>Percent of OHU***** Occupied by Owners:</b> {currentRow["Percent of OHU***** Occupied by Owners"]} <br/>
                        <b>Percent of OHU***** Occupied by Renters:</b> {currentRow["Percent of OHU***** Occupied by Renters"]} <br/>
                    </div>
                    <div style={{margin: "10px", textAlign: "left"}}>
                        <b>Percent White:</b> {currentRow["Percent White**"]} <br/>
                        <b>Percent Black or African American:</b> {currentRow["Percent Black or African American**"]} <br/>
                        <b>Percent American Indian and Alaska Native:</b> {currentRow["Percent American Indian and Alaska Native**"]} <br/>
                        <b>Percent Asian:</b> {currentRow["Percent Asian**"]} <br/>
                        <b>Percent Native Hawaiian and Other Pacific Islander:</b> {currentRow["Percent Native Hawaiian and Other Pacific Islander**"]} <br/>
                        <b>Percent Other Race:</b> {currentRow["Percent Other Race**"]} <br/> <br/>
                        <b>Percent Hispanic or Latino (Any Race):</b> {currentRow["Percent Hispanic or Latino (Any Race)"]} <br/>
                        <b>Percent Not Hispanic or Latino:</b> {currentRow["Percent Not Hispanic or Latino"]}
                    </div>
                </div>
            )
        } else {
            return null
        }
    }

    return(
        <div>
            <select
                name="zipcode"
                value={currentZip}
                onChange={(e) => setCurrentZip(e.target.value)}
                style={{float: "left", marginTop: "10px", marginLeft: "10px", fontSize: "20px"}}
            >
                <option value={null}></option>
                {rows.map((row) => (
                <option value={row["Geographic Area Name"]}>{row["Geographic Area Name"] + " " + row["city"]}</option>
                ))}
            </select>
            <br/>
            <ZipcodeData/>
        </div>
    )
}