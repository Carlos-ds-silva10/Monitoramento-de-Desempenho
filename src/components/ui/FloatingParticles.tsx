import { motion } from "framer-motion";

export default function FloatingParticles() {
  const particles = Array.from({ length: 20 });

  return (
    <>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, -80],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className="
            absolute
            w-1
            h-1
            rounded-full
            bg-blue-400
            shadow-[0_0_10px_#60a5fa]
          "
        />
      ))}
    </>
  );
}