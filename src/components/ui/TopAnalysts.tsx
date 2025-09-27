import { Button } from '@/components/ui/button';

const TopAnalysts = () => (
  <section className="py-12 md:py-16">
    <div className="container mx-auto px-4 md:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#00FF91] mb-2">
          Top Analistas da Semana
        </h2>
        <p className="text-[color:var(--text-secondary)]">
          Conheça quem está destacando no ranking
        </p>
      </div>
      
      <div className="flex justify-center items-center gap-6 mb-8">
        {[1, 2, 3].map((rank) => (
          <div key={rank} className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FF91]/20 to-[#FF1493]/20 border-2 border-[#00FF91] flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-[#00FF91]">#{rank}</span>
            </div>
            <div className="text-sm text-[color:var(--text-secondary)]">Analista {rank}</div>
            <div className="text-xs text-[#00FF91]">98% precisão</div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <Button variant="outline" className="border-[#00FF91]/40 text-[#00FF91] hover:bg-[#00FF91]/10">
          Ver ranking completo
        </Button>
      </div>
    </div>
  </section>
);

export default TopAnalysts;