import logo from './logo.svg';
import './App.css';
import { WebR } from 'webr';
import { useEffect, useState } from 'react';

const webR = new WebR();
await webR.init();
await webR.installPackages(["tidyverse"])

async function getAPlot() {
  const shelter = await new webR.Shelter();
  const capture = await shelter.captureR(
    `library(tidyverse)
dataCT <- read.csv("http://localhost:3000/Summer-2024/ct_data.csv")
names(dataCT) <- lapply(dataCT[1,], as.character)
names(dataCT) <- chartr("!!", "__", names(dataCT))
names(dataCT) <- chartr(" ", ".", names(dataCT))
dataCT <- dataCT[-1,]
dataCT[,3:323] <- sapply(dataCT[,3:323], as.numeric)
selectDataCT <- dataCT[,c(1,2,183,186,207,210,231,74:77,248:253,255,256,275:290,295:308,310:317,321,322)]
myPlot <- ggplot(selectDataCT, mapping = aes(x = Count__MEDIAN.AGE.BY.SEX__Both.sexes, y = \`Percent__TOTAL.RACES.TALLIED.[1]__Total.races.tallied__White.alone.or.in.combination.with.one.or.more.other.races\`)) +
  geom_point()
print(myPlot)`, {
  captureGraphics: {
    width: 300,
    height: 150
  }
});
  return capture.images
}

function App() {
  const [nResults, setNResults] = useState(10)
  const [mean, setMean] = useState(5)
  const [stanDev, setStanDev] = useState(1)
  const [result, setResult] = useState()
  const [loading, setLoading] = useState(false)
  const [rawData, setRawData] = useState()

  function getResults() {
    setLoading(true);
    getAPlot(rawData).then(r => {
      setResult(r);
      setLoading(false)
  });
  }

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/ct_data.csv`,
      {
        headers: {
          "Content-Type": "text/csv"
        }
      }
    ).then(r => setRawData(r))
  }, [])

  useEffect(() => {
    if (result) {
      
      document.getElementById("plot-canvas").getContext("2d").drawImage(result[0], 0, 0)
    }
  }, [result])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Let's find some random numbers! 
          <br/>
            <label for="nResults">How many numbers? (5-100,000):</label>
            <input type="number" id="nResults" name="nResults" min="5" max="100000" value={nResults} onChange={e => setNResults(e.target.value)}/>
          <br/>
            <label for="mean">Mean? (0-100):</label>
            <input type="number" id="mean" name="mean" min="0" max="100" value={mean} onChange={e => setMean(e.target.value)}/>
          <br/>
            <label for="sd">Standard deviation? (1-100):</label>
            <input type="number" id="sd" name="sd" min="1" max="100" value={stanDev} onChange={e => setStanDev(e.target.value)}/>
          <br/>
          <button onClick={getResults} disabled={loading}>
            Get a (totally unrelated) plot!
          </button>
        </p>
        <canvas id="plot-canvas" width="600" height="300" style={{border: "solid white"}}/>
      </header>
    </div>
  );
}

export default App;
