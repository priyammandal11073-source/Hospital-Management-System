import { Navigate } from "react-router-dom";

/**
 * WardMapPage redirects to the unified Ward & Bed Allocation Manager (/beds?view=map)
 * which features the integrated spatial floor plan map, occupancy meters, print census, and CSV export.
 */
function WardMapPage() {
  return <Navigate to="/beds?view=map" replace />;
}

export default WardMapPage;