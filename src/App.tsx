import { Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { AddPlant } from "./pages/AddPlant";
import { PlantDetail } from "./pages/PlantDetail";
import { Camera } from "./pages/Camera";
import { Growth } from "./pages/Growth";
import { WateringHistory } from "./pages/WateringHistory";
import { Settings } from "./pages/Settings";
import { Compare } from "./pages/Compare";
import { Album } from "./pages/Album";
import { CalendarPage } from "./pages/Calendar";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add" element={<AddPlant />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/plant/:id" element={<PlantDetail />} />
      <Route path="/plant/:id/camera" element={<Camera />} />
      <Route path="/plant/:id/growth" element={<Growth />} />
      <Route path="/plant/:id/watering" element={<WateringHistory />} />
      <Route path="/plant/:id/compare" element={<Compare />} />
      <Route path="/plant/:id/album" element={<Album />} />
    </Routes>
  );
}
