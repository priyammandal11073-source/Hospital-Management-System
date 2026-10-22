import jwt from "jsonwebtoken";
import env from "../config/env.js";

// Verifies the Bearer token before allowing access to a protected route.
export const protect = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.type === "patient" || !decoded.role) {
      return res.status(403).json({ message: "Access denied: Staff credentials required" });
    }
    req.user = { ...decoded, _id: decoded._id || decoded.id, id: decoded.id || decoded._id };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

// Optionally decodes Bearer token if present without rejecting unauthenticated requests.
export const optionalProtect = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = { ...decoded, _id: decoded._id || decoded.id, id: decoded.id || decoded._id };
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  return next();
};

// Restricts a protected route to one or more staff roles.
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }

  return next();
};

// Alias for restrictTo so route files can read more naturally:
//   router.get("/", protect, requireRole("admin"), handler);
export const requireRole = restrictTo;

// Verifies the Bearer token for patient-specific routes.
// Checks that the token type is 'patient' (distinguishes from staff tokens).
// Attaches decoded patient info to req.patient (distinct from req.user).
export const protectPatient = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    // Reject the token if it's a staff token (has 'role' but not 'type: patient')
    if (!decoded.type || decoded.type !== "patient") {
      return res.status(401).json({
        message: "Invalid token type. This endpoint requires a patient authentication token.",
      });
    }

    // Attach patient info to req.patient (not req.user, to keep distinct from staff auth)
    req.patient = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

// Allows either staff or patient to access a shared resource (e.g. medical file streaming).
// Checks the token, populates either req.patient or req.user.
export const protectStaffOrPatient = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.type === "patient") {
      req.patient = decoded;
    } else {
      req.user = { ...decoded, _id: decoded._id || decoded.id, id: decoded.id || decoded._id };
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};