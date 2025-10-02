import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import riozLogoWhite from '@/assets/rio-markets-logo-white.png';
import riozLogoBlack from '@/assets/rio-markets-logo-black.png';

const Cookies = () => {
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
                <Cookie className="w-8 h-8" />
                Política de Cookies
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>O que são cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo quando você visita um site. 
                  Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, além de fornecer 
                  informações aos proprietários do site.
                </p>
                <p className="text-muted-foreground">
                  Os cookies podem ser "persistentes" ou "de sessão". Cookies persistentes permanecem no seu dispositivo 
                  entre as sessões de navegação e ajudam a lembrar suas preferências. Cookies de sessão são excluídos 
                  quando você fecha o navegador.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Como usamos cookies?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  A Rio Markets utiliza cookies para diversos propósitos:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Cookies Essenciais</h4>
                    <p className="text-muted-foreground text-sm">
                      Necessários para o funcionamento básico do site. Incluem cookies de autenticação que mantêm você 
                      logado na plataforma e cookies de segurança que protegem contra fraudes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies de Preferências</h4>
                    <p className="text-muted-foreground text-sm">
                      Permitem que o site lembre suas escolhas, como idioma preferido, tema (modo escuro/claro) 
                      e outras configurações de personalização.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies de Análise</h4>
                    <p className="text-muted-foreground text-sm">
                      Ajudam-nos a entender como os visitantes interagem com o site, coletando informações de forma anônima. 
                      Isso nos permite melhorar continuamente a experiência do usuário.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cookies de Funcionalidade</h4>
                    <p className="text-muted-foreground text-sm">
                      Utilizados para fornecer recursos avançados e personalizados, como chat ao vivo, 
                      recomendações de mercados e otimização de performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Cookies de Terceiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Alguns serviços que utilizamos podem definir seus próprios cookies em seu dispositivo:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <strong>Supabase:</strong> Nosso provedor de autenticação e banco de dados utiliza cookies 
                    para gerenciar sessões de usuário de forma segura.
                  </li>
                  <li>
                    <strong>Serviços de Análise:</strong> Utilizamos ferramentas de análise para entender 
                    o comportamento dos usuários e melhorar nossos serviços.
                  </li>
                  <li>
                    <strong>Provedores de Pagamento:</strong> Para processar transações de forma segura, 
                    nossos parceiros de pagamento podem definir cookies próprios.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Gerenciamento de Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Você tem controle total sobre os cookies que aceita:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Configurações do Navegador</h4>
                    <p className="text-muted-foreground text-sm">
                      A maioria dos navegadores permite que você visualize, gerencie e exclua cookies através das 
                      configurações. Você pode configurar seu navegador para recusar todos os cookies ou indicar 
                      quando um cookie está sendo enviado.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Impacto da Recusa</h4>
                    <p className="text-muted-foreground text-sm">
                      Se você optar por desabilitar cookies, algumas funcionalidades do site podem não funcionar 
                      corretamente. Por exemplo, você pode não conseguir permanecer logado na plataforma ou suas 
                      preferências podem não ser salvas entre visitas.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Banner de Consentimento</h4>
                    <p className="text-muted-foreground text-sm">
                      Quando você visita nosso site pela primeira vez, apresentamos um banner de cookies 
                      explicando seu uso. Você pode aceitar ou gerenciar suas preferências através deste banner.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Cookies Específicos Utilizados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-4">Nome</th>
                        <th className="text-left py-2 px-4">Tipo</th>
                        <th className="text-left py-2 px-4">Duração</th>
                        <th className="text-left py-2 px-4">Propósito</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-4">sb-access-token</td>
                        <td className="py-2 px-4">Essencial</td>
                        <td className="py-2 px-4">Sessão</td>
                        <td className="py-2 px-4">Autenticação do usuário</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-4">sb-refresh-token</td>
                        <td className="py-2 px-4">Essencial</td>
                        <td className="py-2 px-4">30 dias</td>
                        <td className="py-2 px-4">Renovação de sessão</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-4">theme</td>
                        <td className="py-2 px-4">Preferência</td>
                        <td className="py-2 px-4">1 ano</td>
                        <td className="py-2 px-4">Tema escolhido (claro/escuro)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-4">compliance-acknowledged</td>
                        <td className="py-2 px-4">Funcionalidade</td>
                        <td className="py-2 px-4">1 ano</td>
                        <td className="py-2 px-4">Banner de compliance</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-4">analytics-id</td>
                        <td className="py-2 px-4">Análise</td>
                        <td className="py-2 px-4">2 anos</td>
                        <td className="py-2 px-4">Análise de uso anônima</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Atualizações desta Política</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Podemos atualizar nossa Política de Cookies periodicamente para refletir mudanças em nossas práticas 
                  ou por outros motivos operacionais, legais ou regulatórios. Recomendamos que você revise esta página 
                  regularmente para se manter informado sobre como usamos cookies.
                </p>
                <p className="text-muted-foreground">
                  Se fizermos alterações substanciais, notificaremos você através de um aviso em nosso site 
                  ou por email (se você for um usuário registrado).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary-glass border-border/50">
              <CardHeader>
                <CardTitle>Mais Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Para saber mais sobre como protegemos seus dados pessoais, consulte nossa{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
                <p className="text-muted-foreground">
                  Se você tiver dúvidas sobre nossa Política de Cookies, entre em contato:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Email: privacy@riomarkets.com</li>
                  <li>DPO: dpo@riomarkets.com</li>
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

export default Cookies;
