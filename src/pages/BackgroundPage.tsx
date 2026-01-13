import { StarField } from '@/components/StarField';

const BackgroundPage = () => {
  return (
    <div className="min-h-screen w-full bg-celestial relative overflow-hidden">
      <StarField />
      
      {/* Subtle gradient orbs for depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gold/4 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight-950/50 to-transparent" />
    </div>
  );
};

export default BackgroundPage;
