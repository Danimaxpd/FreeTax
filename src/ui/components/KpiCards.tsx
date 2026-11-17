import React from 'react';
import { Box, Progress, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { AnnualTaxPlan, TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface KpiCardsProps {
  plan: AnnualTaxPlan;
  config: TaxYearConfig;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ plan, config }) => {
  const avgMonthlyTaxSave = plan.netAnnualTaxToSave / 12;
  const avgMonthlyPila = plan.annualPilaTotal / 12;
  const avgMonthlyNetSpendable = plan.annualNetSpendableIncome / 12;

  const activeMonths = plan.months.filter((m) => m.grossIncome > 0);
  const avgIbc =
    activeMonths.length > 0
      ? activeMonths.reduce((acc, m) => acc + m.ibc, 0) / activeMonths.length
      : 0;

  const ibcMaxSmmlv = config.caps?.ibcMaxSmmlv ?? 25;
  const maxIbc = config.minimumWage * ibcMaxSmmlv;
  const ibcBaseRate = config.contributions.health.base;

  const hitsMaxCap = activeMonths.some(
    (m) => m.ibc >= maxIbc - 1 && m.grossIncome * ibcBaseRate > maxIbc,
  );
  const hitsMinFloor = activeMonths.some(
    (m) => m.ibc <= config.minimumWage + 1 && m.grossIncome * ibcBaseRate < config.minimumWage,
  );

  let ibcStatusLabel = `IBC prom: ${formatCOP(avgIbc)}`;
  if (hitsMaxCap) {
    ibcStatusLabel = `Tope ${ibcMaxSmmlv} SMMLV activo (${formatCOP(maxIbc)})`;
  } else if (hitsMinFloor) {
    ibcStatusLabel = `Piso 1 SMMLV activo (${formatCOP(config.minimumWage)})`;
  }

  const regime = plan.selectedRegime;
  const globalCapPct =
    regime.globalCapLimit > 0
      ? Math.min(100, (regime.totalSubjectToGlobalCap / regime.globalCapLimit) * 100)
      : 0;
  const isCapExceeded = regime.totalSubjectToGlobalCap > regime.globalCapLimit + 1;

  return (
    <SimpleGrid
      as="section"
      aria-label="Indicadores principales"
      columns={{ base: 1, md: 2, xl: 4 }}
      spacing={3.5}
      mb={5}
    >
      <VStack
        as="article"
        align="stretch"
        spacing={1.5}
        bg="bg.accentSoft"
        borderWidth="1px"
        borderColor="border.accent"
        borderRadius="xl"
        p={4}
        boxShadow="sm"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.03em"
          color="text.muted"
        >
          Ahorro Mensual Recomendado (Renta)
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="accent.primary">
          {formatCOP(avgMonthlyTaxSave)}
        </Text>
        <Text fontSize="xs" color="text.secondary">
          Por ahorrar en el año:{' '}
          <Text as="strong" color="text.heading">
            {formatCOP(plan.netAnnualTaxToSave)}
          </Text>
          {plan.withholdingsPaidAnnual > 0
            ? ` (Impuesto ${formatCOP(plan.annualTaxTotal)} − Retefuente ${formatCOP(plan.withholdingsPaidAnnual)})`
            : ''}
        </Text>
      </VStack>

      <VStack
        as="article"
        align="stretch"
        spacing={1.5}
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        p={4}
        boxShadow="sm"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.03em"
          color="text.muted"
        >
          Pago Mensual PILA (Seguridad Social)
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="text.heading">
          {formatCOP(avgMonthlyPila)}
        </Text>
        <Text fontSize="xs" color="text.secondary">
          Anual: {formatCOP(plan.annualPilaTotal)} · {ibcStatusLabel}
        </Text>
      </VStack>

      <VStack
        as="article"
        align="stretch"
        spacing={1.5}
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        p={4}
        boxShadow="sm"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.03em"
          color="text.muted"
        >
          Ingreso Neto Disponible (Promedio)
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="accent.success">
          {formatCOP(avgMonthlyNetSpendable)}
        </Text>
        <Text fontSize="xs" color="text.secondary">
          Anual libre tras PILA y ahorro renta: {formatCOP(plan.annualNetSpendableIncome)}
        </Text>
      </VStack>

      <VStack
        as="article"
        align="stretch"
        spacing={1.5}
        bg="bg.surface"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        p={4}
        boxShadow="sm"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.03em"
          color="text.muted"
        >
          Tasa Efectiva Renta y Límite Ley 2277
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="text.heading">
          {plan.effectiveTaxRate.toFixed(2)}%
        </Text>
        <Text fontSize="xs" color="text.secondary">
          Uso tope 40% / 1.340 UVT: {formatCOP(regime.appliedCappedDeductions)} /{' '}
          {formatCOP(regime.globalCapLimit)} ({globalCapPct.toFixed(0)}%)
          {isCapExceeded ? ' · Tope alcanzado' : ''}
        </Text>
        <Box pt={1}>
          <Progress
            value={globalCapPct}
            size="sm"
            borderRadius="full"
            bg="bg.subtle"
            colorScheme={isCapExceeded ? 'orange' : 'blue'}
            aria-label="Porcentaje de uso del límite global Ley 2277"
          />
        </Box>
      </VStack>
    </SimpleGrid>
  );
};
