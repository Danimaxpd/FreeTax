import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { parseCurrencyInput } from '../../helpers/number';
import { AnnualTaxPlan } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';
import { IncomeMode } from './IncomePanel';

interface MonthlyCashFlowTableProps {
  plan: AnnualTaxPlan;
  incomeMode: IncomeMode;
  monthlyIncomeTexts: string[];
  onChangeMonthlyIncome: (monthIndex: number, value: string) => void;
  onEnableVariableModeFromTable: () => void;
}

export const MonthlyCashFlowTable: React.FC<MonthlyCashFlowTableProps> = ({
  plan,
  incomeMode,
  monthlyIncomeTexts,
  onChangeMonthlyIncome,
  onEnableVariableModeFromTable,
}) => {
  const [showPilaBreakdown, setShowPilaBreakdown] = useState(false);
  const showArlColumn = plan.annualArlTotal > 0;
  const cellPx = showPilaBreakdown ? 2 : 3.5;
  const cellPy = showPilaBreakdown ? 2.5 : 3;

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
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3} mb={4}>
        <Box>
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
              PASO 2
            </Badge>
            <Heading as="h2" size="sm" color="text.heading">
              Plan de Ahorro y Flujo de Caja Mensual (12 Meses)
            </Heading>
          </HStack>
          <Text fontSize="sm" color="text.muted">
            Provisión mensual proporcional al ingreso bruto para cubrir la declaración de renta{' '}
            {plan.year} sin sorpresas de liquidez.
          </Text>
        </Box>

        <HStack spacing={2} wrap="wrap">
          {incomeMode === 'fixed' && (
            <Button
              size="sm"
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.subtle"
              color="text.primary"
              _hover={{ borderColor: 'border.accent', color: 'accent.primary' }}
              onClick={onEnableVariableModeFromTable}
              title="Cambiar a modo variable para editar cada mes directamente en la tabla"
            >
              ✎ Editar ingresos mes a mes
            </Button>
          )}

          <Button
            size="sm"
            bg={showPilaBreakdown ? 'accent.primary' : 'bg.subtle'}
            color={showPilaBreakdown ? '#16161e' : 'text.primary'}
            borderWidth="1px"
            borderColor={showPilaBreakdown ? 'accent.primary' : 'border.subtle'}
            _hover={{
              bg: showPilaBreakdown ? 'accent.primary' : 'bg.accentSoft',
              borderColor: 'border.accent',
            }}
            onClick={() => setShowPilaBreakdown((prev) => !prev)}
            aria-pressed={showPilaBreakdown}
          >
            {showPilaBreakdown
              ? 'Vista Simplificada'
              : 'Ver Desglose PILA (IBC, Salud, Pensión, FSP)'}
          </Button>
        </HStack>
      </Flex>

      <TableContainer
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="lg"
        overflowX="auto"
      >
        <Table
          variant="unstyled"
          size="sm"
          className={`data-table ${showPilaBreakdown ? '' : 'table-simplified'}`}
          fontSize={showPilaBreakdown ? 'xs' : 'sm'}
        >
          <Thead bg="bg.subtle">
            <Tr>
              <Th
                px={cellPx}
                py={cellPy}
                textAlign="left"
                color="text.secondary"
                borderBottomWidth="1px"
                borderColor="border.subtle"
                whiteSpace="nowrap"
              >
                Mes
              </Th>
              <Th
                px={cellPx}
                py={cellPy}
                isNumeric
                color="text.secondary"
                borderBottomWidth="1px"
                borderColor="border.subtle"
                whiteSpace="nowrap"
              >
                Ingreso Bruto
              </Th>
              {showPilaBreakdown ? (
                <>
                  <Th
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    color="text.secondary"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    IBC (40%)
                  </Th>
                  <Th
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    color="text.secondary"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    Salud
                  </Th>
                  <Th
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    color="text.secondary"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    Pensión
                  </Th>
                  <Th
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    color="text.secondary"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    FSP
                  </Th>
                  {showArlColumn && (
                    <Th
                      px={cellPx}
                      py={cellPy}
                      isNumeric
                      color="text.secondary"
                      borderBottomWidth="1px"
                      borderColor="border.subtle"
                      whiteSpace="nowrap"
                    >
                      ARL
                    </Th>
                  )}
                  <Th
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    color="text.secondary"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    Total PILA
                  </Th>
                </>
              ) : (
                <Th
                  px={cellPx}
                  py={cellPy}
                  isNumeric
                  color="text.secondary"
                  borderBottomWidth="1px"
                  borderColor="border.subtle"
                  whiteSpace="nowrap"
                >
                  Total PILA (Salud+Pensión+FSP{showArlColumn ? '+ARL' : ''})
                </Th>
              )}
              <Th
                px={cellPx}
                py={cellPy}
                isNumeric
                color="text.secondary"
                borderBottomWidth="1px"
                borderColor="border.subtle"
                whiteSpace="nowrap"
              >
                {showPilaBreakdown ? 'Ahorro Renta' : 'Ahorro Mensual Renta'}
              </Th>
              <Th
                px={cellPx}
                py={cellPy}
                isNumeric
                color="text.secondary"
                borderBottomWidth="1px"
                borderColor="border.subtle"
                whiteSpace="nowrap"
              >
                {showPilaBreakdown ? 'Ahorro Acumulado' : 'Ahorro Renta Acumulado'}
              </Th>
              <Th
                px={cellPx}
                py={cellPy}
                isNumeric
                color="text.secondary"
                borderBottomWidth="1px"
                borderColor="border.subtle"
                whiteSpace="nowrap"
              >
                {showPilaBreakdown ? 'Neto Disponible' : 'Ingreso Neto Disponible'}
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {plan.months.map((m) => {
              const rawText = monthlyIncomeTexts[m.monthIndex] ?? '0';
              const parsed = parseCurrencyInput(rawText, { allowZero: true, min: 0 });
              return (
                <Tr
                  key={m.monthIndex}
                  bg="bg.surface"
                  _hover={{ bg: 'bg.subtle' }}
                  transition="background 0.12s ease"
                >
                  <Td
                    px={cellPx}
                    py={cellPy}
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    fontWeight="bold"
                    color="text.heading"
                    whiteSpace="nowrap"
                  >
                    {m.monthName}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    {incomeMode === 'variable' ? (
                      <Input
                        aria-label={`Ingreso bruto ${m.monthName}`}
                        size="xs"
                        w="130px"
                        textAlign="right"
                        bg={parsed.value === null ? 'bg.dangerSoft' : 'bg.input'}
                        borderColor={parsed.value === null ? 'accent.danger' : 'border.subtle'}
                        color="text.primary"
                        type="text"
                        inputMode="numeric"
                        value={rawText}
                        onChange={(e) => onChangeMonthlyIncome(m.monthIndex, e.target.value)}
                      />
                    ) : (
                      formatCOP(m.grossIncome)
                    )}
                  </Td>
                  {showPilaBreakdown && (
                    <>
                      <Td
                        px={cellPx}
                        py={cellPy}
                        isNumeric
                        borderBottomWidth="1px"
                        borderColor="border.subtle"
                        whiteSpace="nowrap"
                      >
                        {formatCOP(m.ibc)}
                      </Td>
                      <Td
                        px={cellPx}
                        py={cellPy}
                        isNumeric
                        borderBottomWidth="1px"
                        borderColor="border.subtle"
                        whiteSpace="nowrap"
                      >
                        {formatCOP(m.health)}
                      </Td>
                      <Td
                        px={cellPx}
                        py={cellPy}
                        isNumeric
                        borderBottomWidth="1px"
                        borderColor="border.subtle"
                        whiteSpace="nowrap"
                      >
                        {formatCOP(m.pension)}
                      </Td>
                      <Td
                        px={cellPx}
                        py={cellPy}
                        isNumeric
                        borderBottomWidth="1px"
                        borderColor="border.subtle"
                        whiteSpace="nowrap"
                      >
                        {formatCOP(m.fsp)}
                      </Td>
                      {showArlColumn && (
                        <Td
                          px={cellPx}
                          py={cellPy}
                          isNumeric
                          borderBottomWidth="1px"
                          borderColor="border.subtle"
                          whiteSpace="nowrap"
                        >
                          {formatCOP(m.arl)}
                        </Td>
                      )}
                    </>
                  )}
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(m.totalPila)}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    color="accent.primary"
                    fontWeight="bold"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(m.taxSavingsProvision)}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(m.cumulativeTaxSaved)}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    color="accent.success"
                    fontWeight="bold"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(m.netSpendableIncome)}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>

          <Tfoot bg="bg.subtle">
            <Tr>
              <Td
                px={cellPx}
                py={cellPy}
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                color="text.heading"
                whiteSpace="nowrap"
              >
                Total Anual
              </Td>
              <Td
                px={cellPx}
                py={cellPy}
                isNumeric
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                whiteSpace="nowrap"
              >
                {formatCOP(plan.annualGrossIncome)}
              </Td>
              {showPilaBreakdown && (
                <>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    fontWeight="bold"
                    borderTopWidth="2px"
                    borderColor="border.strong"
                    whiteSpace="nowrap"
                  >
                    —
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    fontWeight="bold"
                    borderTopWidth="2px"
                    borderColor="border.strong"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(plan.annualHealthTotal)}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    fontWeight="bold"
                    borderTopWidth="2px"
                    borderColor="border.strong"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(plan.annualPensionTotal)}
                  </Td>
                  <Td
                    px={cellPx}
                    py={cellPy}
                    isNumeric
                    fontWeight="bold"
                    borderTopWidth="2px"
                    borderColor="border.strong"
                    whiteSpace="nowrap"
                  >
                    {formatCOP(plan.annualFspTotal)}
                  </Td>
                  {showArlColumn && (
                    <Td
                      px={cellPx}
                      py={cellPy}
                      isNumeric
                      fontWeight="bold"
                      borderTopWidth="2px"
                      borderColor="border.strong"
                      whiteSpace="nowrap"
                    >
                      {formatCOP(plan.annualArlTotal)}
                    </Td>
                  )}
                </>
              )}
              <Td
                px={cellPx}
                py={cellPy}
                isNumeric
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                whiteSpace="nowrap"
              >
                {formatCOP(plan.annualPilaTotal)}
              </Td>
              <Td
                px={cellPx}
                py={cellPy}
                isNumeric
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                color="accent.primary"
                whiteSpace="nowrap"
              >
                {formatCOP(plan.netAnnualTaxToSave)}
              </Td>
              <Td
                px={cellPx}
                py={cellPy}
                isNumeric
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                whiteSpace="nowrap"
              >
                {formatCOP(plan.netAnnualTaxToSave)}
              </Td>
              <Td
                px={cellPx}
                py={cellPy}
                isNumeric
                fontWeight="bold"
                borderTopWidth="2px"
                borderColor="border.strong"
                color="accent.success"
                whiteSpace="nowrap"
              >
                {formatCOP(plan.annualNetSpendableIncome)}
              </Td>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
    </Box>
  );
};
