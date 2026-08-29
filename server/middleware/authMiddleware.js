import jwt from "jsonwebtoken";

// Verifies the Bearer token before allowing access to a protected route.
export const protect = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required" });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
};

// Restricts a protected route to one or more staff roles.
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to do this" });
  }

  return next();
};
