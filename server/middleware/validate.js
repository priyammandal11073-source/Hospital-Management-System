/**
 * Request payload validation middleware built on zod schemas.
 *
 * Usage:
 *   router.post("/login", validate(loginSchema), loginController);
 *
 * On success the parsed (and coerced/trimmed) data replaces req[source],
 * so downstream controllers only ever see validated values.
 * On failure a 400 response with per-field errors is returned.
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join(".") : source,
        message: issue.message,
      })),
    });
  }

  req[source] = result.data;
  return next();
};