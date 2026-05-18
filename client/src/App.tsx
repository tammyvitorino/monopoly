import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Wallet from './pages/Wallet';
import Transfer from './pages/Transfer';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:sessionId" element={<Lobby />} />
        <Route path="/wallet/:playerId" element={<Wallet />} />
        <Route path="/transfer/:playerId" element={<Transfer />} />
      </Routes>
    </div>
  );
}

export default App;
