import React from 'react';
import { BookOpen, LogIn, Upload, BarChart, Save, History, GitMerge } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-background rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <BookOpen className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-2xl font-bold text-foreground">Documentação do Weavewise</h1>
        </div>

        {/* Seção de Introdução */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-primary mb-3">
              Bem-vindo ao Weavewise
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O Weavewise é uma plataforma de otimização têxtil projetada para simplificar e aprimorar o planejamento da etapa de corte na sua produção. Utilizando uma abordagem híbrida, o sistema combina o aprendizado de dados históricos com um robusto motor de regras para maximizar a altura do enfesto, resultando em maior eficiência e melhor aproveitamento do tempo e dos recursos.
              <br /><br />
              Esta documentação serve como um guia completo para você utilizar todas as funcionalidades da ferramenta.
            </p>
          </div>
        </div>

        {/* Como Usar o Weavewise */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Como Usar o Weavewise: Passo a Passo</h2>
          <div className="space-y-6">
            {/* Passo 1 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <LogIn className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 1: Autenticação</h3>
                <p className="mt-1 text-muted-foreground">
                  Para começar, crie uma conta ou faça login. O acesso é seguro e individual.
                </p>
              </div>
            </div>
             {/* Passo 2 */}
             <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <History className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 2 (Opcional): Treinamento do Modelo</h3>
                <p className="mt-1 text-muted-foreground">
                  Na aba <strong>Treinamento</strong>, você pode fazer o upload de uma planilha Excel contendo seu histórico de otimizações (incluindo uma coluna `Qtd_Otimizada`). O sistema aprenderá a "altura de enfesto" ideal para cada grupo de `Referência` + `Cor` a partir desses dados. Este passo é opcional; se nenhum modelo for treinado, o sistema usará apenas o motor de regras.
                </p>
              </div>
            </div>
            {/* Passo 3 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 3: Upload dos Dados para Otimização</h3>
                <p className="mt-1 text-muted-foreground">
                  Na aba <strong>Otimização de Corte</strong>, clique em <strong>"Upload Excel"</strong>. O arquivo precisa conter as colunas: <code>Referência</code>, <code>Cor</code>, <code>Tamanho</code> e <code>Qtd</code>.
                </p>
              </div>
            </div>
            {/* Passo 4 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <GitMerge className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 4: Otimização Híbrida</h3>
                <p className="mt-1 text-muted-foreground">
                  Ajuste a <strong>Tolerância (%)</strong> e clique em <strong>"Otimizar"</strong>. O sistema seguirá a abordagem híbrida:
                  <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    <li><strong>Primeiro, tenta usar o modelo treinado.</strong> Se ele aprendeu uma altura para o grupo e essa altura respeita a tolerância, ela será usada.</li>
                    <li><strong>Se não, usa o motor de regras.</strong> Se não houver padrão aprendido ou se o padrão violar a tolerância, o sistema calcula dinamicamente a melhor altura de enfesto possível para os dados atuais.</li>
                  </ul>
                </p>
              </div>
            </div>
            {/* Passo 5 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <Save className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 5: Salvar os Resultados</h3>
                <p className="mt-1 text-muted-foreground">
                  Revise os dados na tabela de resultados e clique em <strong>"Salvar"</strong> para baixar uma nova planilha Excel com as quantidades otimizadas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Conceitos Chave */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Conceitos Chave</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Abordagem de Otimização Híbrida</h3>
              <p className="text-muted-foreground">
                O Weavewise combina duas estratégias para garantir a melhor otimização possível. Ele prioriza o conhecimento extraído dos seus dados históricos (modelo treinado), mas possui um motor de regras robusto para lidar com cenários novos ou exceções, garantindo sempre uma otimização inteligente e segura.
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Tolerância de Otimização</h3>
              <p className="text-muted-foreground">
                Este parâmetro é crucial, pois define a flexibilidade que o algoritmo tem para ajustar as quantidades. Uma tolerância de <strong>10%</strong>, por exemplo, significa que a <code>Qtd_Otimizada</code> de um item não pode ser mais do que 10% maior ou menor que sua <code>Qtd</code> original. A tolerância é um limite rígido tanto para as sugestões do modelo quanto para o motor de regras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};