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
    "string[]",
  );
}

async function getAllRows() {
  allRows = await webR.evalRRaw(
    `selectDataCT$city <- NA
    for (z in selectDataCT$\`Geographic Area Name\`) {
      selectDataCT[selectDataCT$\`Geographic Area Name\` == z,]$city <- zipTable[zipTable$zip == as.integer(z),]$city
    }
    
    allRowStrings <- c()
    for(r in 1:(nrow(selectDataCT))) {
      tempList <- as.list(selectDataCT[r,])
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

  useEffect(() => {
    installWebR().then(() => {
      setContent("Retrieving census data (1/2)");
      getCategoryNames().then(() => {
        setContent("Retrieving census data (2/2)");
        getAllRows().then(() => {
          setContent(<MainPage />);
        });
      });
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">{content}</header>
    </div>
  );
}
