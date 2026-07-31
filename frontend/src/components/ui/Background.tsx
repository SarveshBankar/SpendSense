export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-noise" />
      <div className="blob w-[500px] h-[500px] bg-primary-500/8 top-[-8%] left-[-5%] animate-blob" />
      <div className="blob w-[400px] h-[400px] bg-accent-500/8 top-[35%] right-[-6%] animate-blob-reverse" />
      <div className="blob w-[350px] h-[350px] bg-primary-500/6 bottom-[-5%] left-[25%] animate-blob-slow" />
      <div className="blob w-[250px] h-[250px] bg-accent-500/6 top-[15%] left-[35%] animate-float-slow" />
      <div className="absolute inset-0 bg-mesh" />
    </div>
  )
}
