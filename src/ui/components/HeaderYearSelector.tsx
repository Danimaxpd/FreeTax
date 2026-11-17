import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { OFFICIAL_LAW_LINKS } from '../../constants/tax-values';
import { TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

export type ThemeMode = 'dark' | 'light';

interface HeaderYearSelectorProps {
  availableYears: number[];
  selectedYear: number;
  config: TaxYearConfig;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectYear: (year: number) => void;
  onOpenYearModal: () => void;
}

export const HeaderYearSelector: React.FC<HeaderYearSelectorProps> = ({
  availableYears,
  selectedYear,
  config,
  theme,
  onToggleTheme,
  onSelectYear,
  onOpenYearModal,
}) => {
  const healthPct = (config.contributions.health.rate * 100).toFixed(1);
  const pensionPct = (config.contributions.pension.rate * 100).toFixed(1);
  const ibcPct = (config.contributions.health.base * 100).toFixed(0);

  return (
    <Box
      as="header"
      bg="bg.header"
      color="#e2e8f0"
      p={{ base: 4, md: 6 }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.subtle"
      boxShadow="lg"
      mb={5}
    >
      <VStack align="stretch" spacing={4}>
        <Flex
          justify="space-between"
          align="flex-start"
          wrap={{ base: 'wrap', lg: 'nowrap' }}
          gap={4}
        >
          <Box flex="1" minW={0}>
            <Heading as="h1" size="md" color="#ffffff" letterSpacing="-0.02em" mb={1}>
              Planeador Tributario Colombia — Renta, PILA y Ahorro Mensual
            </Heading>
            <Text fontSize="sm" color="#a9b1d6">
              Simulador en memoria para trabajadores independientes ·{' '}
              {config.lawLabel ?? 'Ley 2277 de 2022 · Estatuto Tributario'}
            </Text>

            <HStack spacing={2} wrap="wrap" mt={3}>
              <Badge
                px={2.5}
                py={1}
                borderRadius="full"
                bg="rgba(122, 162, 247, 0.18)"
                color="#c0caf5"
                borderWidth="1px"
                borderColor="rgba(122, 162, 247, 0.35)"
                textTransform="none"
                fontSize="xs"
                fontWeight="medium"
              >
                Año Fiscal {selectedYear}
              </Badge>
              <Badge
                px={2.5}
                py={1}
                borderRadius="full"
                bg="rgba(125, 207, 255, 0.14)"
                color="#7dcfff"
                borderWidth="1px"
                borderColor="rgba(125, 207, 255, 0.3)"
                textTransform="none"
                fontSize="xs"
                fontWeight="medium"
              >
                UVT: {formatCOP(config.uvt)}
              </Badge>
              <Badge
                px={2.5}
                py={1}
                borderRadius="full"
                bg="rgba(115, 218, 202, 0.14)"
                color="#73daca"
                borderWidth="1px"
                borderColor="rgba(115, 218, 202, 0.3)"
                textTransform="none"
                fontSize="xs"
                fontWeight="medium"
              >
                SMMLV: {formatCOP(config.minimumWage)}
              </Badge>
              <Badge
                px={2.5}
                py={1}
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.1)"
                color="#c0caf5"
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.18)"
                textTransform="none"
                fontSize="xs"
                fontWeight="medium"
              >
                IBC {ibcPct}% · Salud {healthPct}% · Pensión {pensionPct}%
              </Badge>
            </HStack>
          </Box>

          <HStack spacing={2.5} flexShrink={0} wrap={{ base: 'wrap', lg: 'nowrap' }}>
            <HStack
              spacing={1}
              p={1}
              borderRadius="lg"
              bg="rgba(255, 255, 255, 0.08)"
              role="group"
              aria-label="Seleccionar año fiscal"
              flexShrink={0}
            >
              {availableYears.map((yr) => {
                const isActive = yr === selectedYear;
                return (
                  <Button
                    key={yr}
                    size="sm"
                    variant="ghost"
                    px={3}
                    fontWeight="semibold"
                    bg={isActive ? '#7aa2f7' : 'transparent'}
                    color={isActive ? '#16161e' : '#c0caf5'}
                    _hover={{
                      bg: isActive ? '#7aa2f7' : 'rgba(255, 255, 255, 0.16)',
                      color: isActive ? '#16161e' : '#ffffff',
                    }}
                    onClick={() => onSelectYear(yr)}
                  >
                    {yr}
                  </Button>
                );
              })}
            </HStack>

            <Button
              size="sm"
              flexShrink={0}
              bg="rgba(255, 255, 255, 0.12)"
              color="#e2e8f0"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.24)"
              _hover={{
                bg: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }}
              onClick={onOpenYearModal}
            >
              + Personalizar Año
            </Button>

            <Button
              size="sm"
              w="148px"
              minW="148px"
              maxW="148px"
              justifyContent="center"
              flexShrink={0}
              bg="rgba(255, 255, 255, 0.12)"
              color="#e2e8f0"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.24)"
              _hover={{
                bg: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }}
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </Button>
          </HStack>
        </Flex>

        <Flex
          as="nav"
          aria-label="Normativa oficial colombiana"
          align="center"
          wrap="wrap"
          gap={2}
          pt={3}
          borderTopWidth="1px"
          borderColor="rgba(255, 255, 255, 0.12)"
        >
          <Text fontSize="xs" fontWeight="semibold" color="#a9b1d6" mr={1}>
            Consultar normativa oficial:
          </Text>
          {OFFICIAL_LAW_LINKS.map((law) => (
            <Link
              key={law.id}
              href={law.url}
              isExternal
              px={2.5}
              py={1}
              borderRadius="full"
              bg="rgba(26, 27, 38, 0.65)"
              borderWidth="1px"
              borderColor="rgba(122, 162, 247, 0.35)"
              color="#7dcfff"
              fontSize="xs"
              fontWeight="semibold"
              title={`${law.title} — ${law.description}`}
              _hover={{
                bg: 'rgba(122, 162, 247, 0.22)',
                borderColor: '#7dcfff',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              {law.shortLabel} ↗
            </Link>
          ))}
        </Flex>
      </VStack>
    </Box>
  );
};
