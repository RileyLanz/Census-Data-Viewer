import "./App.css";
import "react-data-grid/lib/styles.css";
import { useEffect, useState, useRef } from "react";
import AllRowsTable from "./AllRowsTable";
import ZipcodeLookup from "./ZipcodeLookup";
import { webR, categoryNames, allRows, tidyRows } from "./App.js";

async function getAPlot(x, y, labelO, listO) {
  const shelter = await new webR.Shelter();
  const capture = await shelter.captureR(
    `is_outlier <- function(x) {
      return(x < quantile(x, 0.25, na.rm = T) - 2 * IQR(x, na.rm = T) | x > quantile(x, 0.75, na.rm = T) + 2 * IQR(x, na.rm = T) | is.na(x))
    }
    dfToUse <- data.frame(x = selectData$\`${x}\`, y = selectData$\`${y}\`, pop = selectData$\`Total Population\`, city = selectData$city)
    
    dfToUse$zipcode <- ifelse((is_outlier(dfToUse$x) | is_outlier(dfToUse$y)) & ${labelO || listO}, str_sub(selectData$\`Geographic Area Name\`, start = -5), as.numeric(NA))
    outlierTable <- dfToUse[!is.na(dfToUse$zipcode),]
    if (!${labelO}) {dfToUse$zipcode <- as.numeric(NA)}

    corrs <- cor.test(dfToUse$x, dfToUse$y)

    myPlot <- ggplot(dfToUse, mapping = aes(x = x, y = y, label = zipcode)) +
      geom_point() +
      geom_label_repel(alpha = 0.7, max.overlaps = 1000, min.segment.length	= 0) +
      scale_x_continuous(name = "${x}") +
      scale_y_continuous(name = "${y}") +
      ggtitle(paste("Correlation: ", round(corrs$estimate, 3), ", P-Value: ", signif(corrs$p.value, 3), sep = ""))
    print(myPlot)
    
    rowStrings <- c()
    for(r in 1:(nrow(outlierTable))) {
      tempList <- as.list(outlierTable[r,])
      tempStrings <- paste(names(tempList), unlist(tempList), sep = ": ")
      tempString <- paste(tempStrings, collapse = ", ")
      rowStrings <- c(rowStrings, tempString)
    }`,
    {
      captureGraphics: {
        width: 600,
        height: 300,
      },
    },
  );
  return capture;
}

async function getOutlierData() {
  const result = await webR.evalRRaw("print(rowStrings)", "string[]");
  return result;
}

export default function MainPage({ setSelectedState }) {
  const [xAxis, setXAxis] = useState();
  const [yAxis, setYAxis] = useState();
  const [labelOutliers, setLabelOutliers] = useState(false);
  const [listOutliers, setListOutliers] = useState(false);
  const [showOutlierTable, setShowOutlierTable] = useState(false);
  const [picture, setPicture] = useState();
  const [outliers, setOutliers] = useState();
  const [loading, setLoading] = useState(false);
  const [xColName, setXColName] = useState(null);
  const [yColName, setYColName] = useState(null);
  const inputRef = useRef(null);

  const tidiedRows = tidyRows(allRows);

  function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
  }

  useEffect(() => {
    // Open "Plot" tab when page loads
    inputRef.current?.click();
  }, []);

  function getResults() {
    var xName = xAxis;
    var yName = yAxis;
    setLoading(true);
    getAPlot(xAxis, yAxis, labelOutliers, listOutliers).then((r) => {
      setPicture(r.images);
      setXColName(xName);
      setYColName(yName);
      if (listOutliers) {
        getOutlierData().then((res) => {
          var outs = tidyRows(res);
          setOutliers(outs);
          setShowOutlierTable(true);
        });
      } else {
        setShowOutlierTable(false);
      }
      setLoading(false);
    });
  }

  function OutlierTable() {
    if (showOutlierTable) {
      return (
        <table style={{ borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ backgroundColor: "lightblue", color: "black" }}>
              <th scope="col">Zipcode</th>
              <th scope="col">City</th>
              <th scope="col">{xColName}</th>
              <th scope="col">{yColName}</th>
              <th scope="col">Total Population</th>
            </tr>
            {outliers.map((row) => (
              <tr>
                <th
                  scope="row"
                  style={{ color: "black", backgroundColor: "#c9f2ff" }}
                >
                  {row.zipcode}
                </th>
                <td>{row.city}</td>
                <td>{row.x}</td>
                <td>{row.y}</td>
                <td>{row.pop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else {
      return null;
    }
  }

  useEffect(() => {
    if (picture) {
      document
        .getElementById("plot-canvas")
        .getContext("2d")
        .drawImage(picture[0], 0, 0, 900, 450);
    }
  }, [picture]);

  return (
    <>
      <p>
        Let's make a graph!
        <br />
        <label>
          Select an x-axis variable:&nbsp;
          <select
            name="xAxis"
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
          >
            <option value={null}></option>
            {categoryNames.slice(2).map((name) => (
              <option value={name}>{name}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Select a y-axis variable:&nbsp;
          <select
            name="yAxis"
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
          >
            <option value={null}></option>
            {categoryNames.slice(2).map((name) => (
              <option value={name}>{name}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={labelOutliers}
            onChange={(e) => setLabelOutliers(e.target.checked)}
          />
          Label outliers
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={listOutliers}
            onChange={(e) => setListOutliers(e.target.checked)}
          />
          List outliers
        </label>
        <br />
        <button onClick={getResults} disabled={loading || !xAxis || !yAxis}>
          {loading
            ? "Loading..."
            : xAxis && yAxis
              ? "Get a plot!"
              : "Select variables"}
        </button>
      </p>
      <p style={{ width: "80%" }}>
        <div className="tab">
          <button
            className="tablinks"
            onClick={(e) => openTab(e, "Plot")}
            ref={inputRef}
          >
            Plot
          </button>
          <button className="tablinks" onClick={(e) => openTab(e, "Table")}>
            Table
          </button>
          <button className="tablinks" onClick={(e) => openTab(e, "Lookup")}>
            Zipcode Lookup
          </button>
          <button className="tablinks" onClick={(e) => openTab(e, "Notes")}>
            Notes and Credits
          </button>
          <button onClick={() => setSelectedState(null)} style={{backgroundColor: "#f44336", color: "white", border: "none", float: "right"}}>
            Select a New State
        </button>
        </div>
        <div
          id="Plot"
          className="tabcontent"
          style={{ height: picture ? "460px" : "30px" }}
        >
          {picture ? (
            <canvas
              id="plot-canvas"
              width="900"
              height="450"
              style={{ border: "solid white" }}
            />
          ) : (
            "Get a plot first"
          )}
        </div>
        <div
          id="Table"
          className="tabcontent"
          style={{ height: xColName && yColName ? "460px" : "30px" }}
        >
          <AllRowsTable
            rows={tidiedRows}
            xColName={xColName}
            yColName={yColName}
          />
        </div>
        <div
          id="Lookup"
          className="tabcontent"
          style={{ height: "460px"}}
        >
          <ZipcodeLookup
            rows={tidiedRows}
          />
        </div>
        <div
          id="Notes"
          className="tabcontent"
          style={{ height: "460px", fontSize: "medium", textAlign: "left" }}
        >
          Variable footnotes:
          <br />
          *Median income above $250,000 displayed as $250,001
          <br />
          **Alone or in combination with one or more other races
          <br />
          ***Not spouse, partner, child, or grandchild
          <br />
          ****Parent/father/mother indicates living with own children under 18
          <br />
          *****Occupied Housing Units
          <br />
          <br />
          All data taken from US Census Bureau (
          <a href="https://data.census.gov/table" target="_blank">
            data.census.gov/table
          </a>
          ).
          <br />
          Matching of ZCTA5 (zip codes) to city names acquired from{" "}
          <a href="https://simplemaps.com/data/us-zips" target="_blank">
            simplemaps.com/data/us-zips
          </a>
          .
        </div>
      </p>
      <br />
      <OutlierTable />
    </>
  );
}
