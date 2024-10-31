import './App.css';
import { Column } from './Components/Column/Column';
import { Title } from './Components/Title/Title';

function App() {
  return (
    <div className="App">
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white py-10 px-5">
        <Title />
        <Column />
      </div>
    </div>
  );
}

export default App;