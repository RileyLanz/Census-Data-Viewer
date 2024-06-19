import logo from './logo.svg';
import './App.css';
import { WebR } from 'webr';
import { useEffect, useState } from 'react';

const webR = new WebR();
await webR.init();
let xyz = await webR.installPackages(["ggplot2"])

async function getRandomNumbers(n, m, s) {
  const shelter = await new webR.Shelter();
  const capture = await shelter.captureR(
    `library(ggplot2);
myDF <- data.frame(values = round(rnorm(${n},${m},${s}), 2));
myPlot <- ggplot(myDF, mapping = aes(x = values)) +
  geom_histogram()
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

  function getResults() {
    setLoading(true);
    getRandomNumbers(nResults, mean, stanDev).then(r => {
      setResult(r);
      setLoading(false)
  });
  }

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
            Get a plot!
          </button>
        </p>
        <canvas id="plot-canvas" width="600" height="300" style={{border: "solid white"}}/>
      </header>
    </div>
  );
}

export default App;
