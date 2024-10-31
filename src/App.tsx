import { MainColumn } from './Components/MainColumn/MainColumn';
import { Title } from './Components/Title/Title';

function App() {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white py-10 px-5">
      <Title />
      <MainColumn />
    </div>
  );
}

export default App;