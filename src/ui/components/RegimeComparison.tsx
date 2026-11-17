import React from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AnnualTaxPlan, RegimeCalculationSummary } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface RegimeComparisonProps {
  plan: AnnualTaxPlan;
  onSelectMode: (mode: 'exempt25' | 'actualCosts' | 'legacyPresumptive') => void;
}

function formatRatePercent(effectiveTaxRate: number): string {
  return `${effectiveTaxRate.toFixed(2)}%`;
}

export const RegimeComparison: React.FC<RegimeComparisonProps> = ({ plan, onSelectMode }) => {
  const regimes: RegimeCalculationSummary[] = [
    plan.comparison.exempt25,
    plan.comparison.actualCosts,
    plan.comparison.legacyPresumptive,
  ];

  const selected = plan.selectedRegime;
  const exemptTax = plan.comparison.exempt25.annualTaxCop;
  const actualTax = plan.comparison.actualCosts.annualTaxCop;
  const diff = Math.abs(exemptTax - actualTax);

  const summaryRows: Array<{ label: string; value: string; emphasize?: boolean }> = [
    { label: 'Ingresos Brutos Anuales', value: formatCOP(selected.grossAnnualIncome) },
    { label: '(-) INCRGO (Salud + Pensión + FSP)', value: formatCOP(selected.incrgoAnnual) },
    { label: '(=) Ingresos Netos', value: formatCOP(selected.netIncomeAnnual) },
    {
      label: '(-) Costos y Gastos Procedentes',
      value: formatCOP(selected.costsAndExpensesAnnual),
    },
    {
      label: 'Deducciones Imputables (Dep/Salud/Viv/GMF)',
      value: formatCOP(selected.imputableDeductionsAnnual),
    },
    {
      label: 'Rentas Exentas Voluntarias (FPV / AFC)',
      value: formatCOP(selected.voluntaryExemptionsAnnual),
    },
    { label: 'Renta Exenta 25% (Tope 790 UVT)', value: formatCOP(selected.exempt25Annual) },
    {
      label: 'Aplicado bajo Límite Global (40% / 1.340 UVT)',
      value: `${formatCOP(selected.appliedCappedDeductions)} / ${formatCOP(selected.globalCapLimit)}`,
    },
    {
      label: '(-) Deducciones Fuera de Tope (72 UVT Dep + 1% FE)',
      value: formatCOP(selected.outOfCapDeductionsAnnual),
    },
    {
      label: '(=) Renta Líquida Gravable (Art. 241 ET)',
      value: `${formatCOP(selected.taxableIncomeAnnual)} (${selected.taxableIncomeUvt.toFixed(1)} UVT)`,
      emphasize: true,
    },
  ];

  return (
    <Box
      as="section"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
    >
      <Box mb={4}>
        <Heading as="h2" size="sm" color="text.heading" mb={1}>
          Comparativo de Regímenes y Depuración Ley 2277
        </Heading>
        <Text fontSize="xs" color="text.secondary">
          Comparación automática entre Renta Exenta 25% (Art. 206) y Costos y Gastos Reales (Art.
          336). Haga clic en una tarjeta para simular ese régimen.
        </Text>
      </Box>

      {plan.taxSavedByRecommended > 0 && (
        <Alert
          status="success"
          variant="subtle"
          bg="bg.successSoft"
          borderWidth="1px"
          borderColor="border.success"
          borderRadius="lg"
          mb={4}
          fontSize="xs"
          color="text.primary"
        >
          <AlertIcon color="accent.success" />
          <Box>
            <Text as="span" fontWeight="bold">
              Optimización recomendada:{' '}
            </Text>
            El régimen{' '}
            <Text as="span" fontWeight="bold" color="accent.success">
              {plan.recommendedMode === 'exempt25'
                ? 'Renta Exenta 25% (Art. 206)'
                : 'Costos y Gastos Reales (Art. 336)'}
            </Text>{' '}
            ahorra{' '}
            <Text as="span" fontWeight="bold">
              {formatCOP(diff)}
            </Text>{' '}
            al año frente a la otra opción Ley 2277.
          </Box>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
        {regimes.map((reg) => {
          const isSelected = plan.selectedMode === reg.mode;
          const isRecommended = plan.recommendedMode === reg.mode;

          let cardBg = 'bg.subtle';
          let cardBorder = 'border.subtle';
          if (isSelected) {
            cardBg = 'bg.accentSoft';
            cardBorder = 'border.accent';
          } else if (isRecommended) {
            cardBg = 'bg.successSoft';
            cardBorder = 'border.success';
          }

          return (
            <Box
              key={reg.mode}
              role="button"
              tabIndex={0}
              onClick={() => onSelectMode(reg.mode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode(reg.mode);
                }
              }}
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              borderRadius="lg"
              p={3.5}
              cursor="pointer"
              transition="border-color 0.15s ease, transform 0.15s ease"
              _hover={{ borderColor: 'accent.primary', transform: 'translateY(-1px)' }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'accent.primary' }}
            >
              <VStack align="stretch" spacing={1.5}>
                <HStack spacing={1.5} wrap="wrap" minH="20px">
                  {isRecommended && (
                    <Badge
                      bg="bg.successSoft"
                      color="accent.success"
                      borderWidth="1px"
                      borderColor="border.success"
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      Recomendado
                    </Badge>
                  )}
                  {isSelected && (
                    <Badge
                      bg="bg.accentSoft"
                      color="accent.primary"
                      borderWidth="1px"
                      borderColor="border.accent"
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      Activo
                    </Badge>
                  )}
                  {reg.mode === 'legacyPresumptive' && (
                    <Badge
                      bg="bg.surface"
                      color="text.muted"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      fontSize="2xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      Referencia
                    </Badge>
                  )}
                </HStack>

                <Text fontSize="xs" fontWeight="bold" color="text.heading" noOfLines={2}>
                  {reg.label}
                </Text>

                <Text fontSize="xl" fontWeight="extrabold" color="text.heading" lineHeight="short">
                  {formatCOP(reg.annualTaxCop)}
                </Text>

                <Text fontSize="xs" color="text.secondary">
                  Base gravable: {formatCOP(reg.taxableIncomeAnnual)} (
                  {reg.taxableIncomeUvt.toFixed(1)} UVT)
                </Text>

                <Text fontSize="xs" color="text.muted">
                  Tasa efectiva: {formatRatePercent(reg.effectiveTaxRate)} · Impuesto:{' '}
                  {reg.annualTaxUvt.toFixed(1)} UVT
                </Text>
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>

      <Divider my={4} borderColor="border.subtle" />

      <Box>
        <Heading as="h3" size="xs" color="text.heading" mb={2.5}>
          Detalle de Depuración Anual — {selected.label}
        </Heading>

        <VStack
          spacing={0}
          align="stretch"
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="lg"
          overflow="hidden"
        >
          {summaryRows.map((row, idx) => (
            <Flex
              key={row.label}
              justify="space-between"
              align="center"
              gap={3}
              px={3.5}
              py={2}
              borderTopWidth={idx === 0 ? '0px' : '1px'}
              borderColor="border.subtle"
              bg={row.emphasize ? 'bg.accentSoft' : 'transparent'}
            >
              <Text
                fontSize="xs"
                color={row.emphasize ? 'text.heading' : 'text.secondary'}
                fontWeight={row.emphasize ? 'bold' : 'normal'}
              >
                {row.label}
              </Text>
              <Text
                fontSize="xs"
                color={row.emphasize ? 'accent.primary' : 'text.primary'}
                fontWeight={row.emphasize ? 'bold' : 'semibold'}
                textAlign="right"
                whiteSpace="nowrap"
              >
                {row.value}
              </Text>
            </Flex>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};
