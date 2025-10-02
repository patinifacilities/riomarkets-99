import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import riozLogoWhite from '@/assets/rio-markets-logo-white.png';
import riozLogoBlack from '@/assets/rio-markets-logo-black.png';

const Privacy = () => {
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
              <h1 className="text-3xl font-bold mb-2">
                Política de Privacidade
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>1. Informações que Coletamos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Informações Pessoais</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Nome, email e informações de contato</li>
                      <li>Informações de verificação de identidade</li>
                      <li>Dados de pagamento e transações</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Informações de Uso</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Atividade na plataforma e histórico de transações</li>
                      <li>Dados de navegação e interação</li>
                      <li>Informações do dispositivo e localização</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>2. Como Usamos Suas Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Fornecer e manter nossos serviços</li>
                  <li>Processar transações e pagamentos</li>
                  <li>Verificar sua identidade e prevenir fraudes</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Comunicar sobre atualizações e promoções</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>3. Compartilhamento de Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Não vendemos suas informações pessoais. Podemos compartilhar informações limitadas nas seguintes situações:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Com provedores de serviços terceirizados que nos ajudam a operar</li>
                  <li>Para cumprir obrigações legais ou solicitações governamentais</li>
                  <li>Para proteger nossos direitos e prevenir atividades ilegais</li>
                  <li>Em caso de fusão, aquisição ou venda de ativos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>4. Segurança dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controles de acesso rigorosos</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Auditorias regulares de segurança</li>
                  <li>Treinamento de funcionários em privacidade</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>5. Seus Direitos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  De acordo com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Acesso aos seus dados pessoais</li>
                  <li>Correção de dados incompletos ou incorretos</li>
                  <li>Exclusão de dados desnecessários ou tratados ilegalmente</li>
                  <li>Portabilidade dos dados para outro fornecedor</li>
                  <li>Oposição ao tratamento dos dados</li>
                  <li>Informações sobre uso compartilhado de dados</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>6. Cookies e Tecnologias Similares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Manter você logado na plataforma</li>
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso da plataforma</li>
                  <li>Personalizar sua experiência</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Você pode gerenciar cookies através das configurações do seu navegador.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>7. Retenção de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
                  nesta política, a menos que um período de retenção maior seja exigido ou permitido por lei.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>8. Alterações na Política</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças 
                  significativas através de email ou aviso em nossa plataforma.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>9. Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Para questões sobre privacidade ou para exercer seus direitos, entre em contato:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Email: privacy@riomarkets.com</li>
                  <li>DPO: dpo@riomarkets.com</li>
                  <li>Endereço: Rio de Janeiro, RJ, Brasil</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;