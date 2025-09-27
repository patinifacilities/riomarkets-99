import * as React from "react";
import { Plus, Minus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { track } from '@/lib/analytics';

const faqData = [
  {
    question: "O que é o Rio Markets?",
    answer: "Uma plataforma de mercados preditivos onde você analisa eventos futuros e recebe recompensas conforme a precisão das suas análises."
  },
  {
    question: "O Rio Markets é uma casa de apostas?",
    answer: "Não. Diferente de apostas, aqui tratamos de análises preditivas com linguagem educativa e em conformidade regulatória."
  },
  {
    question: "Como funcionam as recompensas?",
    answer: "Você recebe Rioz Coin conforme o resultado das suas análises, com liquidação transparente e justa (pari-passu)."
  },
  {
    question: "Preciso ser especialista para participar?",
    answer: "Não. Qualquer pessoa pode analisar eventos, e o sistema é educativo, com métricas claras e suporte intuitivo."
  },
  {
    question: "É seguro usar o Rio Markets?",
    answer: "Sim. Usamos Supabase, autenticação segura e seguimos práticas de compliance para garantir transparência."
  }
];

const FAQ = () => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <section id="faq-section" className="py-12 md:py-16" role="region" aria-labelledby="faq-title">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#00FF91] mb-4">
            Dúvidas Frequentes
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)] max-w-2xl mx-auto">
            Encontre respostas para as principais questões sobre mercados preditivos
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion 
            type="multiple" 
            value={openItems} 
            onValueChange={setOpenItems}
            className="space-y-4"
          >
            {faqData.map((faq, index) => {
              const isOpen = openItems.includes(index.toString());
              return (
                <AccordionItem 
                  key={index} 
                  value={index.toString()}
                  className="bg-bg-card border border-border-soft rounded-xl overflow-hidden hover:border-[#00FF91]/30 hover:shadow-[0_0_20px_rgba(0,255,145,0.15)] transition-all duration-300"
                >
                  <AccordionTrigger 
                    className="px-6 py-4 text-left hover:no-underline group [&[data-state=open]>div>svg]:rotate-0 hover:bg-[#00FF91]/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF91] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    onClick={() => {
                      track('faq_expand', { question_index: index, question: faq.question });
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base md:text-lg font-semibold text-text-primary pr-4 max-w-[60ch]">
                        {faq.question}
                      </span>
                      <div className="flex-shrink-0 p-1">
                        {isOpen ? (
                          <Minus className="w-5 h-5 text-[#00FF91] transition-transform duration-300" />
                        ) : (
                          <Plus className="w-5 h-5 text-[#00FF91] transition-transform duration-300" />
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent 
                    id={`faq-content-${index}`}
                    className="px-6 pb-4 pt-0"
                  >
                    <p className="text-sm md:text-base text-text-secondary max-w-[60ch] leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;