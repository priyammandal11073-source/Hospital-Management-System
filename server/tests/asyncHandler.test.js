import { describe, it, expect, vi } from "vitest";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { errorHandler } from "../middleware/errorMiddleware.js";

describe("AppError", () => {
  it("creates operational error with correct statusCode and message", () => {
    const err = new AppError("Not authorized", 403);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("Not authorized");
    expect(err.statusCode).toBe(403);
    expect(err.isOperational).toBe(true);
  });

  it("defaults status code to 500 when omitted", () => {
    const err = new AppError("Server failure");
    expect(err.statusCode).toBe(500);
  });
});

describe("asyncHandler", () => {
  it("invokes handler successfully when promise resolves", async () => {
    const req = {};
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const handler = asyncHandler(async (req, res) => {
      res.status(200).json({ ok: true });
    });

    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("catches rejected promises and forwards to next()", async () => {
    const req = {};
    const res = {};
    const next = vi.fn();

    const testError = new AppError("Invalid input", 400);
    const handler = asyncHandler(async () => {
      throw testError;
    });

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(testError);
  });

  it("integrates with errorHandler to output formatted JSON response", async () => {
    const req = { originalUrl: "/api/test" };
    let capturedCode = null;
    let capturedBody = null;

    const res = {
      status(code) {
        capturedCode = code;
        return this;
      },
      json(body) {
        capturedBody = body;
        return this;
      },
    };

    const next = (err) => {
      errorHandler(err, req, res, () => {});
    };

    const handler = asyncHandler(async () => {
      throw new AppError("Resource not permitted", 403);
    });

    await handler(req, res, next);
    expect(capturedCode).toBe(403);
    expect(capturedBody.success).toBe(false);
    expect(capturedBody.statusCode).toBe(403);
    expect(capturedBody.message).toBe("Resource not permitted");
    expect(capturedBody.path).toBe("/api/test");
  });
});
