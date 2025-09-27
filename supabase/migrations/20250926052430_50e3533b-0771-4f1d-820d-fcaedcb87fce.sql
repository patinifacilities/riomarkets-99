-- Create press_mentions table for media coverage
CREATE TABLE public.press_mentions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    vehicle TEXT NOT NULL,
    logo_url TEXT,
    url TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.press_mentions ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing published articles
CREATE POLICY "Everyone can view published press mentions" 
ON public.press_mentions 
FOR SELECT 
USING (status = 'published');

-- Create policy for admin management
CREATE POLICY "Admin can manage all press mentions" 
ON public.press_mentions 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Create view for published articles only
CREATE VIEW public.press_mentions_published_v AS 
SELECT 
    id,
    title,
    summary,
    vehicle,
    logo_url,
    url,
    published_at,
    created_at
FROM public.press_mentions 
WHERE status = 'published' 
ORDER BY published_at DESC;

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_press_mentions_updated_at
BEFORE UPDATE ON public.press_mentions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample press coverage data
INSERT INTO public.press_mentions (title, summary, vehicle, logo_url, url, published_at) VALUES
(
    'Rio Markets revoluciona o mercado de previsões no Brasil',
    'Plataforma inovadora combina análise preditiva com gamificação, oferecendo uma nova forma de engajamento com eventos futuros através do Rioz Coin.',
    'TechTudo',
    'https://s2-techtudo.glbimg.com/uGqUjjBmJYZJTX8BDUm7xHX0u5c=/0x0:1200x630/1000x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_08fbf48bc0524877943fe86e43087e7a/internal_photos/bs/2021/P/d/QDQHV2R1WFkNRLtQJUpg/techtudo-logo-fundo-branco.png',
    'https://techtudo.globo.com',
    '2024-01-15 10:30:00'
),
(
    'Startups brasileiras apostam em mercados preditivos',
    'Rio Markets lidera tendência de plataformas que democratizam acesso a análises de mercado através de mecânicas de recompensas e moeda virtual.',
    'Estadão',
    'https://www.estadao.com.br/static/generic/estadao/images/estadao-logo.png',
    'https://estadao.com.br',
    '2024-01-10 14:20:00'
),
(
    'A nova era dos mercados de previsão no Brasil',
    'Análise sobre como plataformas como Rio Markets estão transformando a forma como brasileiros interagem com eventos futuros e análises preditivas.',
    'Folha de S.Paulo',
    'https://f.i.uol.com.br/folha/images/logos/folha-logo.png',
    'https://folha.uol.com.br',
    '2024-01-05 09:15:00'
),
(
    'Inovação brasileira: Rio Markets e o futuro das previsões',
    'Reportagem especial sobre como a startup carioca está revolucionando o mercado de análises preditivas com foco na experiência do usuário.',
    'G1',
    'https://s2.glbimg.com/aL6NgK-7CQodGkP8uKGm7Xda_wo=/0x0:1000x523/1000x0/smart/filters:strip_icc()/g.glbimg.com/og/gs/gshow3/f/original/2018/07/17/g1.png',
    'https://g1.globo.com',
    '2023-12-28 16:45:00'
),
(
    'Mercados preditivos ganham espaço entre investidores brasileiros',
    'Rio Markets apresenta crescimento significativo ao oferecer alternativa inovadora para análise de tendências através de sistema de recompensas.',
    'InfoMoney',
    'https://www.infomoney.com.br/favicon.ico',
    'https://infomoney.com.br',
    '2023-12-20 11:30:00'
);