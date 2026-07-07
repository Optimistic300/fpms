import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OfflineIndicator from './components/layout/OfflineIndicator';

function App() {
    return (
        <BrowserRouter>
            <OfflineIndicator />
            <Routes>
                <Route path="/" element={<h1>FPMS</h1>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
