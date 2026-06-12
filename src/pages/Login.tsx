import { useState } from "react";
import { supabase } from "../lib/supabase";
import { UserRound, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import FloatingParticles from "../components/ui/FloatingParticles";

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

    {/* Partículas */}
    <div className="absolute inset-0 overflow-hidden">
      <FloatingParticles />

      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"
      />
    </div>

    {/* Glow */}
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />

    {/* Card */}
    <motion.div
      className="relative z-10 w-full max-w-md mx-4"
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="bg-[#0f172a]/70 backdrop-blur-2xl border border-blue-400/20 rounded-3xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.15)]">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <UserRound className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <motion.h1
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="text-4xl font-bold bg-gradient-to-r from-white via-blue-300 to-cyan-300 bg-clip-text text-transparent"
          >
            Sistema de Equipes
          </motion.h1>

          <p className="text-slate-400 mt-3">
            Controle de instalações e manutenções
          </p>
        </div>

        {/* Erro */}
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

        <div className="mt-8 text-center text-xs text-slate-500">
          © 2026 • Sistema de Equipes
        </div>

      </div>
    </motion.div>

  </div>
);}