import { Routes, Route } from 'react-router-dom';
import DashboardShell from '@/components/DashboardShell';
import Overview from '@/components/pages/Overview';
import Pipeline from '@/components/pages/Pipeline';
import Orchestration from '@/components/pages/Orchestration';
import Models from '@/components/pages/Models';
import Monitoring from '@/components/pages/Monitoring';
import Alerts from '@/components/pages/Alerts';

function App() {
  return (
    <DashboardShell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/orchestration" element={<Orchestration />} />
        <Route path="/models" element={<Models />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </DashboardShell>
  );
}

export default App;
