import { useEffect, useState } from "react";
import MainPage from "./MainPage";
import { WebR } from "webr";

async function installWebR() {
  await webR.init();
  await webR.installPackages([
    "ggplot2",
    "knitr",
    "ggrepel",
    "stringr",
    "dplyr",
  ]);
}

async function getCategoryNames() {
  categoryNames = await webR.evalRRaw(
    `library(ggplot2)
    library(knitr)
    library(stringr)
    library(ggrepel)
    library(dplyr)
    false <- F
    true <- T

    catNames <- read.csv("${window.location.href}/category_names.csv")

    print(catNames$Categories)`,
    "string[]",
  );
}

async function getStateData(cs) {
  await webR.evalRVoid(
    `data <- read.csv("${window.location.href}/${cs}_data.csv")
    names(data) <- lapply(data[1,], as.character)
    data <- data[-1,]
    data[,3:323] <- sapply(data[,3:323], as.numeric)
    data$\`Geographic Area Name\` <- substring(data$\`Geographic Area Name\`, 7, 11)
    
    medianIncomeData <- read.csv("${window.location.href}/${cs}_median_income.csv")
    names(medianIncomeData) <- substring(names(medianIncomeData), 7, 11)
    medianIncomeData <- medianIncomeData[,-1]
    medianIncomeData <- data.frame(names(medianIncomeData), as.character(medianIncomeData[1,]))
    medianIncomeData[,2] <- gsub(",", "", medianIncomeData[,2])
    medianIncomeData[,2][medianIncomeData$\`as.character.medianIncomeData.1....\` == "250000+"] <- "250001"
    medianIncomeData[,2][medianIncomeData$as.character.medianIncomeData.1.... == "-"] <- NA
    medianIncomeData[,2] <- as.numeric(medianIncomeData[,2])
    
    data <- inner_join(data, medianIncomeData, by = join_by(\`Geographic Area Name\` == names.medianIncomeData.))
    
    zipTable <- read.csv("${window.location.href}/uszips.csv")
    selectData <- data[,c(1,2,3,75,183,186,248:253,255,256,276:278,285,286,295:299,302,303,306:308,310,311,321,322,324)]
    names(selectData) <- catNames[,1]
    selectData <- selectData[,c(1:4,34,5:33)]`
  )
}

async function getAllRows() {
  allRows = await webR.evalRRaw(
    `selectData$city <- NA
    for (z in selectData$\`Geographic Area Name\`) {
      selectData[selectData$\`Geographic Area Name\` == z,]$city <- zipTable[zipTable$zip == as.integer(z),]$city
    }
    
    allRowStrings <- c()
    for(r in 1:(nrow(selectData))) {
      tempList <- as.list(selectData[r,])
      tempStrings <- paste(names(tempList), unlist(tempList), sep = ": ")
      tempString <- paste(tempStrings, collapse = ", ")
      allRowStrings <- c(allRowStrings, tempString)
    }
    print(allRowStrings)`,
    "string[]",
  );
}

export const webR = new WebR({ repoUrl: "https://repo.r-wasm.org/" });
export var categoryNames = categoryNames;
export var allRows = allRows;

export default function App() {
  const [content, setContent] = useState("Installing R and R packages");
  const [selectedState, setSelectedState] = useState(null);
  const [tentativeState, setCurrentState] = useState(null);

  useEffect(() => {
    installWebR().then(() => {
      setContent("Retrieving data");
      getCategoryNames().then(() => {
        setContent("RenderPage");
      });
    });
  }, []);

  function RenderPage() {
    if (selectedState) {
      return(<MainPage setSelectedState={setSelectedState}/>)
    } else {
      return(
        <>
          <label>
            Select a state:&nbsp;
            <select
              name="state"
              value={tentativeState}
              onChange={(e) => setCurrentState(e.target.value)}
            >
              <option value={null}></option>
              <option value="ct">Connecticut</option>
              <option value="ma">Massachusetts</option>
            </select>
          </label>
          <br/>
          <button
          onClick={() => {
              setContent("Retrieving census data (1/2)");
              getStateData(tentativeState).then(() => {
                setContent("Retrieving census data (2/2)");
                getAllRows().then(() => {
                  setContent("RenderPage");
                  setSelectedState(tentativeState)
                })
              }
              )
            }}
            disabled={selectedState || !tentativeState}>
              Choose This State
            </button>
        </>
      )
    }
  }

  return (
    <div className="App">
      <header className="App-header">{content === "RenderPage" ? <RenderPage/> : content}</header>
    </div>
  );
}
