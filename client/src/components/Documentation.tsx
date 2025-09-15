import React from 'react';
import { BookOpen, LogIn, Upload, GitMerge, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Step = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-1 text-muted-foreground space-y-2">{children}</div>
    </div>
  </div>
);

export const Documentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            Bem-vindo ao Weavewise
          </CardTitle>
          <CardDescription>
            Guia completo para a plataforma de otimização têxtil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            O Weavewise é uma ferramenta projetada para simplificar e aprimorar o planejamento da etapa de corte na sua produção. Utilizando uma abordagem híbrida, o sistema combina o aprendizado de dados históricos com um robusto motor de regras para maximizar a altura do enfesto, resultando em maior eficiência e melhor aproveitamento do tempo e dos recursos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Usar: Passo a Passo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <Step icon={<LogIn className="h-6 w-6" />} title="Passo 1: Autenticação">
            <p>Para começar, crie uma conta ou faça login. O acesso é seguro e individual.</p>
          </Step>
          <Step icon={<History className="h-6 w-6" />} title="Passo 2 (Opcional mas recomendado): Treinamento do Modelo">
            <p>Na aba <strong>Treinamento</strong>, você pode fazer o upload de uma planilha Excel contendo seu histórico de otimizações (incluindo uma coluna `Qtd_Otimizada`).</p>
            <p>O sistema aprenderá a "altura de enfesto" ideal para cada grupo de `Referência` + `Cor` a partir desses dados. Este passo é opcional; se nenhum modelo for treinado, o sistema usará apenas o motor de regras.</p>
          </Step>
          <Step icon={<Upload className="h-6 w-6" />} title="Passo 3: Otimização de Corte">
            <p>Na aba <strong>Otimização de Corte</strong>, use o botão dinâmico para <strong>"Carregar Arquivo"</strong>. O arquivo precisa conter as colunas: <code>Referência</code>, <code>Cor</code>, <code>Tamanho</code> e <code>Qtd</code>.</p>
            <p>Após carregar, o botão mudará para <strong>"Otimizar"</strong>. Ajuste a <strong>Tolerância (%)</strong> e clique para executar.</p>
          </Step>
          <Step icon={<GitMerge className="h-6 w-6" />} title="Passo 4: Análise e Download">
            <p>O sistema exibirá os resultados na tabela, indicando o método usado para cada otimização (se usou o modelo treinado ou uma regra). Você poderá então baixar a nova planilha com os dados otimizados diretamente da sua interface de sistema operacional ao "imprimir" a página ou salvando como PDF.</p>
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conceitos Chave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Abordagem de Otimização Híbrida</h3>
            <p className="text-muted-foreground">
              O Weavewise combina duas estratégias para garantir a melhor otimização possível. Ele prioriza o conhecimento extraído dos seus dados históricos (modelo treinado com índice de confiança), mas possui um motor de regras robusto para lidar com cenários novos ou exceções, garantindo sempre uma otimização inteligente e segura.
            </p>
          </div>
          <div className="border bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Tolerância de Otimização</h3>
            <p className="text-muted-foreground">
              Este parâmetro é crucial, pois define a flexibilidade que o algoritmo tem para ajustar as quantidades. Uma tolerância de <strong>10%</strong>, por exemplo, significa que a <code>Qtd_Otimizada</code> de um item não pode ser mais do que 10% maior ou menor que sua <code>Qtd</code> original. A tolerância é um limite rígido que o sistema sempre respeitará, mesmo ao usar as regras do modelo treinado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
