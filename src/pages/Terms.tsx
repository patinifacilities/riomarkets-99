import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Termos de Uso
            </h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>1. Aceitação dos Termos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ao acessar e usar a plataforma Rio Markets, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>2. Descrição do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Rio Markets é uma plataforma de mercados preditivos que permite aos usuários participar de previsões sobre eventos futuros. 
                  Os usuários podem comprar e vender posições em mercados baseados em resultados de eventos específicos.
                </p>
                <p className="text-muted-foreground">
                  Nossa plataforma é destinada exclusivamente para fins de análise e previsão, servindo como uma ferramenta de coleta 
                  de inteligência coletiva sobre a probabilidade de eventos futuros.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>3. Elegibilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Para usar nossos serviços, você deve:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Ter pelo menos 18 anos de idade</li>
                  <li>Ser residente do Brasil</li>
                  <li>Fornecer informações precisas e atualizadas durante o registro</li>
                  <li>Não estar em uma lista de pessoas ou entidades restritas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>4. Conta de Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Você é responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades 
                  que ocorrem em sua conta. Você deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta.
                </p>
                <p className="text-muted-foreground">
                  Você concorda em fornecer informações precisas, atuais e completas durante o processo de registro e 
                  manter essas informações atualizadas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>5. Conduta do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Você concorda em não:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Usar a plataforma para atividades ilegais ou não autorizadas</li>
                  <li>Interferir ou interromper os serviços ou servidores conectados</li>
                  <li>Criar múltiplas contas para contornar limitações</li>
                  <li>Manipular mercados ou preços através de práticas desleais</li>
                  <li>Usar informações privilegiadas para obter vantagem injusta</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>6. Riscos e Responsabilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  A participação em mercados preditivos envolve riscos financeiros. Os preços podem ser voláteis e 
                  você pode perder todo o valor investido. Você deve participar apenas com fundos que pode perder.
                </p>
                <p className="text-muted-foreground">
                  Não fornecemos aconselhamento financeiro ou de investimento. Todas as decisões são suas e você 
                  assume total responsabilidade por elas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>7. Privacidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Sua privacidade é importante para nós. Nossa coleta, uso e proteção de suas informações pessoais 
                  são regidos por nossa Política de Privacidade, que é incorporada por referência a estes Termos.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>8. Limitação de Responsabilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Rio Markets não será responsável por danos diretos, indiretos, incidentais, especiais ou consequenciais 
                  resultantes do uso ou incapacidade de usar nossos serviços, mesmo que tenhamos sido avisados da 
                  possibilidade de tais danos.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>9. Modificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Reservamos o direito de modificar estes Termos a qualquer momento. As alterações entrarão em vigor 
                  imediatamente após a publicação. Seu uso continuado da plataforma constitui aceitação dos termos modificados.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>10. Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Email: legal@riomarkets.com</li>
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

export default Terms;