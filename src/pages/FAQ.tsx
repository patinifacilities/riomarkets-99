import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import riozLogoWhite from '@/assets/rio-markets-logo-white.png';
import riozLogoBlack from '@/assets/rio-markets-logo-black.png';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="flex flex-col items-center text-center mb-6">
              <img 
                src={resolvedTheme === 'light' ? riozLogoBlack : riozLogoWhite} 
                alt="Rio Markets Logo" 
                className="h-12 w-auto mb-4"
              />
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 justify-center">
                <HelpCircle className="w-8 h-8" />
                Perguntas Frequentes
              </h1>
              <p className="text-muted-foreground">
                Encontre respostas para as dúvidas mais comuns
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>O que é Rio Markets?</AccordionTrigger>
                    <AccordionContent>
                      Rio Markets é uma plataforma de mercados preditivos que permite aos usuários participar de análises sobre eventos futuros. 
                      Utilizamos inteligência coletiva para criar probabilidades sobre diversos tópicos, desde economia até entretenimento.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Como funciona a plataforma?</AccordionTrigger>
                    <AccordionContent>
                      Você pode participar comprando posições em mercados sobre eventos específicos. 
                      Os preços refletem a probabilidade coletiva do evento acontecer. 
                      Quando o evento é resolvido, as posições corretas são liquidadas proporcionalmente.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>O que é Rioz Coin?</AccordionTrigger>
                    <AccordionContent>
                      Rioz Coin é a moeda nativa da plataforma Rio Markets. É utilizada para participar dos mercados preditivos 
                      e pode ser convertida em proporção 1:1 com o Real Brasileiro (BRL).
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Conta e Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Como criar uma conta?</AccordionTrigger>
                    <AccordionContent>
                      Clique em "Entrar" no topo da página e escolha criar uma nova conta. 
                      Você pode se cadastrar usando seu email ou conta do Google. 
                      O processo é rápido e seguro, utilizando autenticação do Supabase.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Meus dados estão seguros?</AccordionTrigger>
                    <AccordionContent>
                      Sim! Utilizamos Supabase Auth para autenticação segura e criptografia de dados. 
                      Nunca armazenamos senhas em texto plano e seguimos as melhores práticas de segurança. 
                      Leia nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> para mais detalhes.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger>Esqueci minha senha, o que fazer?</AccordionTrigger>
                    <AccordionContent>
                      Na tela de login, clique em "Esqueci minha senha". 
                      Você receberá um email com instruções para redefinir sua senha de forma segura.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Depósitos e Saques</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-7">
                    <AccordionTrigger>Como fazer um depósito?</AccordionTrigger>
                    <AccordionContent>
                      Acesse sua carteira e clique em "Depositar". 
                      Você pode fazer depósitos via PIX, boleto ou cartão de crédito. 
                      Os valores são convertidos automaticamente para Rioz Coin na proporção 1:1.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-8">
                    <AccordionTrigger>Quanto tempo leva para o depósito aparecer?</AccordionTrigger>
                    <AccordionContent>
                      Depósitos via PIX são processados instantaneamente. 
                      Boletos podem levar até 2 dias úteis. 
                      Cartão de crédito é processado em minutos, dependendo da operadora.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-9">
                    <AccordionTrigger>Como fazer um saque?</AccordionTrigger>
                    <AccordionContent>
                      Na sua carteira, clique em "Sacar" e escolha o valor desejado. 
                      Saques são processados via PIX para sua conta bancária cadastrada. 
                      O processamento leva até 24 horas úteis.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-10">
                    <AccordionTrigger>Há taxas para depósitos ou saques?</AccordionTrigger>
                    <AccordionContent>
                      Não cobramos taxas para depósitos. Para saques, há uma pequena taxa administrativa 
                      que varia de acordo com o método escolhido. Consulte a página de saques para valores atualizados.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Mercados e Negociação</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-11">
                    <AccordionTrigger>Como participar de um mercado?</AccordionTrigger>
                    <AccordionContent>
                      Navegue pelos mercados disponíveis, escolha um evento de seu interesse e clique nele. 
                      Você verá as opções disponíveis com suas respectivas probabilidades. 
                      Escolha sua posição, defina o valor e confirme a operação.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-12">
                    <AccordionTrigger>O que são Fast Markets?</AccordionTrigger>
                    <AccordionContent>
                      Fast Markets são mercados de curtíssimo prazo sobre movimentos de preços de ativos. 
                      Você pode prever se o preço de um ativo vai subir ou descer em intervalos de 1 minuto. 
                      É perfeito para quem busca ação rápida e decisões ágeis.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-13">
                    <AccordionTrigger>Posso cancelar uma posição?</AccordionTrigger>
                    <AccordionContent>
                      Em mercados tradicionais, você pode fazer cashout parcial ou total antes do evento ser resolvido, 
                      sujeito a disponibilidade de liquidez. Em Fast Markets, as posições são finais assim que confirmadas 
                      devido à natureza de curto prazo desses mercados.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-14">
                    <AccordionTrigger>Como os mercados são resolvidos?</AccordionTrigger>
                    <AccordionContent>
                      Os mercados são resolvidos com base em fontes oficiais e verificáveis de informação. 
                      Nossa equipe verifica os resultados e processa as liquidações automaticamente. 
                      Você pode acompanhar o histórico de resoluções na página de auditoria de cada mercado.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50" id="regulatorio">
              <CardHeader>
                <CardTitle>Questões Regulatórias</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-15">
                    <AccordionTrigger>Rio Markets é uma casa de apostas?</AccordionTrigger>
                    <AccordionContent>
                      Não. Rio Markets é uma plataforma de mercados preditivos com propósito educativo e de coleta de inteligência coletiva. 
                      Diferente de casas de apostas tradicionais, nossos mercados refletem probabilidades baseadas em agregação de opiniões 
                      e funcionam como ferramentas de análise e previsão.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-16">
                    <AccordionTrigger>A plataforma é regulamentada?</AccordionTrigger>
                    <AccordionContent>
                      Operamos seguindo as melhores práticas de transparência e compliance. 
                      Nossa estrutura técnica utiliza tecnologia blockchain para garantir transparência nas liquidações. 
                      Estamos atentos às regulamentações brasileiras e internacionais sobre mercados preditivos.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-17">
                    <AccordionTrigger>Preciso declarar no imposto de renda?</AccordionTrigger>
                    <AccordionContent>
                      Consulte um contador para orientações específicas sobre sua situação fiscal. 
                      Em geral, ganhos financeiros podem ser tributáveis. 
                      Mantemos um histórico completo de suas transações disponível para download, 
                      facilitando sua declaração de imposto de renda.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-18">
                    <AccordionTrigger>Como entrar em contato com o suporte?</AccordionTrigger>
                    <AccordionContent>
                      Você pode acessar nossa <Link to="/support" className="text-primary hover:underline">página de suporte</Link> 
                      e abrir um ticket. Nossa equipe responde em até 24 horas úteis. 
                      Para questões urgentes relacionadas a transações, priorize usar o sistema de tickets.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-19">
                    <AccordionTrigger>Posso conversar com um assistente virtual?</AccordionTrigger>
                    <AccordionContent>
                      Sim! Temos a Riana, nossa assistente virtual com inteligência artificial. 
                      Clique no botão "Fale com a Riana" no rodapé da página para tirar dúvidas rápidas 
                      e obter ajuda instantânea.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-20">
                    <AccordionTrigger>Encontrei um bug, como reportar?</AccordionTrigger>
                    <AccordionContent>
                      Abra um ticket de suporte descrevendo o problema encontrado, 
                      incluindo informações sobre o dispositivo, navegador e passos para reproduzir o bug. 
                      Nossa equipe técnica investigará e fornecerá uma solução o mais rápido possível.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Não encontrou o que procurava?
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/support">
                <Button variant="outline">
                  Abrir Ticket de Suporte
                </Button>
              </Link>
              <Link to="/">
                <Button className="bg-primary hover:bg-primary/90">
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
