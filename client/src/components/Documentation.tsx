import React from 'react';
import { BookOpen, LogIn, Upload, GitMerge, History, BrainCircuit, ShieldCheck, HelpCircle } from 'lucide-react';
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

const Concept = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="border bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2 flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <div className="text-muted-foreground space-y-2 text-sm">
            {children}
        </div>
    </div>
);

export const Documentation: React.FC = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <BookOpen className="h-8 w-8 mr-3" />
            Bem-vindo ao Weavewise
          </CardTitle>
          <CardDescription>
            Seu guia completo para a plataforma de otimização de corte têxtil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            O Weavewise é uma ferramenta inteligente projetada para automatizar e aprimorar o planejamento da etapa de corte na sua produção. Utilizando uma abordagem híbrida, o sistema combina o aprendizado de máquina com um robusto motor de regras para maximizar a altura do enfesto (número de camadas), resultando em maior eficiência, economia de tempo e melhor aproveitamento de recursos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Usar: O Fluxo de Trabalho Ideal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <Step icon={<LogIn className="h-6 w-6" />} title="Passo 1: Autenticação">
            <p>Para começar, crie uma conta ou faça login. Seu acesso é seguro e seus modelos de treinamento são individuais.</p>
          </Step>
          <Step icon={<History className="h-6 w-6" />} title="Passo 2 (Recomendado): Treine seu Modelo">
            <p>Na aba <strong>Treinamento</strong>, você pode fazer o upload de uma planilha Excel (.xlsx) contendo seu histórico de otimizações. Esta planilha precisa ter as colunas <code>Referência</code>, <code>Cor</code>, <code>Tamanho</code>, <code>Qtd</code> e, o mais importante, <code>Qtd_Otimizada</code>.</p>
            <p>O sistema analisará esses dados para aprender a "altura de enfesto" (camadas) ideal para cada conjunto de <code>Referência</code> + <code>Cor</code>. Este passo é crucial para que o Weavewise entenda e replique as melhores decisões da sua equipe.</p>
          </Step>
          <Step icon={<Upload className="h-6 w-6" />} title="Passo 3: Otimize uma Nova Ordem de Corte">
            <p>Vá para a aba <strong>Otimização de Corte</strong> e clique em <strong>"Carregar Arquivo"</strong>. O arquivo para otimização deve conter as colunas: <code>Referência</code>, <code>Cor</code>, <code>Tamanho</code> e <code>Qtd</code>.</p>
            <p>Após o carregamento, o botão mudará para <strong>"Otimizar"</strong>. Antes de clicar, você pode ajustar a <strong>Regra de Tolerância (%)</strong>.</p>
          </Step>
          <Step icon={<GitMerge className="h-6 w-6" />} title="Passo 4: Análise e Download dos Resultados">
            <p>O sistema exibirá os resultados na tabela, mostrando a <code>Qtd Otimizada</code>, a <code>Diferença</code> e o <strong>método usado</strong> para cada otimização. Você poderá então baixar a nova planilha com os dados otimizados.</p>
          </Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conceitos Chave da Otimização</CardTitle>
          <CardDescription>Entenda como o Weavewise pensa para tomar as melhores decisões.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Concept icon={<BrainCircuit className="h-5 w-5" />} title="Abordagem Híbrida: O Melhor de Dois Mundos">
                <p>O Weavewise não depende de uma única estratégia. Ele combina duas abordagens para garantir a melhor otimização:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Modelo de Machine Learning:</strong> Prioriza o conhecimento extraído dos seus dados históricos. Se você treinou um modelo, ele tentará aplicar a mesma lógica que seus analistas usaram no passado.</li>
                    <li><strong>Motor de Regras:</strong> Um conjunto de regras lógicas e heurísticas robustas que entra em ação quando não há um modelo treinado, quando o modelo não tem confiança na sua previsão, ou quando a sugestão do modelo viola a Regra de Tolerância.</li>
                </ul>
            </Concept>

            <Concept icon={<HelpCircle className="h-5 w-5" />} title="Como o Modelo Aprende?">
                <p>Ao treinar o modelo, o Weavewise "memoriza" os padrões de otimização da sua empresa. O processo é o seguinte:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li><strong>Agrupamento:</strong> Ele agrupa os dados históricos por <code>Referência</code> e <code>Cor</code>.</li>
                    <li><strong>Cálculo do MDC:</strong> Para cada grupo, ele calcula o Máximo Divisor Comum (MDC) das `Qtd_Otimizada`. Esse MDC geralmente representa a "altura do enfesto" ou o número de camadas que sua equipe prefere para aquele produto.</li>
                    <li><strong>Cálculo de Confiança:</strong> O sistema avalia a consistência dos dados. Se a `Qtd_Otimizada` para uma mesma referência/cor varia muito no histórico, a confiança será menor. Quanto mais exemplos consistentes, maior a confiança.</li>
                </ol>
                <p className="mt-2">O resultado é um "modelo" que sabe qual altura de enfesto usar para cada produto, e o quão confiante ele está sobre essa decisão.</p>
            </Concept>

            <Concept icon={<ShieldCheck className="h-5 w-5" />} title="O Que Significa 'Regra de Tolerância'?">
                <p>A tolerância é um parâmetro de segurança <strong>essencial</strong>. Ela define a flexibilidade máxima que o algoritmo tem para ajustar as quantidades originais.</p>
                <p>Por exemplo, uma tolerância de <strong>10%</strong> em um item com <code>Qtd</code> de 200 significa que a <code>Qtd_Otimizada</code> não pode ser menor que 180 ou maior que 220.</p>
                <p><strong>Importante:</strong> Esta regra é um limite rígido. O sistema <strong>nunca</strong> a violará, mesmo que a sugestão do modelo treinado seja diferente. Se a sugestão do modelo quebrar a tolerância, o sistema descarta a sugestão e usa o motor de regras para encontrar a melhor otimização possível dentro do limite permitido.</p>
            </Concept>

            <Concept icon={<HelpCircle className="h-5 w-5" />} title="Entendendo o 'Método Usado'">
                <p>A coluna "Método Usado" na tabela de resultados informa qual lógica o Weavewise aplicou para cada grupo de itens:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        <strong>Modelo (Confiança: XX%):</strong>
                        <p className="text-xs">O sistema usou o padrão aprendido do seu histórico de treinamento. A confiança era alta (geralmente acima de 75%), indicando que os dados históricos para este item eram consistentes.</p>
                    </li>
                    <li>
                        <strong>Modelo (Baixa Confiança: XX%):</strong>
                        <p className="text-xs">O sistema ainda usou o padrão aprendido, mas a confiança era baixa. Isso pode acontecer se houver poucos exemplos no histórico ou se as otimizações passadas para este item foram muito inconsistentes. O resultado ainda é baseado nos seus dados, mas vale a pena uma verificação extra.</p>
                    </li>
                    <li>
                        <strong>Regra de Tolerância:</strong>
                        <p className="text-xs">Isso indica que a sugestão do modelo treinado foi descartada porque violaria a tolerância definida. O sistema então usou seu motor de regras interno para encontrar a melhor altura de enfesto que respeitasse o limite de tolerância.</p>
                    </li>
                     <li>
                        <strong>Padrão Global:</strong>
                        <p className="text-xs">O modelo não encontrou um padrão específico para este item, então aplicou a altura de enfesto mais comum encontrada em todos os seus dados de treinamento.</p>
                    </li>
                    <li>
                        <strong>Regras:</strong>
                        <p className="text-xs">Este método é usado quando nenhum modelo foi treinado. A otimização é baseada puramente no motor de regras lógicas do Weavewise, que busca o melhor MDC possível dentro da tolerância.</p>
                    </li>
                </ul>
            </Concept>
        </CardContent>
      </Card>
    </div>
  );
};
