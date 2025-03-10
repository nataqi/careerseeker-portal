
import { useEffect, useRef } from 'react';

interface DynamicBackgroundProps {
  children: React.ReactNode;
}

const DynamicBackground = ({ children }: DynamicBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Define soft green gradient colors
    const colors = [
      { r: 232, g: 243, b: 232 }, // Light green
      { r: 226, g: 240, b: 226 }, // Soft green
      { r: 212, g: 233, b: 212 }, // Medium green
      { r: 200, g: 230, b: 200 }, // Darker green
      { r: 242, g: 252, b: 242 }, // Very light green
    ];

    // Animation parameters
    const numberOfGradients = 3;
    const gradients = Array.from({ length: numberOfGradients }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 300 + 200,
      colorIndex1: Math.floor(Math.random() * colors.length),
      colorIndex2: Math.floor(Math.random() * colors.length),
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: 0.15 + Math.random() * 0.15,
    }));

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill with base color
      ctx.fillStyle = '#f9fff0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each gradient blob
      gradients.forEach((gradient) => {
        const color1 = colors[gradient.colorIndex1];
        const color2 = colors[gradient.colorIndex2];
        
        const grd = ctx.createRadialGradient(
          gradient.x, 
          gradient.y, 
          0, 
          gradient.x, 
          gradient.y, 
          gradient.size
        );
        
        grd.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${gradient.opacity})`);
        grd.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0)`);
        
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Move gradient for next frame
        gradient.x += gradient.speedX;
        gradient.y += gradient.speedY;
        
        // Bounce off edges
        if (gradient.x < 0 || gradient.x > canvas.width) gradient.speedX *= -1;
        if (gradient.y < 0 || gradient.y > canvas.height) gradient.speedY *= -1;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full -z-10"
        style={{ pointerEvents: 'none' }}
      />
      {children}
    </div>
  );
};

export default DynamicBackground;
