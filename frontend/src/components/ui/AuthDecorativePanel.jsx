import logo from "../../assets/logo.png";

export default function AuthDecorativePanel({
  title,
  description,
  descriptionClassName = "text-blue-100",
}) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4A6B8A] to-[#162A42] relative overflow-hidden z-20 shadow-[15px_0_30px_-5px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col items-center justify-center w-full px-12 relative z-10">
        <img
          src={logo}
          alt="Business Control"
          className="w-80 mb-8 drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
        />
        <h2 className="text-white text-3xl font-semibold text-center mb-4">
          {title}
        </h2>
        <p className={`${descriptionClassName} text-center text-lg max-w-md leading-relaxed`}>
          {description}
        </p>
      </div>

      <div
        className="absolute top-0 right-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none translate-x-[10%] -translate-y-[10%]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 40%, transparent 70%)",
          boxShadow:
            "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
          filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.4))",
        }}
      />

      <div
        className="absolute bottom-0 left-0 w-[16rem] h-[16rem] rounded-full mix-blend-overlay pointer-events-none -translate-x-[10%] translate-y-[10%]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(255,255,255,0.05) 50%, transparent 70%)",
          boxShadow:
            "inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.2)",
          filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
}
