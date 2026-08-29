import React, { useState } from "react";
import { Button } from "../components/u/button";
import { Input } from "../components/u/input";
import { Modal } from "../components/u/modal";

const Login() {
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // TODO: keep existing login logic
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md p-8">
        <h2 className="mb-6 text-2xl font-bold text-neutral-900">Sign In</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              required
              className="mb-2"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              required
              className="mb-4"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-neutral-500">
          <a href="#" className="underline text-primary hover:text-primary-dark">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;