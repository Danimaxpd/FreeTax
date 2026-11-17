import React from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ARL_RISK_LEVELS } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { DeductionMode, TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

export interface DeductionFormState {
  deductionMode: DeductionMode;
  dependentsCount: string;
  prepaidHealthPeriod: 'annual' | 'monthly';
  prepaidHealthText: string;
  housingInterestText: string;
  voluntaryPensionText: string;
  actualCostsText: string;
  electronicInvoicePurchasesText: string;
  gmfText: string;
  arlRate: string;
  withholdingsPaidText: string;
}

interface DeductionsPanelProps {
  form: DeductionFormState;
  config: TaxYearConfig;
  onChange: <K extends keyof DeductionFormState>(key: K, value: DeductionFormState[K]) => void;
}

interface CurrencyFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder = '0',
}) => {
  const parsed = parseCurrencyInput(value, { allowZero: true, min: 0 });
  const hasError = parsed.value === null;

  return (
    <FormControl isInvalid={hasError}>
      <Flex justify="space-between" align="baseline" gap={2} mb={1} wrap="wrap">
        <FormLabel htmlFor={id} mb={0} fontSize="xs" fontWeight="semibold" color="text.primary">
          {label}
        </FormLabel>
        <Text fontSize="xs" color="text.muted">
          {hint}
        </Text>
      </Flex>
      <Input
        id={id}
        size="sm"
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        bg="bg.input"
        color="text.primary"
        borderColor={hasError ? 'accent.danger' : 'border.strong'}
        _hover={{ borderColor: hasError ? 'accent.danger' : 'border.accent' }}
        _focusVisible={{
          borderColor: hasError ? 'accent.danger' : 'accent.primary',
          boxShadow: 'none',
        }}
        borderRadius="md"
      />
      {hasError && (
        <Text mt={1} fontSize="xs" color="accent.danger">
          {parsed.error ?? 'Valor numérico inválido'}
        </Text>
      )}
      {parsed.value !== null && parsed.value > 0 && (
        <Text mt={1} fontSize="xs" color="text.secondary">
          {formatCOP(parsed.value)}
        </Text>
      )}
    </FormControl>
  );
};

export const DeductionsPanel: React.FC<DeductionsPanelProps> = ({ form, config, onChange }) => {
  const { uvt } = config;

  const dependentsNum = Number.parseInt(form.dependentsCount, 10);
  const dependentsValid =
    form.dependentsCount.trim() !== '' &&
    !Number.isNaN(dependentsNum) &&
    dependentsNum >= 0 &&
    dependentsNum <= 20;

  const extraDepsCount = dependentsValid ? Math.min(dependentsNum, 4) : 0;

  const prepaidParsed = parseCurrencyInput(form.prepaidHealthText, { allowZero: true, min: 0 });
  const prepaidHasError = prepaidParsed.value === null;
  const prepaidMultiplier = form.prepaidHealthPeriod === 'monthly' ? 12 : 1;
  const prepaidAnnualEquivalent =
    prepaidParsed.value !== null ? prepaidParsed.value * prepaidMultiplier : 0;

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
          2. Deducciones Ley 2277 y Régimen
        </Heading>
        <Text fontSize="xs" color="text.secondary">
          Configure sus beneficios tributarios, costos reales, ARL y retenciones practicadas.
        </Text>
      </Box>

      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel
            htmlFor="deduction-mode-select"
            fontSize="xs"
            fontWeight="semibold"
            color="text.primary"
            mb={1}
          >
            Modo de Depuración / Régimen
          </FormLabel>
          <Select
            id="deduction-mode-select"
            size="sm"
            value={form.deductionMode}
            onChange={(e) => onChange('deductionMode', e.target.value as DeductionMode)}
            bg="bg.input"
            color="text.primary"
            borderColor="border.strong"
            _hover={{ borderColor: 'border.accent' }}
            _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
            borderRadius="md"
          >
            <option value="auto">Automático (Recomendado - Menor Impuesto)</option>
            <option value="exempt25">Renta Exenta 25% (Art. 206 - Tope 790 UVT)</option>
            <option value="actualCosts">Costos y Gastos Reales (Art. 336)</option>
            <option value="legacyPresumptive">Modo Clásico (25% Presuntivo sin tope)</option>
          </Select>
        </FormControl>

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
          <FormControl isInvalid={!dependentsValid}>
            <FormLabel
              htmlFor="dependents-input"
              fontSize="xs"
              fontWeight="semibold"
              color="text.primary"
              mb={1}
            >
              Dependientes (0 a 4+)
            </FormLabel>
            <Input
              id="dependents-input"
              size="sm"
              type="number"
              min={0}
              max={20}
              value={form.dependentsCount}
              onChange={(e) => onChange('dependentsCount', e.target.value)}
              bg="bg.input"
              color="text.primary"
              borderColor={!dependentsValid ? 'accent.danger' : 'border.strong'}
              _hover={{ borderColor: !dependentsValid ? 'accent.danger' : 'border.accent' }}
              _focusVisible={{
                borderColor: !dependentsValid ? 'accent.danger' : 'accent.primary',
                boxShadow: 'none',
              }}
              borderRadius="md"
            />
            {!dependentsValid ? (
              <Text mt={1} fontSize="xs" color="accent.danger">
                Ingrese un número entero entre 0 y 20.
              </Text>
            ) : (
              <Text mt={1} fontSize="xs" color="text.secondary">
                {dependentsNum > 0
                  ? `Art. 387: 10% (tope 384 UVT = ${formatCOP(384 * uvt)}) + ${extraDepsCount}×72 UVT fuera de tope (${formatCOP(extraDepsCount * 72 * uvt)})`
                  : 'Sin dependientes económicos'}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <Flex justify="space-between" align="baseline" gap={2} mb={1}>
              <FormLabel
                htmlFor="arl-select"
                fontSize="xs"
                fontWeight="semibold"
                color="text.primary"
                mb={0}
              >
                Nivel de Riesgo ARL
              </FormLabel>
              <Text fontSize="xs" color="text.muted">
                Opcional
              </Text>
            </Flex>
            <Select
              id="arl-select"
              size="sm"
              value={form.arlRate}
              onChange={(e) => onChange('arlRate', e.target.value)}
              bg="bg.input"
              color="text.primary"
              borderColor="border.strong"
              _hover={{ borderColor: 'border.accent' }}
              _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
              borderRadius="md"
            >
              {ARL_RISK_LEVELS.map((opt) => (
                <option key={opt.level} value={String(opt.rate)}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <FormControl isInvalid={prepaidHasError}>
          <Flex justify="space-between" align="baseline" gap={2} mb={1.5} wrap="wrap">
            <FormLabel
              htmlFor="prepaid-health-input"
              fontSize="xs"
              fontWeight="semibold"
              color="text.primary"
              mb={0}
            >
              Medicina Prepagada / Seguros de Salud
            </FormLabel>
            <Text fontSize="xs" color="text.muted">
              Tope 16 UVT/mes ({formatCOP(192 * uvt)}/año)
            </Text>
          </Flex>
          <HStack spacing={2} mb={2}>
            <Button
              type="button"
              size="xs"
              variant={form.prepaidHealthPeriod === 'annual' ? 'solid' : 'outline'}
              bg={form.prepaidHealthPeriod === 'annual' ? 'accent.primary' : 'bg.subtle'}
              color={form.prepaidHealthPeriod === 'annual' ? '#ffffff' : 'text.primary'}
              borderColor={
                form.prepaidHealthPeriod === 'annual' ? 'accent.primary' : 'border.subtle'
              }
              _hover={{ opacity: 0.9 }}
              onClick={() => onChange('prepaidHealthPeriod', 'annual')}
            >
              Valor Anual
            </Button>
            <Button
              type="button"
              size="xs"
              variant={form.prepaidHealthPeriod === 'monthly' ? 'solid' : 'outline'}
              bg={form.prepaidHealthPeriod === 'monthly' ? 'accent.primary' : 'bg.subtle'}
              color={form.prepaidHealthPeriod === 'monthly' ? '#ffffff' : 'text.primary'}
              borderColor={
                form.prepaidHealthPeriod === 'monthly' ? 'accent.primary' : 'border.subtle'
              }
              _hover={{ opacity: 0.9 }}
              onClick={() => onChange('prepaidHealthPeriod', 'monthly')}
            >
              Valor Mensual (×12)
            </Button>
          </HStack>
          <Input
            id="prepaid-health-input"
            size="sm"
            type="text"
            inputMode="numeric"
            value={form.prepaidHealthText}
            onChange={(e) => onChange('prepaidHealthText', e.target.value)}
            placeholder="0"
            bg="bg.input"
            color="text.primary"
            borderColor={prepaidHasError ? 'accent.danger' : 'border.strong'}
            _hover={{ borderColor: prepaidHasError ? 'accent.danger' : 'border.accent' }}
            _focusVisible={{
              borderColor: prepaidHasError ? 'accent.danger' : 'accent.primary',
              boxShadow: 'none',
            }}
            borderRadius="md"
          />
          {prepaidHasError && (
            <Text mt={1} fontSize="xs" color="accent.danger">
              {prepaidParsed.error ?? 'Valor numérico inválido'}
            </Text>
          )}
          {prepaidParsed.value !== null && prepaidParsed.value > 0 && (
            <Text mt={1} fontSize="xs" color="text.secondary">
              Equivalente anual: {formatCOP(prepaidAnnualEquivalent)}
            </Text>
          )}
        </FormControl>

        <CurrencyField
          id="housing-interest-input"
          label="Intereses de Vivienda (Anual)"
          hint={`Tope 100 UVT/mes (${formatCOP(1200 * uvt)}/año)`}
          value={form.housingInterestText}
          onChange={(v) => onChange('housingInterestText', v)}
        />

        <CurrencyField
          id="voluntary-pension-input"
          label="Aportes Voluntarios FPV / AFC (Anual)"
          hint={`Tope 30% ó 3.800 UVT (${formatCOP(3800 * uvt)})`}
          value={form.voluntaryPensionText}
          onChange={(v) => onChange('voluntaryPensionText', v)}
        />

        <CurrencyField
          id="actual-costs-input"
          label="Costos y Gastos Procedentes (Anual)"
          hint="Comparación Opción B (Art. 336)"
          value={form.actualCostsText}
          onChange={(v) => onChange('actualCostsText', v)}
        />

        <CurrencyField
          id="electronic-invoice-input"
          label="Compras con Factura Electrónica (Anual)"
          hint={`Deduce 1% hasta 240 UVT (${formatCOP(240 * uvt)}) fuera de tope`}
          value={form.electronicInvoicePurchasesText}
          onChange={(v) => onChange('electronicInvoicePurchasesText', v)}
        />

        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
          <CurrencyField
            id="gmf-input"
            label="4x1000 / GMF Pagado (Anual)"
            hint="Deduce 50%"
            value={form.gmfText}
            onChange={(v) => onChange('gmfText', v)}
          />

          <CurrencyField
            id="withholdings-input"
            label="Retención en la Fuente (Anual)"
            hint="Resta del ahorro final"
            value={form.withholdingsPaidText}
            onChange={(v) => onChange('withholdingsPaidText', v)}
          />
        </SimpleGrid>
      </VStack>
    </Box>
  );
};
