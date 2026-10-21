import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  optionalProtect,
  protect,
  protectPatient,
  protectStaffOrPatient,
  requireRole,
  restrictTo,
} from "../middleware/authMiddleware.js";
import { errorHandler, notFoundHandler } from "../middleware/errorMiddleware.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const staffToken = jwt.sign(
  { id: "u1", role: "admin", type: "staff" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

const patientToken = jwt.sign(
  { id: "p1", type: "patient" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

const makeReq = (headers = {}) => ({ headers });
const makeRes = () => {
  const res = {};
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (body) {
    res.body = body;
    return res;
  };
  res.send = function (body) {
    res.body = body;
    return res;
  };
  return res;
};

describe("protect", () => {
  it("rejects requests without a bearer token", () => {
    const req = makeReq();
    const sent = protect(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(401);
  });

  it("rejects malformed headers", () => {
    const req = makeReq({ authorization: "Basic abc" });
    const sent = protect(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(401);
  });

  it("rejects an invalid/expired token", () => {
    const req = makeReq({ authorization: "Bearer not.a.jwt" });
    const sent = protect(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(401);
  });

  it("rejects patient tokens on staff-protected routes", () => {
    const req = makeReq({ authorization: `Bearer ${patientToken}` });
    const sent = protect(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(403);
  });

  it("allows valid staff tokens and attaches req.user", () => {
    const req = makeReq({ authorization: `Bearer ${staffToken}` });
    let nextCalled = false;
    protect(req, makeRes(), () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(req.user.id).toBe("u1");
    expect(req.user.role).toBe("admin");
  });
});

describe("restrictTo / requireRole", () => {
  it("denies roles not in the allowlist", () => {
    const req = { user: { role: "nurse" } };
    const sent = restrictTo("admin")(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(403);
  });

  it("allows permitted roles", () => {
    const req = { user: { role: "doctor" } };
    let nextCalled = false;
    restrictTo("doctor", "admin")(req, makeRes(), () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("requireRole is an alias for restrictTo", () => {
    expect(requireRole).toBe(restrictTo);
  });
});

describe("optionalProtect", () => {
  it("never blocks unauthenticated requests", () => {
    const req = makeReq();
    let nextCalled = false;
    optionalProtect(req, makeRes(), () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("decodes a valid token when present", () => {
    const req = makeReq({ authorization: `Bearer ${staffToken}` });
    optionalProtect(req, makeRes(), () => {});
    expect(req.user.role).toBe("admin");
  });
});

describe("protectPatient", () => {
  it("rejects a staff token", () => {
    const req = makeReq({ authorization: `Bearer ${staffToken}` });
    const sent = protectPatient(req, makeRes(), () => {
      throw new Error("next should not be called");
    });
    expect(sent.statusCode).toBe(401);
  });

  it("allows a patient token and attaches req.patient", () => {
    const req = makeReq({ authorization: `Bearer ${patientToken}` });
    let nextCalled = false;
    protectPatient(req, makeRes(), () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(req.patient.id).toBe("p1");
  });
});

describe("protectStaffOrPatient", () => {
  it("routes patient tokens to req.patient", () => {
    const req = makeReq({ authorization: `Bearer ${patientToken}` });
    protectStaffOrPatient(req, makeRes(), () => {});
    expect(req.patient.id).toBe("p1");
    expect(req.user).toBeUndefined();
  });

  it("routes staff tokens to req.user", () => {
    const req = makeReq({ authorization: `Bearer ${staffToken}` });
    protectStaffOrPatient(req, makeRes(), () => {});
    expect(req.user.id).toBe("u1");
  });
});

describe("error middleware", () => {
  it("notFoundHandler sets 404 and delegates to error handler", () => {
    const req = { method: "GET", originalUrl: "/nope" };
    const res = makeRes();
    const next = (err) => {
      expect(res.statusCode).toBe(404);
      expect(err.message).toContain("not found");
    };
    notFoundHandler(req, res, next);
  });

  it("errorHandler maps CastError to 404", () => {
    const err = { name: "CastError", value: "bad-id" };
    const res = makeRes();
    res.statusCode = 200;
    errorHandler(err, { originalUrl: "/a" }, res, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("errorHandler maps ValidationError to 400", () => {
    const err = {
      name: "ValidationError",
      errors: { name: { message: "Name is required" } },
    };
    const res = makeRes();
    res.statusCode = 200;
    errorHandler(err, { originalUrl: "/a" }, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Name is required");
  });

  it("errorHandler maps JsonWebTokenError to 401", () => {
    const err = { name: "JsonWebTokenError" };
    const res = makeRes();
    res.statusCode = 200;
    errorHandler(err, { originalUrl: "/a" }, res, () => {});
    expect(res.statusCode).toBe(401);
  });

  it("errorHandler defaults unhandled errors to 500", () => {
    const err = { message: "boom" };
    const res = makeRes();
    res.statusCode = 200;
    errorHandler(err, { originalUrl: "/a" }, res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("boom");
  });
});