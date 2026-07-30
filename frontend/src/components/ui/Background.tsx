export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-noise" />

      <div className="blob w-[600px] h-[600px] bg-primary-500/10 top-[-10%] left-[-5%] animate-blob" />
      <div className="blob w-[500px] h-[500px] bg-accent-500/10 top-[40%] right-[-8%] animate-blob-reverse" />
      <div className="blob w-[400px] h-[400px] bg-primary-500/8 bottom-[-5%] left-[30%] animate-blob-slow" />
      <div className="blob w-[300px] h-[300px] bg-accent-500/8 top-[20%] left-[40%] animate-float-slow" />

      <div className="absolute inset-0 bg-mesh" />
    </div>
  )
}
