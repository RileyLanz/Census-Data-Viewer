import './App.css';
import 'react-data-grid/lib/styles.css';
import { WebR } from 'webr';
import { useEffect, useState, useRef } from 'react';
import AllRowsTable from './AllRowsTable';

const webR = new WebR({repoUrl: "https://repo.r-wasm.org/"});
await webR.init();
await webR.installPackages(["ggplot2", "knitr", "ggrepel", "stringr", "dplyr"])
const categoryNames = await webR.evalRRaw(
  `library(ggplot2)
  library(knitr)
  library(stringr)
  library(ggrepel)
  library(dplyr)
  false <- F
  true <- T

  dataCT <- read.csv("${window.location.href}/ct_data.csv")
  names(dataCT) <- lapply(dataCT[1,], as.character)
  dataCT <- dataCT[-1,]
  dataCT[,3:323] <- sapply(dataCT[,3:323], as.numeric)
  dataCT$\`Geographic Area Name\` <- substring(dataCT$\`Geographic Area Name\`, 7, 11)

  medianIncomeCT <- read.csv("${window.location.href}/ct_median_income.csv")
  names(medianIncomeCT) <- substring(names(medianIncomeCT), 7, 11)
  medianIncomeCT <- medianIncomeCT[,-1]
  medianIncomeCT <- data.frame(names(medianIncomeCT), as.character(medianIncomeCT[1,]))
  medianIncomeCT[,2] <- gsub(",", "", medianIncomeCT[,2])
  medianIncomeCT[,2][medianIncomeCT$\`as.character.medianIncomeCT.1....\` == "250000+"] <- "250001"
  medianIncomeCT[,2][medianIncomeCT$as.character.medianIncomeCT.1.... == "-"] <- NA
  medianIncomeCT[,2] <- as.numeric(medianIncomeCT[,2])

  dataCT <- inner_join(dataCT, medianIncomeCT, by = join_by(\`Geographic Area Name\` == names.medianIncomeCT.))

  zipTable <- read.csv("${window.location.href}/uszips.csv")
  catNames <- read.csv("${window.location.href}/category_names.csv")
  selectDataCT <- dataCT[,c(1,2,3,75,183,186,248:253,255,256,276:278,285,286,295:299,302,303,306:308,310,311,321,322,324)]
  names(selectDataCT) <- catNames[,1]
  selectDataCT <- selectDataCT[,c(1:4,34,5:33)]
  print(names(selectDataCT))`,
'string[]'
)

async function getAPlot(x,y,labelO,listO) {
  const shelter = await new webR.Shelter();
  const capture = await shelter.captureR(
    `is_outlier <- function(x) {
      return(x < quantile(x, 0.25, na.rm = T) - 2 * IQR(x, na.rm = T) | x > quantile(x, 0.75, na.rm = T) + 2 * IQR(x, na.rm = T))
    }
    dfToUse <- data.frame(x = selectDataCT$\`${x}\`, y = selectDataCT$\`${y}\`, pop = selectDataCT$\`Total Population\`)
    
    dfToUse$zipcode <- ifelse((is_outlier(dfToUse$x) | is_outlier(dfToUse$y)) & ${labelO || listO}, str_sub(selectDataCT$\`Geographic Area Name\`, start = -5), as.numeric(NA))
    outlierTable <- dfToUse[!is.na(dfToUse$zipcode),]
    if (!${labelO}) {dfToUse$zipcode <- as.numeric(NA)}

    myPlot <- ggplot(dfToUse, mapping = aes(x = x, y = y, label = zipcode)) +
      geom_point() +
      geom_label_repel(alpha = 0.7, max.overlaps = 1000, min.segment.length	= 0) +
      scale_x_continuous(name = "${x}") +
      scale_y_continuous(name = "${y}")
    print(myPlot)
    
    if (nrow(outlierTable) > 0) {
      outlierTable$city <- NA
      for (z in outlierTable$zipcode) {
        outlierTable[outlierTable$zipcode == z,]$city <- zipTable[zipTable$zip == as.integer(z),]$city
      }
    }
    
    rowStrings <- c()
    for(r in 1:(nrow(outlierTable))) {
      tempList <- as.list(outlierTable[r,])
      tempStrings <- paste(names(tempList), unlist(tempList), sep = ": ")
      tempString <- paste(tempStrings, collapse = ", ")
      rowStrings <- c(rowStrings, tempString)
    }

    dfToUse$zipcode <- str_sub(selectDataCT$\`Geographic Area Name\`, start = -5)
    dfToUse$city <- NA
    for (z in dfToUse$zipcode) {
      dfToUse[dfToUse$zipcode == z,]$city <- zipTable[zipTable$zip == as.integer(z),]$city
    }
    
    allRowStrings <- c()
    for(r in 1:(nrow(dfToUse))) {
      tempList <- as.list(dfToUse[r,])
      tempStrings <- paste(names(tempList), unlist(tempList), sep = ": ")
      tempString <- paste(tempStrings, collapse = ", ")
      allRowStrings <- c(allRowStrings, tempString)
    }`, {
    captureGraphics: {
      width: 600,
      height: 300
    }
});
  return(capture)
}

async function getOutlierData() {
  const result = await webR.evalRRaw(
    'print(rowStrings)',
    'string[]'
  );
  return(result)
}

async function getAllRows() {
  const result = await webR.evalRRaw(
    `print(allRowStrings)`,
    'string[]'
  );
  return(result)
}

function App() {
  const [xAxis, setXAxis] = useState()
  const [yAxis, setYAxis] = useState()
  const [labelOutliers, setLabelOutliers] = useState(false)
  const [listOutliers, setListOutliers] = useState(false)
  const [showOutlierTable, setShowOutlierTable] = useState(false)
  const [picture, setPicture] = useState()
  const [outliers, setOutliers] = useState()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [xColName, setXColName] = useState(null)
  const [yColName, setYColName] = useState(null)
  const inputRef = useRef(null);

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
    inputRef.current?.click()
  },[])

  function getResults() {
    var xName = xAxis
    var yName = yAxis
    setLoading(true);
    getAPlot(xAxis, yAxis, labelOutliers, listOutliers).then(r => {
      setPicture(r.images);
      setXColName(xName);
      setYColName(yName);
      if (listOutliers) {
        getOutlierData().then(res => {
          var outs = tidyRows(res);
          setOutliers(outs);
          setShowOutlierTable(true)
        })
      } else {
        setShowOutlierTable(false)
      };
      getAllRows().then(r => {
        var theRows = tidyRows(r);
        setRows(theRows);
      });
      setLoading(false)
    });
  }

  function tidyRows(r) {
    var tidied = r.map(str => {
      var parsed = {}
      var pairs = str.split(", ")
      for (var i = 0, l = pairs.length, keyVal; i < l; i++) {
        keyVal = pairs[i].split(": ");
        if (keyVal[0]) {
          parsed[keyVal[0]] = keyVal[1];
      }
      }
      return(parsed)
    })
    return(tidied)
  }

  function OutlierTable() {
    if (showOutlierTable) {
      return (
        <table style={{borderCollapse: "collapse"}}>
          <tbody>
            <tr style={{backgroundColor: "lightblue", color: "black"}}>
              <th scope="col">Zipcode</th>
              <th scope="col">City</th>
              <th scope="col">{xColName}</th>
              <th scope="col">{yColName}</th>
              <th scope="col">Total Population</th>
            </tr>
            {outliers.map(row =>
              <tr>
                <th scope="row" style={{color: "black", backgroundColor: "#c9f2ff"}}>
                  {row.zipcode}
                </th>
                <td>{row.city}</td>
                <td>{row.x}</td>
                <td>{row.y}</td>
                <td>{row.pop}</td>
              </tr>
            )}
          </tbody>
        </table>
      )
    } else {
      return null
    }
  }

  useEffect(() => {
    if (picture) {
      
      document.getElementById("plot-canvas").getContext("2d").drawImage(picture[0], 0, 0, 900, 450)
    }
  }, [picture])

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Let's make a graph! 
          <br/>
            <label>
              Select an x-axis variable:&nbsp;
              <select name="xAxis" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                <option value={null}></option>
                {categoryNames.slice(2).map(name => <option value={name}>{name}</option>)}
              </select>
            </label>
          <br/>
            <label>
              Select a y-axis variable:&nbsp;
              <select name="yAxis" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                <option value={null}></option>
                {categoryNames.slice(2).map(name => <option value={name}>{name}</option>)}
              </select>
            </label>
          <br/>
            <label>
              <input type="checkbox" checked={labelOutliers} onChange={e => setLabelOutliers(e.target.checked)}/>
              Label outliers
            </label>
          <br/>
            <label>
              <input type="checkbox" checked={listOutliers} onChange={e => setListOutliers(e.target.checked)}/>
              List outliers
            </label>
          <br/>
          <button onClick={getResults} disabled={loading || !xAxis || !yAxis}>
            {loading ? "Loading..." : (xAxis && yAxis ? "Get a plot!" : "Select variables")}
          </button>
        </p>
        <p style={{width: "80%"}}>
          <div className="tab">
            <button className="tablinks" onClick={e => openTab(e, 'Plot')} ref={inputRef}>Plot</button>
            <button className="tablinks" onClick={e => openTab(e, 'Table')}>All Zipcodes</button>
            <button className="tablinks" onClick={e => openTab(e, 'Notes')}>Notes and Credits</button>
          </div>
          <div id="Plot" className="tabcontent" height={picture ? "460px" : "30px"}>
            {picture ? <canvas id="plot-canvas" width="900" height="450" style={{border: "solid white"}}/> : "Get a plot first"}
          </div>
          <div id="Table" className="tabcontent" height={xColName && yColName ? "460px" : "30px"}>
            <AllRowsTable
              rows={rows}
              xColName={xColName}
              yColName={yColName}
            />
          </div>
          <div id="Notes" className="tabcontent" height="460px" style={{fontSize: "medium", textAlign: "left"}}>
            Variable footnotes:<br/>
            *Median income above $250,000 displayed as $250,001<br/>
            **Alone or in combination with one or more other races<br/>
            ***Not spouse, partner, child, or grandchild<br/>
            ****Parent/father/mother indicates living with own children under 18<br/>
            *****Occupied Housing Units<br/><br/>
            All data taken from US Census Bureau (<a href="https://data.census.gov/table" target='_blank'>data.census.gov/table</a>).<br/>
            Matching of ZCTA5 (zip codes) to city names acquired from <a href="https://simplemaps.com/data/us-zips" target='_blank'>simplemaps.com/data/us-zips</a>.
          </div>
        </p>
        <br/>
        <OutlierTable/>
      </header>
    </div>
  );
}

export default App;