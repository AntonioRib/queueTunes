import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Title } from './Components/Title/Title';
import { Wizard } from './Components/Wizard/Wizard';

function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white py-10 px-5">
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            minWidth: '250px',
          },
        }} />
      <Title />
      <main className="flex w-full flex-col items-center">
        <Routes>
          <Route path="/" element={<Wizard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;