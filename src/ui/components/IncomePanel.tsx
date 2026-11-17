import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MONTH_NAMES_ES, OFFICIAL_LAW_LINKS } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { DeductionMode, TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

export type IncomeMode = 'fixed' | 'variable';

const PRESET_AMOUNTS = [
  { label: '$5M', value: 5_000_000 },
  { label: '$10M', value: 10_000_000 },
  { label: '$15M', value: 15_000_000 },
  { label: '$20M', value: 20_000_000 },
  { label: '$30M', value: 30_000_000 },
];

const INLINE_LAW_IDS = new Set(['ley-2277', 'estatuto-tributario', 'dian-uvt']);

interface IncomePanelProps {
  incomeMode: IncomeMode;
  fixedIncomeText: string;
  monthlyIncomeTexts: string[];
  availableYears: number[];
  selectedYear: number;
  config: TaxYearConfig;
  deductionMode: DeductionMode;
  onChangeMode: (mode: IncomeMode) => void;
  onChangeFixedIncome: (value: string) => void;
  onChangeMonthlyIncome: (monthIndex: number, value: string) => void;
  onCopyJanuaryToAll: () => void;
  onApplyPreset: (amount: number) => void;
  onSelectYear: (year: number) => void;
  onOpenYearModal: () => void;
  onChangeDeductionMode: (mode: DeductionMode) => void;
}

export const IncomePanel: React.FC<IncomePanelProps> = ({
  incomeMode,
  fixedIncomeText,
  monthlyIncomeTexts,
  availableYears,
  selectedYear,
  config,
  deductionMode,
  onChangeMode,
  onChangeFixedIncome,
  onChangeMonthlyIncome,
  onCopyJanuaryToAll,
  onApplyPreset,
  onSelectYear,
  onOpenYearModal,
  onChangeDeductionMode,
}) => {
  const fixedParsed = parseCurrencyInput(fixedIncomeText, { allowZero: true, min: 0 });
  const inlineLaws = OFFICIAL_LAW_LINKS.filter((law) => INLINE_LAW_IDS.has(law.id));

  return (
    <Box
      as="section"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      p={5}
      boxShadow="sm"
      mb={5}
    >
      <Box mb={4}>
        <HStack spacing={2.5} align="center" mb={1}>
          <Badge
            px={2.5}
            py={0.5}
            borderRadius="full"
            bg="bg.accentSoft"
            color="accent.primary"
            borderWidth="1px"
            borderColor="border.accent"
            fontSize="xs"
            fontWeight="bold"
          >
            PASO 1
          </Badge>
          <Heading as="h2" size="sm" color="text.heading">
            Salario, Año Fiscal y Ley Aplicable
          </Heading>
        </HStack>
        <Text fontSize="sm" color="text.muted">
          Ingrese su ingreso bruto, el año gravable y el régimen tributario para proyectar su ahorro
          mensual de renta y PILA.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <SimpleGrid
            columns={2}
            spacing={1}
            p={1}
            bg="bg.input"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="md"
            mb={4}
            role="tablist"
            aria-label="Modo de ingreso"
          >
            <Button
              size="sm"
              role="tab"
              aria-selected={incomeMode === 'fixed'}
              variant="ghost"
              bg={incomeMode === 'fixed' ? 'bg.surface' : 'transparent'}
              color={incomeMode === 'fixed' ? 'accent.primary' : 'text.secondary'}
              boxShadow={incomeMode === 'fixed' ? 'sm' : 'none'}
              _hover={{ bg: 'bg.surface' }}
              onClick={() => onChangeMode('fixed')}
            >
              Ingreso Mensual Fijo
            </Button>
            <Button
              size="sm"
              role="tab"
              aria-selected={incomeMode === 'variable'}
              variant="ghost"
              bg={incomeMode === 'variable' ? 'bg.surface' : 'transparent'}
              color={incomeMode === 'variable' ? 'accent.primary' : 'text.secondary'}
              boxShadow={incomeMode === 'variable' ? 'sm' : 'none'}
              _hover={{ bg: 'bg.surface' }}
              onClick={() => onChangeMode('variable')}
            >
              Ingresos Mes a Mes
            </Button>
          </SimpleGrid>

          {incomeMode === 'fixed' ? (
            <FormControl mb={3} isInvalid={fixedParsed.value === null}>
              <Flex justify="space-between" align="baseline" gap={2} mb={1}>
                <FormLabel htmlFor="fixed-income-input" fontSize="sm" fontWeight="semibold" mb={0}>
                  Salario / Ingreso Bruto Mensual (COP)
                </FormLabel>
                <Text fontSize="xs" color="text.muted">
                  Ej: 15.000.000
                </Text>
              </Flex>
              <Input
                id="fixed-income-input"
                bg={fixedParsed.value === null ? 'bg.dangerSoft' : 'bg.input'}
                borderColor={fixedParsed.value === null ? 'accent.danger' : 'border.subtle'}
                color="text.primary"
                _focus={{ borderColor: 'accent.primary', boxShadow: 'outline' }}
                type="text"
                inputMode="numeric"
                value={fixedIncomeText}
                onChange={(e) => onChangeFixedIncome(e.target.value)}
                placeholder="15.000.000"
              />
              {fixedParsed.value === null ? (
                <Text fontSize="xs" color="accent.danger" fontWeight="medium" mt={1}>
                  {fixedParsed.error ?? 'Valor numérico inválido'}
                </Text>
              ) : (
                <Text fontSize="xs" color="text.secondary" mt={1}>
                  Mensual: {formatCOP(fixedParsed.value)} · Anual (×12):{' '}
                  {formatCOP(fixedParsed.value * 12)}
                </Text>
              )}
            </FormControl>
          ) : (
            <Box mb={3}>
              <Flex justify="space-between" align="center" gap={2} mb={2.5}>
                <Text fontSize="xs" color="text.muted">
                  También puede editar cada mes en la tabla inferior.
                </Text>
                <Button
                  size="xs"
                  bg="bg.surface"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  color="text.primary"
                  _hover={{ borderColor: 'border.accent' }}
                  onClick={onCopyJanuaryToAll}
                >
                  Copiar Enero a todos
                </Button>
              </Flex>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2.5}>
                {MONTH_NAMES_ES.map((monthName, idx) => {
                  const raw = monthlyIncomeTexts[idx] ?? '0';
                  const parsed = parseCurrencyInput(raw, { allowZero: true, min: 0 });
                  return (
                    <FormControl key={monthName} isInvalid={parsed.value === null}>
                      <FormLabel
                        htmlFor={`month-income-${idx}`}
                        fontSize="xs"
                        fontWeight="semibold"
                        mb={1}
                      >
                        {monthName}
                      </FormLabel>
                      <Input
                        id={`month-income-${idx}`}
                        size="sm"
                        bg={parsed.value === null ? 'bg.dangerSoft' : 'bg.input'}
                        borderColor={parsed.value === null ? 'accent.danger' : 'border.subtle'}
                        color="text.primary"
                        type="text"
                        inputMode="numeric"
                        value={raw}
                        onChange={(e) => onChangeMonthlyIncome(idx, e.target.value)}
                        placeholder="0"
                      />
                      {parsed.value === null && (
                        <Text fontSize="xs" color="accent.danger" mt={0.5}>
                          {parsed.error ?? 'Valor inválido'}
                        </Text>
                      )}
                    </FormControl>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}

          <Box pt={1}>
            <Text fontSize="xs" color="text.muted" mb={1.5}>
              {incomeMode === 'fixed'
                ? 'Atajos rápidos mensuales:'
                : 'Aplicar valor a los 12 meses:'}
            </Text>
            <HStack spacing={1.5} wrap="wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset.value}
                  size="xs"
                  borderRadius="full"
                  bg="bg.input"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  color="text.secondary"
                  _hover={{
                    borderColor: 'accent.primary',
                    color: 'accent.primary',
                    bg: 'bg.accentSoft',
                  }}
                  onClick={() => onApplyPreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </HStack>
          </Box>
        </Box>

        <VStack
          align="stretch"
          spacing={4}
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <FormControl>
            <Flex justify="space-between" align="baseline" gap={2} mb={1}>
              <FormLabel htmlFor="step1-year-select" fontSize="sm" fontWeight="semibold" mb={0}>
                Año Fiscal
              </FormLabel>
              <Text fontSize="xs" color="text.muted">
                UVT {formatCOP(config.uvt)} · SMMLV {formatCOP(config.minimumWage)}
              </Text>
            </Flex>
            <HStack spacing={2}>
              <Select
                id="step1-year-select"
                bg="bg.input"
                borderColor="border.subtle"
                color="text.primary"
                value={selectedYear}
                onChange={(e) => onSelectYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Año Gravable {yr}
                  </option>
                ))}
              </Select>
              <Button
                flexShrink={0}
                bg="bg.surface"
                borderWidth="1px"
                borderColor="border.subtle"
                color="text.primary"
                _hover={{ borderColor: 'border.accent', color: 'accent.primary' }}
                onClick={onOpenYearModal}
              >
                + Personalizar Año
              </Button>
            </HStack>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="step1-law-select" fontSize="sm" fontWeight="semibold" mb={1}>
              Normativa / Ley y Régimen Aplicable
            </FormLabel>
            <Select
              id="step1-law-select"
              bg="bg.input"
              borderColor="border.subtle"
              color="text.primary"
              value={deductionMode}
              onChange={(e) => onChangeDeductionMode(e.target.value as DeductionMode)}
            >
              <option value="auto">Ley 2277 de 2022 — Automático (Recomendado)</option>
              <option value="exempt25">Ley 2277 — Renta Exenta 25% (Art. 206)</option>
              <option value="actualCosts">Ley 2277 — Costos y Gastos Reales (Art. 336)</option>
              <option value="legacyPresumptive">Clásico — 25% Presuntivo</option>
            </Select>

            {config.normativeRef && (
              <Text fontSize="xs" color="text.secondary" mt={2}>
                <Text as="strong" color="text.heading">
                  Referencia {selectedYear}:
                </Text>{' '}
                {config.normativeRef}
              </Text>
            )}

            <HStack spacing={2} wrap="wrap" mt={2.5} aria-label="Enlaces directos a la normativa">
              {inlineLaws.map((law) => (
                <Link
                  key={law.id}
                  href={law.url}
                  isExternal
                  px={2.5}
                  py={1}
                  borderRadius="md"
                  bg="bg.accentSoft"
                  borderWidth="1px"
                  borderColor="border.accent"
                  color="accent.primary"
                  fontSize="xs"
                  fontWeight="semibold"
                  title={law.description}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {law.shortLabel} ↗
                </Link>
              ))}
            </HStack>
          </FormControl>
        </VStack>
      </SimpleGrid>
    </Box>
  );
};
