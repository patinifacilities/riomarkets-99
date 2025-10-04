import { useState, useEffect, useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RaffleSliderImage {
  id: string;
  url: string;
  title: string;
}

export const RaffleSlider = () => {
  const [images, setImages] = useState<RaffleSliderImage[]>([]);
  const [sliderDelay, setSliderDelay] = useState(7000);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const carouselApiRef = useRef<any>(null);

  useEffect(() => {
    loadSliderConfig();
  }, []);

  const loadSliderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('raffle_slider_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const imgs = Array.isArray(data.images) 
          ? (data.images as unknown as RaffleSliderImage[])
          : [];
        setImages(imgs);
        setSliderDelay((data.slider_delay_seconds || 7) * 1000);
      }
    } catch (error) {
      console.error('Error loading raffle slider config:', error);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden border-b border-border mb-8">
      <div className="container mx-auto px-4 py-4">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: sliderDelay,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full"
          setApi={(api) => {
            carouselApiRef.current = api;
            if (api) {
              api.on('select', () => {
                setCurrentSlideIndex(api.selectedScrollSnap());
              });
            }
          }}
        >
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative h-[300px] w-full overflow-hidden rounded-xl">
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Dots Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all cursor-pointer",
                  currentSlideIndex === index 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
                onClick={() => {
                  if (carouselApiRef.current) {
                    carouselApiRef.current.scrollTo(index);
                  }
                }}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
