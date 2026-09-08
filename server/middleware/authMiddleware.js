import jwt from "jsonwebtoken";

// Verifies the Bearer token before allowing access to a protected route.
export const protect = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === "patient" || !decoded.role) {
      return res.status(403).json({ message: "Access denied: Staff credentials required" });
    }
    req.user = decoded;
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
      req.user = jwt.verify(token, process.env.JWT_SECRET);
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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