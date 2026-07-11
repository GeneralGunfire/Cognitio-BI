import { Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ImportPage from './pages/ImportPage.jsx';
import TransformPage from './pages/TransformPage.jsx';

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/import">Import</NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/datasets/:id/transform" element={<TransformPage />} />
        </Routes>
      </main>
    </div>
  );
}
