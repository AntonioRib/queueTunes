import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainColumn } from './Components/MainColumn/MainColumn';
import { Title } from './Components/Title/Title';
import { TabNav } from './Components/TabNav/TabNav';
import { QuickQueue } from './Components/QuickQueue/QuickQueue';
import { QUICK_QUEUE_PRIMARY } from './featureFlags';

function App() {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white py-10 px-5">
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            minWidth: '250px',
          },
        }} />
      <Title />
      <TabNav />
      <Routes>
        {QUICK_QUEUE_PRIMARY ? (
          <>
            <Route path="/" element={<QuickQueue />} />
            <Route path="/queue-tunes" element={<MainColumn />} />
          </>
        ) : (
          <>
            <Route path="/" element={<MainColumn />} />
            <Route path="/quick-queue" element={<QuickQueue />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;