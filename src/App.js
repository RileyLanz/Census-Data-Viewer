import logo from './logo.svg';
import './App.css';
import { WebR } from 'webr';
import { useEffect, useState } from 'react';

const webR = new WebR({repoUrl: "https://repo.r-wasm.org/"});
await webR.init();
await webR.installPackages(["ggplot2", "knitr", "ggrepel", "stringr"])
const categoryNames = await webR.evalRRaw(
  `library(ggplot2)
  library(knitr)
  library(stringr)
  library(ggrepel)
  false <- F
  true <- T
  dataCT <- read.csv("${window.location.href}/ct_data.csv")
  names(dataCT) <- lapply(dataCT[1,], as.character)
  dataCT <- dataCT[-1,]
  dataCT[,3:323] <- sapply(dataCT[,3:323], as.numeric)
  selectDataCT <- dataCT[,c(1,2,3,183,186,207,210,231,234,75:77,248:253,255,256,275:290,295:308,310:317,321,322)]
  print(names(selectDataCT))`,
'string[]'
)

async function getAPlot(x,y,labelO,listO) {
  const shelter = await new webR.Shelter();
  const capture = await shelter.captureR(
    `is_outlier <- function(x) {
      return(x < quantile(x, 0.25, na.rm = T) - 2 * IQR(x, na.rm = T) | x > quantile(x, 0.75, na.rm = T) + 2 * IQR(x, na.rm = T))
    }
    
    dfToUse <- data.frame(x = selectDataCT$\`${x}\`, y = selectDataCT$\`${y}\`)
    model <- lm(dfToUse$x~dfToUse$y, na.action = "na.exclude")

    fits <- model$fitted.values
    indices <- 1:(nrow(dfToUse))
    indices <- indices[!indices %in% names(fits)]
    fits[as.character(indices)] <- NA
    fits <- fits[order(as.numeric(names(fits)))]
    rezzies <- dfToUse$y - fits
    
    dfToUse$zipcode <- ifelse((is_outlier(abs(rezzies)) | is.na(rezzies)) & ${labelO || listO}, str_sub(selectDataCT$\`Geographic Area Name\`, start = -5), as.numeric(NA))
    outlierTable <- dfToUse[!is.na(dfToUse$zipcode),]
    if (!${labelO}) {dfToUse$zipcode <- as.numeric(NA)}

    myPlot <- ggplot(dfToUse, mapping = aes(x = x, y = y, label = zipcode)) +
      geom_smooth(method = "glm", se = FALSE) +
      geom_point() +
      geom_label_repel(alpha = 0.7, max.overlaps = 1000)
    print(myPlot)
    
    rowStrings <- c()
    for(r in 1:(nrow(outlierTable))) {
      tempList <- as.list(outlierTable[r,])
      tempStrings <- paste(names(tempList), unlist(tempList), sep = ": ")
      tempString <- paste(tempStrings, collapse = ", ")
      rowStrings <- c(rowStrings, tempString)
    }`, {
    captureGraphics: {
      width: 600,
      height: 300
    }
});
  return capture
}

async function getOutlierData() {
  const result = await webR.evalRRaw(
    'print(rowStrings)',
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

  function getResults() {
    setLoading(true);
    getAPlot(xAxis, yAxis, labelOutliers, listOutliers).then(r => {
      setPicture(r.images);
      if (listOutliers) {
        getOutlierData().then(res => {
          var outs = tidyOutliers(res);
          setOutliers(outs);
          setShowOutlierTable(true)
        })
      } else {
        setShowOutlierTable(false)
      };
      setLoading(false)
  });
  }

  function tidyOutliers(r) {
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
        <table>
          <tr>
            <th scope="col">Zipcode</th>
            <th scope="col">{xAxis}</th>
            <th scope="col">{yAxis}</th>
          </tr>
          {outliers.map(row =>
            <tr>
              <th scope="row">{row.zipcode}</th>
              <td>{row.x}</td>
              <td>{row.y}</td>
            </tr>
          )}
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
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Let's make a graph! 
          <br/>
            <label>
              Select an x-axis variable:
              <select name="xAxis" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                <option value={null}></option>
                {categoryNames.slice(2).map(name => <option value={name}>{name}</option>)}
              </select>
            </label>
          <br/>
            <label>
              Select a y-axis variable:
              <select name="yAxis" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                <option value={null}></option>
                {categoryNames.slice(2).map(name => <option value={name}>{name}</option>)}
              </select>
            </label>
          <br/>
            <label>
              Label outliers?
              <input type="checkbox" checked={labelOutliers} onChange={e => setLabelOutliers(e.target.checked)}/>
            </label>
            <label>
              List outliers?
              <input type="checkbox" checked={listOutliers} onChange={e => setListOutliers(e.target.checked)}/>
            </label>
          <br/>
          <button onClick={getResults} disabled={loading || !xAxis || !yAxis}>
            Get a plot!
          </button>
        </p>
        <canvas id="plot-canvas" width="900" height="450" style={{border: "solid white"}}/>
        <OutlierTable/>
      </header>
    </div>
  );
}

export default App;
