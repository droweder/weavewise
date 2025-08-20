import React from 'react';
import { BookOpen, LogIn, Upload, BarChart, Save, History } from 'lucide-react';

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
              O Weavewise é uma plataforma de otimização têxtil projetada para simplificar e aprimorar o planejamento da etapa de corte na sua produção. O sistema ajusta as quantidades de peças para maximizar a altura do enfesto, resultando em maior eficiência e melhor aproveitamento do tempo e dos recursos.
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
                  Para começar, crie uma conta ou faça login. O acesso é seguro e individual, garantindo que seus dados de produção permaneçam confidenciais.
                </p>
              </div>
            </div>
            {/* Passo 2 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 2: Upload dos Dados</h3>
                <p className="mt-1 text-muted-foreground">
                  Na aba <strong>Otimização de Corte</strong>, clique em <strong>"Upload Excel"</strong>. O arquivo precisa conter as colunas: <code>Referência</code>, <code>Cor</code>, <code>Tamanho</code> e <code>Qtd</code>. O sistema irá ler a planilha e exibir os dados originais.
                </p>
              </div>
            </div>
            {/* Passo 3 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <BarChart className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 3: Otimização</h3>
                <p className="mt-1 text-muted-foreground">
                  Ajuste a <strong>Tolerância (%)</strong> para definir o quanto as quantidades podem variar. Em seguida, clique em <strong>"Otimizar"</strong>. O sistema analisará cada grupo de <code>Referência</code> + <code>Cor</code> e calculará a maior altura de enfesto possível, ajustando as quantidades para o múltiplo mais próximo, sempre respeitando a tolerância definida.
                </p>
              </div>
            </div>
            {/* Passo 4 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <Save className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 4: Salvar os Resultados</h3>
                <p className="mt-1 text-muted-foreground">
                  Após a otimização, os resultados são exibidos em uma nova tabela. Revise os dados otimizados e, se estiverem de acordo, clique em <strong>"Salvar"</strong> para baixar uma nova planilha Excel com as quantidades originais e otimizadas.
                </p>
              </div>
            </div>
            {/* Passo 5 */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground">
                  <History className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-foreground">Passo 5: Aba de Treinamento</h3>
                <p className="mt-1 text-muted-foreground">
                  A aba <strong>Treinamento</strong> permite visualizar o histórico de modelos de machine learning que foram treinados. Embora a otimização principal seja baseada em regras, esta seção pode ser usada para experimentação e futuras implementações de IA.
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
              <h3 className="font-semibold text-foreground mb-2">Otimização de Enfesto</h3>
              <p className="text-muted-foreground">
                O objetivo da otimização é encontrar a <strong>maior altura de enfesto (divisor comum)</strong> possível para um grupo de itens da mesma referência e cor. O algoritmo testa alturas de enfesto comuns na indústria (como 24, 36, 48, etc.) e calcula o ajuste necessário nas quantidades originais. A maior altura que se encaixa na tolerância de todos os itens do grupo é escolhida, e as quantidades são ajustadas para o múltiplo mais próximo dessa altura.
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Tolerância de Otimização</h3>
              <p className="text-muted-foreground">
                Este parâmetro define a flexibilidade que o algoritmo tem para ajustar as quantidades. Uma tolerância de <strong>10%</strong>, por exemplo, significa que a <code>Qtd_Otimizada</code> de um item não pode ser mais do que 10% maior ou menor que sua <code>Qtd</code> original.
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Treinamento de Modelo</h3>
              <p className="text-muted-foreground">
                Esta funcionalidade permite treinar um modelo de machine learning com dados históricos de otimizações. Embora o algoritmo principal atual seja determinístico (baseado em regras), o modelo treinado pode ser usado no futuro para sugerir otimizações ainda mais personalizadas ou identificar padrões complexos que as regras não cobrem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};