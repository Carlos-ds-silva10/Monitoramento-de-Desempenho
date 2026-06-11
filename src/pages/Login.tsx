import { useState } from "react";
import { supabase } from "../lib/supabase";
import { UserRound, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha inválidos.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center relative overflow-hidden">
      {/* Glow Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-blue-900/40 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <UserRound className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white">
              Sistema de Equipes
            </h1>

            <p className="text-slate-400 mt-3">
              Controle de instalações e manutenções
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />

              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full
                  h-14
                  pl-12
                  pr-4
                  rounded-xl
                  bg-[#111c36]
                  border
                  border-blue-900/40
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  transition
                "
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />

              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full
                  h-14
                  pl-12
                  pr-4
                  rounded-xl
                  bg-[#111c36]
                  border
                  border-blue-900/40
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  transition
                "
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-14
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-blue-500
                hover:from-blue-500
                hover:to-blue-400
                text-white
                font-semibold
                shadow-lg
                shadow-blue-600/20
                transition-all
                duration-300
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500">
            © 2026 • Sistema de Equipes
          </div>
        </div>
      </div>
    </div>
  );
}
