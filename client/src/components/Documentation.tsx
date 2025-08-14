import React from 'react';
import { BookOpen } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Documentação</h1>
        </div>

        {/* Seção de Introdução */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Bem-vindo ao Weavewise
            </h2>
            <p className="text-blue-800 leading-relaxed">
              O Weavewise é uma plataforma inteligente de otimização têxtil desenvolvida para automatizar e aprimorar o planejamento de produção em ambientes industriais. Utilizando algoritmos de inteligência artificial e machine learning, o sistema ajusta automaticamente as quantidades de corte para reduzir repetições no enfesto, aumentar a eficiência e garantir maior aproveitamento dos recursos.

Esta documentação apresenta todos os recursos do sistema, com foco em sua aplicação prática no contexto fabril.
            </p>
          </div>
        </div>

        {/* Seção de Conceitos Técnicos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conceitos Técnicos</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Otimização de Enfesto</h3>
              <p className="text-gray-600">
               O enfesto é o processo de empilhamento de tecidos em camadas sobre uma mesa de corte, com o objetivo de realizar cortes simultâneos de múltiplas peças. O Weavewise analisa os dados de produção e ajusta as quantidades de cada tamanho por referência e cor, buscando:

Reduzir o número total de repetições,

Padronizar camadas por enfesto,

Aproveitar múltiplos viáveis (de 2 e 3) que otimizam o tempo de corte sem comprometer o plano de produção.

O resultado é um plano de corte mais enxuto, com melhor rendimento e menor tempo de execução.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Treinamento de Modelo</h3>
              <p className="text-gray-600">
                O sistema é alimentado por um histórico robusto de decisões tomadas por analistas experientes em PCP. A partir desses dados, o modelo de machine learning aprende padrões recorrentes de ajuste por tipo de produto, faixa etária, curva de tamanhos e composição do tecido.

Esses padrões são usados para sugerir automaticamente:

Quantidades otimizadas por item,

Camadas e repetições ideais por enfesto,

Agrupamentos eficientes de cores compatíveis.

Com o tempo, o sistema se torna mais personalizado e preciso para a realidade da sua produção.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tolerância de Otimização</h3>
              <p className="text-gray-600">
                A tolerância de otimização é o parâmetro que define o quanto o sistema pode ajustar as quantidades em relação aos valores originais da OP (ordem de produção). Essa tolerância pode ser configurada conforme o nível de flexibilidade desejado:

Tolerância baixa (ex: ±5%) → mantém fidelidade ao plano original, com ajustes mínimos.

Tolerância moderada (ex: ±10%) → permite ajustes mais amplos para reduzir repetições sem grandes desvios.

Tolerância alta (ex: ±15% ou mais) → maximiza a eficiência do corte, priorizando rendimento sobre precisão.

Esse controle dá ao analista liberdade para definir o equilíbrio ideal entre produtividade e aderência à meta de produção.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};