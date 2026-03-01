import { BrowserRouter, Routes, Route } from "react-router-dom"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Patients from "./pages/Patients"
import MachineLearning from "./pages/MachineLearning"
import ComputerVision from "./pages/ComputerVision"
import HL7 from "./pages/HL7"
import TestOrders from "./pages/TestOrders"

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", background: "#FFFFFF", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/ml" element={<MachineLearning />} />
            <Route path="/cv" element={<ComputerVision />} />
            <Route path="/hl7" element={<HL7 />} />
            <Route path="/orders" element={<TestOrders />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
